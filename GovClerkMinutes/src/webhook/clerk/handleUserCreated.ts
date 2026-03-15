import { createClerkClient } from "@clerk/nextjs/server";
import { upsertLeadToDb } from "@/crm/leads";
import { insertTemplateTranscript } from "@/templates/templates";
import { getClerkKeys } from "@/utils/clerk";
import { capture } from "@/utils/posthog";
import { sendWelcomeEmail } from "@/utils/postmark";
import type { Site } from "@/utils/site";
import { UserJSON } from "@clerk/nextjs/dist/types/server";
import { connect } from "@planetscale/database";

export async function handleUserCreated(body: UserJSON, site: Site): Promise<void> {
  const userId = body.id;

  const clerkClient = createClerkClient(getClerkKeys(site));
  await clerkClient.users.updateUserMetadata(userId, {
    publicMetadata: {
      isEnterprise: true,
    },
  });

  const email = body.email_addresses?.[0]?.email_address;
  const firstName = body.first_name ?? undefined;
  const skip_welcome_email = body?.public_metadata?.skip_welcome_email;

  if (email != null && !skip_welcome_email) {
    sendWelcomeEmail(email);
  }

  const conn = connect({
    host: process.env.PLANETSCALE_DB_HOST,
    username: process.env.PLANETSCALE_DB_USERNAME,
    password: process.env.PLANETSCALE_DB_PASSWORD,
  });

  if (email != null) {
    await Promise.all([
      conn.execute(
        `
        INSERT INTO gc_emails (email, campaign, user_id, first_name)
        VALUES (?, "signup_urgent", ?, ?);
        `,
        [email, userId, firstName]
      ),
      upsertLeadToDb({
        userId,
        email,
        firstName,
      }),
    ]);
  }

  await capture(
    "user_signup_webhook",
    {
      first_name: firstName,
    },
    userId
  );

  console.info(`[handleUserCreated] Granting 30 trial tokens to user ${userId}`);
  let tokenGranted = false;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await conn.execute('INSERT INTO payments (user_id, credit, action) VALUES (?, 30, "add");', [
        userId,
      ]);
      console.info(`[handleUserCreated] Successfully granted 30 trial tokens to user ${userId} (attempt ${attempt})`);
      tokenGranted = true;
      break;
    } catch (err) {
      console.error(`[handleUserCreated] Failed to grant 30 trial tokens to user ${userId} (attempt ${attempt}):`, err);
    }
  }
  if (!tokenGranted) {
    console.error(`[handleUserCreated] Exhausted retries granting trial tokens for user ${userId}. Tokens will be auto-granted on first dashboard visit.`);
  }

  await insertTemplateTranscript(userId);
}
