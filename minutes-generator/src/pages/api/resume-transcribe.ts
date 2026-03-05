import { getAuth } from "@clerk/nextjs/server";
import { serverUri } from "@/utils/server";
import { NextRequest } from "next/server";
import { assertString } from "@/utils/assert";
import { isDev } from "@/utils/dev";
import withErrorReporting from "@/error/withErrorReporting";
import { strictParseInt } from "@/utils/number";

export const config = {
  runtime: "edge",
};

export async function transcribeSegments(transcriptId: number) {
  const testQueryParam = isDev() ? "&test=1" : "";

  await fetch(serverUri(`/api/resume-transcribe?transcriptId=${transcriptId}${testQueryParam}`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
}

async function handler(req: NextRequest) {
  const { userId } = getAuth(req);
  if (userId == null) {
    return new Response(null, { status: 401 });
  }

  const transcriptId = strictParseInt(
    assertString(req.nextUrl.searchParams.get("transcriptId")),
    "transcript ID"
  );
  await transcribeSegments(transcriptId);

  return new Response(JSON.stringify({}), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export default withErrorReporting(handler);
