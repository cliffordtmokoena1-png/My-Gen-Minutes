import { getAuth } from "@clerk/nextjs/server";
import { NextApiRequest, NextApiResponse } from "next";
import withErrorReporting from "@/error/withErrorReporting";
import { completeUpload, ApiCompleteUploadResponse } from "../complete-upload";

export type ApiAdminCompleteUploadResponse = ApiCompleteUploadResponse;

async function handler(req: NextApiRequest, res: NextApiResponse<ApiAdminCompleteUploadResponse>) {
  const { userId: adminUserId, sessionClaims } = getAuth(req);

  if (!adminUserId || !sessionClaims?.role || sessionClaims.role !== "admin") {
    return res.status(401).json({});
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const transcriptId: number = body["transcriptId"];
  const uploadId: string = body["uploadId"];
  const parts: Array<{
    ETag: string;
    PartNumber: number;
  }> = body["parts"];

  await completeUpload({
    transcriptId,
    uploadId,
    parts,
    isAdminUpload: true,
  });

  return res.status(200).json({});
}

export default withErrorReporting(handler);
