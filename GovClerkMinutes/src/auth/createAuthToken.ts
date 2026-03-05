import { assertString } from "@/utils/assert";
import { serverUri } from "@/utils/server";

export async function createAuthToken(userId: string): Promise<string> {
  const { token } = await fetch(serverUri("/api/auth/create-auth-token"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${assertString(process.env.UPLOAD_COMPLETE_WEBHOOK_SECRET)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: userId,
    }),
  }).then((resp) => resp.json());

  return token;
}
