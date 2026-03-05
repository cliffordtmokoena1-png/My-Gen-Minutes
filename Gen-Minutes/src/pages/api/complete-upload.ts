import { getAuth } from "@clerk/nextjs/server";
import { NextApiRequest, NextApiResponse } from "next";
import { S3Client, CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";
import { assertString } from "@/utils/assert";
import { getTranscriptBucketNameByRegion, getUploadKey, Region } from "@/utils/s3";
import withErrorReporting from "@/error/withErrorReporting";
import { connect } from "@planetscale/database";

export type ApiCompleteUploadResponse = {};

export type CompleteUploadParams = {
  transcriptId: number;
  uploadId: string;
  parts: Array<{
    ETag: string;
    PartNumber: number;
  }>;
  userId?: string; // For regular uploads (with user auth check)
  isAdminUpload?: boolean; // For admin uploads (skip user auth check and trigger webhook)
  isRecording?: boolean; // For recorder uploads
};

export async function completeUpload(params: CompleteUploadParams): Promise<void> {
  const { transcriptId, uploadId, parts, userId, isAdminUpload, isRecording } = params;

  const conn = connect({
    host: process.env.PLANETSCALE_DB_HOST,
    username: process.env.PLANETSCALE_DB_USERNAME,
    password: process.env.PLANETSCALE_DB_PASSWORD,
  });

  const selectQuery = isAdminUpload
    ? "SELECT aws_region, upload_kind FROM transcripts WHERE id = ?;"
    : "SELECT aws_region FROM transcripts WHERE id = ? AND userId = ?;";

  const selectParams = isAdminUpload ? [transcriptId] : [transcriptId, userId];

  const rows = await conn.execute(selectQuery, selectParams).then((res) => res.rows);

  if (!rows || rows.length === 0) {
    throw new Error("Transcript not found or access denied");
  }

  const region: Region = rows[0]["aws_region"];

  const s3 = new S3Client({
    credentials: {
      accessKeyId: assertString(process.env.AWS_ACCESS_KEY_ID),
      secretAccessKey: assertString(process.env.AWS_SECRET_ACCESS_KEY),
    },
    region,
  });

  const key = getUploadKey(transcriptId, isAdminUpload ? { env: "prod" } : undefined);

  const command = new CompleteMultipartUploadCommand({
    Bucket: getTranscriptBucketNameByRegion(region),
    Key: key,
    UploadId: uploadId,
    MultipartUpload: { Parts: parts },
  });

  await s3.send(command);

  if (isRecording) {
    await conn.execute(
      `UPDATE recording_sessions AS rs
     JOIN transcripts AS t
       ON t.id = rs.transcript_id
     SET
       rs.recording_state = ?,
       rs.updated_at = UTC_TIMESTAMP(),
       t.recording_state = 1
     WHERE
       rs.transcript_id = ? AND
       rs.user_id = ?`,
      ["completed", transcriptId, userId]
    );
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse<ApiCompleteUploadResponse>) {
  const { userId } = getAuth(req);
  if (userId == null) {
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
    userId,
  });

  return res.status(200).json({});
}

export default withErrorReporting(handler);
