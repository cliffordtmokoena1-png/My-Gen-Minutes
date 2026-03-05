import { getAuth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import withErrorReporting from "@/error/withErrorReporting";
import { assertString } from "@/utils/assert";
import get_presigned_url from "@/s3/get_presigned_url";
import type { BucketName, Region } from "@/utils/s3";

export const config = {
  runtime: "edge",
};

async function handler(req: NextRequest) {
  const { userId, sessionClaims } = getAuth(req);
  if (!userId || !sessionClaims?.role || sessionClaims.role !== "admin") {
    return new Response(null, { status: 401 });
  }

  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  if (!key) {
    return new Response(JSON.stringify({ error: "Missing required query param: key" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // WhatsApp media lives in a dedicated bucket/region.
  const bucket: BucketName = "GovClerkMinuteswhatsapp";
  const region: Region = "us-east-2";

  const accessKeyId = assertString(process.env.AWS_WHATSAPP_ACCESS_KEY);
  const secretAccessKey = assertString(process.env.AWS_WHATSAPP_ACCESS_KEY_SECRET);

  const { presignedUrl } = await get_presigned_url({
    key,
    method: "GET",
    expiresInSecs: 600,
    bucket,
    region,
    accessKeyId,
    secretAccessKey,
  });

  return Response.redirect(presignedUrl, 302);
}

export default withErrorReporting(handler);
