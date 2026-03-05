import { getAuth } from "@clerk/nextjs/server";
import { connect } from "@planetscale/database";
import { NextRequest } from "next/server";
import withErrorReporting from "@/error/withErrorReporting";
import { resolveRequestContext } from "@/utils/resolveRequestContext";

function generateSeriesId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `${timestamp}${randomPart}`.toUpperCase().substring(0, 26);
}

export const config = {
  runtime: "edge",
};

const MAX_SOURCE_TEXT_LENGTH = 20000;

type CreateAgendaRequest = {
  sourceText: string;
  title?: string;
  orgId?: string | null;
};

type AgendaListItem = {
  id: number;
  seriesId: string;
  title: string | null;
  status: string;
  updatedAt: string;
  createdAt: string;
};

async function handler(req: NextRequest) {
  const auth = getAuth(req);
  if (auth.userId == null) {
    return new Response(null, { status: 401 });
  }

  const conn = connect({
    host: process.env.PLANETSCALE_DB_HOST,
    username: process.env.PLANETSCALE_DB_USERNAME,
    password: process.env.PLANETSCALE_DB_PASSWORD,
  });

  if (req.method === "POST") {
    let body: CreateAgendaRequest;
    try {
      body = await req.json();
    } catch (error) {
      return new Response(JSON.stringify({ message: "Invalid JSON in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { sourceText, title, orgId: requestOrgId } = body;

    const { userId, orgId } = await resolveRequestContext(auth.userId, requestOrgId, req.headers);

    if (!sourceText || sourceText.trim().length === 0) {
      return new Response(JSON.stringify({ message: "Source text is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (sourceText.length > MAX_SOURCE_TEXT_LENGTH) {
      return new Response(
        JSON.stringify({
          message: `Source text exceeds maximum length of ${MAX_SOURCE_TEXT_LENGTH} characters`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const seriesId = generateSeriesId();

    const result = await conn.execute(
      `INSERT INTO agendas (
        series_id, user_id, org_id, version, status, title, source_kind, source_text, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [seriesId, userId, orgId, 1, "pending", title || null, "text", sourceText]
    );

    const agendaId = result.insertId;

    return new Response(
      JSON.stringify({
        id: agendaId,
        seriesId,
        status: "pending",
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } else if (req.method === "GET") {
    const url = new URL(req.url);
    const limit = Number.parseInt(url.searchParams.get("limit") || "20");
    const offset = Number.parseInt(url.searchParams.get("offset") || "0");
    const requestOrgId = url.searchParams.get("orgId");

    const { userId, orgId } = await resolveRequestContext(auth.userId, requestOrgId, req.headers);

    let query: string;
    let params: any[];

    if (orgId) {
      query = `SELECT id, series_id, title, status, updated_at, created_at
               FROM agendas
               WHERE org_id = ? AND version = 1
               ORDER BY updated_at DESC
               LIMIT ? OFFSET ?`;
      params = [orgId, limit, offset];
    } else {
      query = `SELECT id, series_id, title, status, updated_at, created_at
               FROM agendas
               WHERE user_id = ? AND org_id IS NULL AND version = 1
               ORDER BY updated_at DESC
               LIMIT ? OFFSET ?`;
      params = [userId, limit, offset];
    }

    const rows = await conn.execute(query, params).then((res) => res.rows);

    const agendas: AgendaListItem[] = rows.map((row: any) => ({
      id: row.id,
      seriesId: row.series_id,
      title: row.title,
      status: row.status,
      updatedAt: row.updated_at,
      createdAt: row.created_at,
    }));

    return new Response(JSON.stringify({ agendas }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ message: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
}

export default withErrorReporting(handler);
