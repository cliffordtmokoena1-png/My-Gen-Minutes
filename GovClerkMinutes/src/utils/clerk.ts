import { assertString } from "./assert";
import { isDev, isPreview } from "./dev";
import type { Site } from "./site";

export type ClerkKeys = {
  publishableKey: string;
  secretKey: string;
  webhookKey: string;
};

// GovClerkMinutes keys
const MG_DEV_KEYS: ClerkKeys = {
  publishableKey: process.env.NEXT_PUBLIC_CLERK_TEST_PUBLISHABLE_KEY!,
  secretKey: process.env.CLERK_TEST_SECRET_KEY!,
  webhookKey: process.env.CLERK_TEST_WH_SECRET!,
};

const MG_PROD_KEYS: ClerkKeys = {
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
  secretKey: process.env.CLERK_SECRET_KEY!,
  webhookKey: process.env.CLERK_WH_SECRET!,
};

// GovClerk keys
const CD_DEV_KEYS: ClerkKeys = {
  publishableKey: process.env.NEXT_PUBLIC_GovClerk_TEST_PUBLISHABLE_KEY!,
  secretKey: process.env.GovClerk_TEST_SECRET_KEY!,
  webhookKey: process.env.GovClerk_TEST_WH_SECRET!,
};

const CD_PROD_KEYS: ClerkKeys = {
  publishableKey: process.env.NEXT_PUBLIC_GovClerk_PUBLISHABLE_KEY!,
  secretKey: process.env.GovClerk_SECRET_KEY!,
  webhookKey: process.env.GovClerk_WH_SECRET!,
};

function isDevOrPreview(): boolean {
  return isDev() || isPreview();
}

function validateClerkKeys(keys: ClerkKeys, site: Site): void {
  const isServer = typeof window === "undefined";
  const missing = !keys.publishableKey || (isServer && !keys.secretKey);
  if (!missing) {
    return;
  }
  if (isDevOrPreview()) {
    console.warn(
      `[clerk] Missing keys for site "${site}" — skipping validation in dev/preview. ` +
        "Set the corresponding env vars for full functionality."
    );
    return;
  }
  throw new Error(
    `Missing Clerk keys for site "${site}". ` +
      "Ensure the corresponding env vars are set (e.g. NEXT_PUBLIC_GovClerk_PUBLISHABLE_KEY, GovClerk_SECRET_KEY)."
  );
}

export function getClerkKeys(site?: Site): ClerkKeys {
  const s = site ?? "GovClerkMinutes";
  if (s === "GovClerk") {
    const keys = isDevOrPreview() ? CD_DEV_KEYS : CD_PROD_KEYS;
    validateClerkKeys(keys, s);
    return keys;
  }
  return isDevOrPreview() ? MG_DEV_KEYS : MG_PROD_KEYS;
}

export type WebhookKeyEntry = {
  key: string;
  site: Site;
};

export function getAllWebhookKeys(): WebhookKeyEntry[] {
  return (
    [
      { key: MG_PROD_KEYS.webhookKey, site: "GovClerkMinutes" as Site },
      { key: MG_DEV_KEYS.webhookKey, site: "GovClerkMinutes" as Site },
      { key: CD_PROD_KEYS.webhookKey, site: "GovClerk" as Site },
      { key: CD_DEV_KEYS.webhookKey, site: "GovClerk" as Site },
    ] satisfies WebhookKeyEntry[]
  ).filter((entry) => entry.key);
}

export type ClerkEnvironment = "dev" | "prod";

export function getClerkKeysFromEnv(env?: ClerkEnvironment, site?: Site): ClerkKeys {
  const s = site ?? "GovClerkMinutes";
  if (env === "prod") {
    return s === "GovClerk" ? CD_PROD_KEYS : MG_PROD_KEYS;
  } else if (env === "dev") {
    return s === "GovClerk" ? CD_DEV_KEYS : MG_DEV_KEYS;
  } else {
    return getClerkKeys(s);
  }
}

export async function createSignInToken(userId: string, site?: Site): Promise<string | null> {
  const { secretKey } = getClerkKeys(site);

  const response = await fetch("https://api.clerk.com/v1/sign_in_tokens", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: userId,
      expires_in_seconds: 60 * 20,
    }),
  });

  if (!response.ok) {
    console.error("Failed to create sign-in token:", response.status);
    return null;
  }

  const data = await response.json();
  return assertString(data.token);
}
