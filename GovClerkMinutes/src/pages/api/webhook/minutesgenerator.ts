import { NextApiRequest, NextApiResponse } from "next";
import withErrorReporting from "@/error/withErrorReporting";
import { MgWebhook } from "@/webhook/GovClerkMinutes/types";
import { checkRenewCredits } from "@/webhook/GovClerkMinutes/checkRenewCredits";
import { logWhatsappsToHubspot } from "@/webhook/GovClerkMinutes/logWhatsappsToHubspot";
import { sendScheduledWhatsapps } from "@/webhook/GovClerkMinutes/sendScheduledWhatsapps";
import { runPostSignupTasks } from "@/webhook/GovClerkMinutes/runPostSignupTasks";
import { remindWebinarLeads } from "@/webhook/GovClerkMinutes/remindWebinarLeads";
import { sendMinutesFinishedEmail } from "@/webhook/GovClerkMinutes/sendMinutesFinishedEmail";
import { handlePaywallAbandoners } from "@/webhook/GovClerkMinutes/handlePaywallAbandoners";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.headers.authorization !== `Bearer ${process.env.UPLOAD_COMPLETE_WEBHOOK_SECRET}`) {
    res.status(401).end();
    return;
  }

  const body: MgWebhook.Event = req.body;

  switch (body.event) {
    case "check_renew_credits": {
      await checkRenewCredits();
      return res.status(200).end();
    }
    case "check_whatsapps": {
      await logWhatsappsToHubspot();
      await sendScheduledWhatsapps();
      return res.status(200).end();
    }
    case "run_post_signup_tasks": {
      await runPostSignupTasks();
      return res.status(200).end();
    }
    case "remind_webinar_leads": {
      await remindWebinarLeads();
      return res.status(200).end();
    }
    case "send_minutes_finished_email": {
      await sendMinutesFinishedEmail(body.transcript_id);
      return res.status(200).end();
    }
    case "handle_paywall_abandoners": {
      await handlePaywallAbandoners();
      return res.status(200).end();
    }
    default: {
      // @ts-expect-error - this line errors if you are missing a case.
      const e = body.event;
      console.error(`Unknown webhook event: ${e}`);
      return res.status(400).end(`Unknown event: ${e}`);
    }
  }
}

export default withErrorReporting(handler);
