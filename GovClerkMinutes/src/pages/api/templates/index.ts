import { getAuth } from "@clerk/nextjs/server";
import { NextApiRequest, NextApiResponse } from "next";
import { connect } from "@planetscale/database";

import withErrorReporting from "@/error/withErrorReporting";
import { Template } from "@/types/Template";
import { resolveRequestContext } from "@/utils/resolveRequestContext";

type TemplatesApiResponse = {
  templates: Template[];
};

const PLANETSCALE_CONFIG = {
  host: process.env.PLANETSCALE_DB_HOST,
  username: process.env.PLANETSCALE_DB_USERNAME,
  password: process.env.PLANETSCALE_DB_PASSWORD,
};

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TemplatesApiResponse | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = getAuth(req);
  if (auth.userId == null) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const orgIdParam = req.query.orgId as string | undefined;
  const { userId, orgId } = await resolveRequestContext(auth.userId, orgIdParam, req.headers);

  const conn = connect(PLANETSCALE_CONFIG);

  let query: string;
  let params: (string | null)[];

  if (orgId) {
    query = `
      SELECT
        template_id,
        user_id,
        org_id,
        is_default,
        name,
        description,
        category,
        content,
        preview,
        use_case,
        advantages
      FROM gc_templating
      WHERE (is_default = 1 AND user_id IS NULL AND org_id IS NULL) OR org_id = ?
      ORDER BY is_default DESC, created_at DESC
    `;
    params = [orgId];
  } else {
    query = `
      SELECT
        template_id,
        user_id,
        org_id,
        is_default,
        name,
        description,
        category,
        content,
        preview,
        use_case,
        advantages
      FROM gc_templating
      WHERE (is_default = 1 AND user_id IS NULL AND org_id IS NULL) OR (user_id = ? AND org_id IS NULL)
      ORDER BY is_default DESC, created_at DESC
    `;
    params = [userId];
  }

  const result = await conn.execute<{
    template_id: string;
    user_id: string | null;
    org_id: string | null;
    is_default: number;
    name: string;
    description: string | null;
    category: string;
    content: string;
    preview: string | null;
    use_case: string | null;
    advantages: string | null;
  }>(query, params);

  const templates: Template[] = result.rows.map((row) => {
    let parsedAdvantages: string[] = [];

    if (row.advantages) {
      try {
        const parsed = JSON.parse(row.advantages);
        if (Array.isArray(parsed)) {
          parsedAdvantages = parsed.map((item) => String(item));
        }
      } catch (error) {
        parsedAdvantages = [];
      }
    }

    return {
      id: row.template_id,
      name: row.name,
      description: row.description ?? "",
      category: row.category as Template["category"],
      preview: row.preview ?? "",
      content: row.content,
      useCase: row.use_case ?? "",
      advantages: parsedAdvantages,
      isCustom: orgId ? row.org_id === orgId : row.user_id === userId,
    };
  });

  return res.status(200).json({ templates });
}

export default withErrorReporting(handler);
