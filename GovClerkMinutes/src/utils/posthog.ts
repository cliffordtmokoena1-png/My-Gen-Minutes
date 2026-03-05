import { PostHog } from "posthog-node";
import { assertString } from "./assert";
import { isDev } from "./dev";

export const TRAINING_REMINDER_ANONYMOUS_ID = "training_reminder";
export const WATI_WEBHOOK_ANONYMOUS_ID = "wati_webhook";
export const MG_WEBHOOK_ANONYMOUS_ID = "mg_webhook";
export const CLERK_WEBHOOK_ANONYMOUS_ID = "clerk_webhook";
export const WHATSAPP_WEBHOOK_ANONYMOUS_ID = "whatsapp_webhook";

export type PostHogEvent =
  | "api_toplevel_error"
  | "api_toplevel_bad_status_code"
  | "conversions_api_called"
  | "user_signup_webhook"
  | "transcribe_started"
  | "file_uploaded"
  | "file_segmented"
  | "transcribe_paused"
  | "user_magic_email_sent"
  | "user_magic_email_failed"
  | "user_purchase"
  | "transcript_deleted"
  | "transcript_renamed"
  | "s3_lambda_webhook_called"
  | "s3_lambda_webhook_failed"
  | "dashboard_get_serverside_props"
  | "subscription_canceled"
  | "subscription_renewed"
  | "whatsapp_contact_missing"
  | "whatsapp_error_stopping_email"
  | "whatsapp_inbound"
  | "whatsapp_inbound_error"
  | "whatsapp_outgoing_status"
  | "whatsapp_outgoing_status_error"
  | "whatsapp_scheduled_send_error"
  | "training_reminder"
  | "admin_upload_created"
  | "recording_started"
  | "recording_stopped"
  | "recording_paused"
  | "recording_resumed"
  | "recording_permission_denied"
  | "recording_error"
  | "recording_completed"
  | "recording_recovered"
  | "email_lead_added"
  | "email_lead_add_failed"
  | "post_signup_task_failed"
  | "account_deleted"
  | "custom_template_deleted"
  | "agenda_title_updated"
  | "agenda_exported"
  | "agenda_feedback_sent"
  | "quote_request_submitted"
  | "quote_request_failed"
  | "quote_request_blocked_personal_email"
  | "quote_request_hcaptcha_failed";

export async function capture(event: PostHogEvent, properties: any, distinctId: string) {
  const client = new PostHog(assertString(process.env.NEXT_PUBLIC_POSTHOG_KEY), {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
  });

  if (isDev()) {
    client.debug();
  }

  let groups;

  const transcriptId: number | undefined = properties["transcript_id"];
  if (transcriptId != null) {
    const groupKey = String(transcriptId);

    groups = {
      transcript: transcriptId,
    };

    client.groupIdentify({
      groupType: "transcript",
      groupKey,
      distinctId: "group:transcript",
    });
  }

  client.capture({
    event,
    properties,
    distinctId,
    groups,
    sendFeatureFlags: true,
  });

  try {
    await client.shutdown();
  } catch (e) {
    // Treat this error as non-fatal so logging doesn't take down the API function.
    console.error("Error shutting down PostHog client:", e);
  }
}
