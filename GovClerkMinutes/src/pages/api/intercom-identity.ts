import { getAuth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import withErrorReporting from "@/error/withErrorReporting";

// Required environment variable: INTERCOM_SECRET_KEY (Intercom Unified Secret for identity verification)
export const config = {
  runtime: "edge",
};

async function generateHmac(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(message);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, msgData);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function handler(req: NextRequest) {
  const auth = getAuth(req);
  if (auth.userId == null) {
    return new Response(null, { status: 401 });
  }

  const secret = process.env.INTERCOM_SECRET_KEY;
  if (!secret) {
    return new Response(JSON.stringify({ error: "Intercom secret not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userHash = await generateHmac(secret, auth.userId);

  // Fetch user name from Clerk
  let name: string | null = null;
  try {
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (clerkSecretKey) {
      const userRes = await fetch(`https://api.clerk.com/v1/users/${auth.userId}`, {
        headers: { Authorization: `Bearer ${clerkSecretKey}` },
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        const firstName = userData.first_name || "";
        const lastName = userData.last_name || "";
        name = [firstName, lastName].filter(Boolean).join(" ") || null;
      }
    }
  } catch (e) {
    console.error("Failed to fetch user name from Clerk:", e);
  }

  return new Response(JSON.stringify({ user_hash: userHash, name }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export default withErrorReporting(handler);
