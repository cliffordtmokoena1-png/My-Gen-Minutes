import { getAuth } from "@clerk/nextjs/server";
import type { NextApiRequest, NextApiResponse } from "next";
import withErrorReporting from "@/error/withErrorReporting";
import { connect } from "@planetscale/database";

type TokenResponse = {
  userId: string;
  amount: number;
  id: string;
};

async function modifyUserToken(userId: string, amount: number, isAdd: boolean): Promise<string> {
  const finalAmount = isAdd ? Math.abs(amount) : -Math.abs(amount);

  const conn = connect({
    host: process.env.PLANETSCALE_DB_HOST,
    username: process.env.PLANETSCALE_DB_USERNAME,
    password: process.env.PLANETSCALE_DB_PASSWORD,
  });

  const result = await conn.execute(
    "INSERT INTO payments (user_id, credit, action) VALUES (?, ?, ?)",
    [userId, finalAmount, "admin"]
  );

  return result.insertId.toString();
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TokenResponse | { error: string }>
) {
  const { userId, sessionClaims } = getAuth(req);

  if (!userId || !sessionClaims?.metadata?.role || sessionClaims.metadata.role !== "admin") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { userId: targetUserId, amount, action } = req.body;

  if (!targetUserId || typeof amount !== "number") {
    return res.status(400).json({ error: "Missing required fields: userId and amount" });
  }

  if (amount <= 0) {
    return res.status(400).json({ error: "Amount must be greater than zero" });
  }

  const transactionId = await modifyUserToken(targetUserId, amount, action === "add");

  return res.status(200).json({
    userId: targetUserId,
    amount: action === "add" ? Math.abs(amount) : -Math.abs(amount),
    id: transactionId,
  });
}

export default withErrorReporting(handler);
