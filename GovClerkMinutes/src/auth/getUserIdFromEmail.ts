import { assertString } from "@/utils/assert";
import { ClerkEnvironment, getClerkKeysFromEnv } from "@/utils/clerk";
import type { Site } from "@/utils/site";
import { UserResource } from "@clerk/types";

export type GetUserIdFromEmailParams = {
  email: string;
  env?: ClerkEnvironment;
  site?: Site;
};

export async function getUserIdFromEmail({
  email,
  env,
  site,
}: GetUserIdFromEmailParams): Promise<string | null> {
  const keys = getClerkKeysFromEnv(env, site);

  const res: Array<UserResource> = await fetch(
    `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`,
    {
      headers: {
        Authorization: `Bearer ${keys.secretKey}`,
      },
    }
  ).then((r) => r.json());

  if (res.length === 0) {
    return null;
  }

  return assertString(res[0].id);
}
