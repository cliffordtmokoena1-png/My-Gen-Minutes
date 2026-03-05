export namespace MgWebhook {
  export type Event =
    | CheckRenewCreditsEvent
    | CheckWhatsappsEvent
    | RunPostSignupTasks
    | RemindWebinarLeads
    | SendMinutesFinishedEmailEvent
    | HandlePaywallAbandonersEvent;

  type EventType =
    | "check_renew_credits"
    | "check_whatsapps"
    | "run_post_signup_tasks"
    | "remind_webinar_leads"
    | "send_minutes_finished_email"
    | "handle_paywall_abandoners";

  interface BaseEvent {
    event: EventType;
  }

  interface CheckRenewCreditsEvent extends BaseEvent {
    event: "check_renew_credits";
  }

  interface CheckWhatsappsEvent extends BaseEvent {
    event: "check_whatsapps";
  }

  interface RunPostSignupTasks extends BaseEvent {
    event: "run_post_signup_tasks";
  }

  interface RemindWebinarLeads extends BaseEvent {
    event: "remind_webinar_leads";
  }

  interface SendMinutesFinishedEmailEvent extends BaseEvent {
    event: "send_minutes_finished_email";
    transcript_id: number;
  }

  interface HandlePaywallAbandonersEvent extends BaseEvent {
    event: "handle_paywall_abandoners";
  }
}
