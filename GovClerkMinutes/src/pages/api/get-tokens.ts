import { getAuth } from "@clerk/nextjs/server";
import { connect } from "@planetscale/database";
import withErrorReporting from "@/error/withErrorReporting";
import { NextRequest } from "next/server";
import { resolveRequestContext } from "@/utils/resolveRequestContext";

export const config = {
  runtime: "edge",
};

export async function getCurrentBalance(
  userId: string,
  orgId: string | null = null
): Promise<number | null> {
  const conn = connect({
    host: process.env.PLANETSCALE_DB_HOST,
    username: process.env.PLANETSCALE_DB_USERNAME,
    password: process.env.PLANETSCALE_DB_PASSWORD,
  });

  let query: string;
  let params: string[];

  if (orgId) {
    query = "SELECT SUM(credit) AS balance FROM payments WHERE org_id = ?;";
    params = [orgId];
  } else {
    query = "SELECT SUM(credit) AS balance FROM payments WHERE user_id = ? AND org_id IS NULL;";
    params = [userId];
  }

  const rows = await conn.execute(query, params).then((res) => res.rows);

  if (!rows || rows.length !== 1) {
    console.error("Bad balance query result:", rows);
    throw new Error("Bad balance query result");
  }

  const tokens: null | string = (rows[0] as { balance: string | null }).balance;
  if (tokens == null) {
    return tokens;
  }
  return parseInt(tokens);
}

async function handler(req: NextRequest) {
  const auth = getAuth(req);
  if (auth.userId == null) {
    return new Response(null, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { userId, orgId } = await resolveRequestContext(auth.userId, body.orgId, req.headers);

  const tokens = await getCurrentBalance(userId, orgId);

  // Self-healing: if the user has no payment rows (webhook likely failed silently),
  // auto-grant 30 trial tokens so the dashboard always shows a correct balance.
  if (tokens === null && !orgId) {
    console.warn(`[get-tokens] No payment rows for user ${userId}, auto-granting 30 trial tokens`);
    const conn = connect({
      host: process.env.PLANETSCALE_DB_HOST,
      username: process.env.PLANETSCALE_DB_USERNAME,
      password: process.env.PLANETSCALE_DB_PASSWORD,
    });
    try {
      await conn.execute(
        'INSERT INTO payments (user_id, credit, action) VALUES (?, 30, "add")',
        [userId]
      );
      console.info(`[get-tokens] Auto-granted 30 trial tokens to user ${userId}`);
      return new Response(JSON.stringify({ tokens: 30 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error(`[get-tokens] Failed to auto-grant tokens for user ${userId}:`, err);
      // Fall through: the user has no payment rows and the auto-grant failed,
      // so return 0 to always give the frontend a real number to display.
    }
  }

  return new Response(JSON.stringify({ tokens: tokens ?? 0 }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export default withErrorReporting(handler);
