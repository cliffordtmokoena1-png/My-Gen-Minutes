import { assertString } from "@/utils/assert";
import { serverUri } from "@/utils/server";

export async function createAuthToken(userId: string): Promise<string> {
  const resp = await fetch(serverUri("/api/auth/create-auth-token"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${assertString(process.env.UPLOAD_COMPLETE_WEBHOOK_SECRET)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: userId,
    }),
  });

  if (!resp.ok) {
    throw new Error(`Auth token creation failed: ${resp.status} ${resp.statusText}`);
  }

  const { token } = await resp.json();
  return token;
}
