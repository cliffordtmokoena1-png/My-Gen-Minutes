use crate::dev::is_dev;
use reqwest::Client;
use serde_json::json;

pub enum MgWebhookEvent {
  CheckRenewCredits,
  CheckWhatsapps,
  RunPostSignupTasks,
  #[allow(dead_code)]
  RemindWebinarLeads,
  HandlePaywallAbandoners,
  SendMinutesFinishedEmail {
    transcript_id: u64,
  },
}

pub async fn send_request(event: MgWebhookEvent) -> anyhow::Result<()> {
  let body = match event {
    MgWebhookEvent::CheckRenewCredits => json!({
      "event": "check_renew_credits"
    }),
    MgWebhookEvent::CheckWhatsapps => json!({
      "event": "check_whatsapps"
    }),
    MgWebhookEvent::RunPostSignupTasks => json!({
      "event": "run_post_signup_tasks"
    }),
    MgWebhookEvent::HandlePaywallAbandoners => json!({
      "event": "handle_paywall_abandoners"
    }),
    MgWebhookEvent::RemindWebinarLeads => json!({
      "event": "remind_webinar_leads"
    }),
    MgWebhookEvent::SendMinutesFinishedEmail { transcript_id } => json!({
      "event": "send_minutes_finished_email",
      "transcript_id": transcript_id
    }),
  };

  let client = Client::new();
  let response = client
    .post(format!(
      "{}/api/webhook/minutesgenerator",
      if is_dev() {
        "http://localhost:3223"
      } else {
        "https://minutesgenerator.com"
      }
    ))
    .header(
      "Authorization",
      format!(
        "Bearer {}",
        std::env::var("UPLOAD_COMPLETE_WEBHOOK_SECRET")
          .expect("UPLOAD_COMPLETE_WEBHOOK_SECRET not found in environment")
      ),
    )
    .header("Content-Type", "application/json")
    .json(&body)
    .send()
    .await?;

  let status = response.status();
  if !status.is_success() {
    let err = response.text().await?;
    return Err(anyhow::anyhow!(
      "Failed to send webhook request ({}) with error: {}",
      status,
      err
    ));
  }

  return Ok(());
}
