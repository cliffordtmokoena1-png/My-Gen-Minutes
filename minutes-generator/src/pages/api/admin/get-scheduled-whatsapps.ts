import { getAuth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import withErrorReporting from "@/error/withErrorReporting";
import { connect } from "@planetscale/database";

export const config = {
  runtime: "edge",
};

async function handler(req: NextRequest) {
  const { userId: adminUserId, sessionClaims } = getAuth(req);
  if (!adminUserId || !sessionClaims?.role || sessionClaims.role !== "admin") {
    return new Response(null, { status: 401 });
  }

  const conn = connect({
    host: process.env.PLANETSCALE_DB_HOST,
    username: process.env.PLANETSCALE_DB_USERNAME,
    password: process.env.PLANETSCALE_DB_PASSWORD,
  });

  const rows = await conn
    .execute(
      `
    SELECT whatsapp_id, template_id, send_at, sender_user_id, is_sent
    FROM mg_scheduled_whatsapps
    ORDER BY send_at DESC
    LIMIT 100
    `,
      []
    )
    .then((result) => result.rows);

  return new Response(JSON.stringify(rows), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export default withErrorReporting(handler);
