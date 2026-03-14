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
    query = "SELECT SUM(credit) FROM payments WHERE org_id = ?;";
    params = [orgId];
  } else {
    query = "SELECT SUM(credit) FROM payments WHERE user_id = ? AND org_id IS NULL;";
    params = [userId];
  }

  const rows = await conn.execute(query, params).then((res) => res.rows);

  if (!rows || rows.length !== 1) {
    console.error("Bad balance query result:", rows);
    throw new Error("Bad balance query result");
  }

  const credits: null | string = rows[0]["sum(credit)"];
  if (credits == null) {
    return credits;
  }
  return parseInt(credits);
}

async function handler(req: NextRequest) {
  const auth = getAuth(req);
  if (auth.userId == null) {
    return new Response(null, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { userId, orgId } = await resolveRequestContext(auth.userId, body.orgId, req.headers);

  const credits = await getCurrentBalance(userId, orgId);

  // NOTE: credits can be null if the user first logs in, and it takes a minute for the webhook to fire.
  // The sum() returns null, and the UI won't show credits. But it will revalidate and show 30 after a few seconds.
  return new Response(JSON.stringify({ credits }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export default withErrorReporting(handler);
