import { createClerkClient, User } from "@clerk/backend";
import { getAuth } from "@clerk/nextjs/server";
import type { NextApiRequest, NextApiResponse } from "next";
import { getClerkKeysFromEnv, ClerkEnvironment } from "@/utils/clerk";
import withErrorReporting from "@/error/withErrorReporting";
import { getCurrentBalance } from "../get-credits";
import type { Site } from "@/utils/site";

export type LookupUserApiResponse = {
  userId: string;
  email: string;
  displayName?: string;
  tokens: number;
};

async function tryClient(
  identifier: string,
  env: ClerkEnvironment,
  site: Site
): Promise<User | null> {
  const keys = getClerkKeysFromEnv(env, site);
  const client = createClerkClient({ secretKey: keys.secretKey });

  const isEmail = identifier.includes("@");

  try {
    if (isEmail) {
      const usersResponse = await client.users.getUserList({ emailAddress: [identifier] });
      if (usersResponse.data && usersResponse.data.length > 0) {
        return usersResponse.data[0];
      }
      return null;
    } else {
      return client.users.getUser(identifier);
    }
  } catch (_) {
    return null;
  }
}

type LookupResult = { kind: "success"; user: User } | { kind: "error"; err: string };

const LOOKUP_COMBOS: Array<{ env: ClerkEnvironment; site: Site }> = [
  { env: "prod", site: "GovClerkMinutes" },
  { env: "dev", site: "GovClerkMinutes" },
  { env: "prod", site: "GovClerk" },
  { env: "dev", site: "GovClerk" },
];

async function findUserIdByIdentifier(identifier: string): Promise<LookupResult> {
  const isEmail = identifier.includes("@");

  for (const { env, site } of LOOKUP_COMBOS) {
    const user = await tryClient(identifier, env, site);
    if (user) {
      return { kind: "success", user };
    }
  }

  return {
    kind: "error",
    err: isEmail
      ? `No user found with email: ${identifier}`
      : `No user found with ID: ${identifier}`,
  };
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LookupUserApiResponse | { error: string }>
) {
  const { userId, sessionClaims } = getAuth(req);

  if (!userId || !sessionClaims?.role || sessionClaims.role !== "admin") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { identifier } = req.body;

  if (!identifier) {
    return res.status(400).json({ error: "Email or user ID required" });
  }

  const lookupResult = await findUserIdByIdentifier(identifier);

  if (lookupResult.kind === "error") {
    return res.status(404).json({ error: lookupResult.err });
  }

  const { user } = lookupResult;

  const tokens = (await getCurrentBalance(user.id)) || 0;

  return res.status(200).json({
    userId: user.id,
    email: user.emailAddresses[0]?.emailAddress || "",
    displayName: [user.firstName, user.lastName].filter(Boolean).join(" ") || undefined,
    tokens: tokens,
  });
}

export default withErrorReporting(handler);
