import { assertString } from "./assert";

const POSTMARK_API_URL = "https://api.postmarkapp.com/email";

const GET_STARTED_GUIDE_URL =
  "https://help.GovClerkMinutes.com/en/articles/11072152-getting-started-with-GovClerkMinutes";
const HOW_TO_GET_BACK_GUIDE_URL =
  "https://help.GovClerkMinutes.com/en/articles/9176366-how-to-get-back-to-GovClerkMinutes-com";

export type SendEmailParams = {
  From: string;
  To: string;
  Cc?: string[];
  Bcc?: string[];
  Subject: string;
  HtmlBody: string;
  TextBody: string;
  MessageStream: string;
  Attachments?: Array<{
    Name: string;
    Content: string;
    ContentType: string;
    ContentID?: string;
    Disposition?: string;
  }>;
};

export async function sendEmail({
  From,
  To,
  Cc,
  Bcc,
  Subject,
  HtmlBody,
  TextBody,
  MessageStream,
  Attachments,
}: SendEmailParams) {
  const res = await fetch(POSTMARK_API_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": assertString(process.env.POSTMARK_SERVER_TOKEN),
    },
    body: JSON.stringify({
      From,
      To,
      Cc: Cc?.join(","),
      Bcc: Bcc?.join(","),
      Subject,
      HtmlBody,
      TextBody,
      MessageStream,
      Attachments,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error("Postmark API Error:", error);
    throw new Error(`Failed to send email via Postmark: ${res.status}`);
  }
}

export async function sendWelcomeEmail(email: string) {
  await sendEmail({
    From: "max@mail.GovClerkMinutes.com",
    To: email,
    Subject: "Hello from GovClerkMinutes!",
    HtmlBody:
      "Thanks for creating an account with us at <a href='https://GovClerkMinutes.com?utm_medium=email'>GovClerkMinutes.com</a>!<br /><br />To get started, go to the <a href='https://GovClerkMinutes.com/dashboard?utm_medium=email'>dashboard</a> and upload an (audio or video) recording of a meeting.<br /><br />Please let us know if we can assist you in any way.<br /><br />All the best,<br />Max Sherman",
    TextBody:
      "Thanks for creating an account with us!\n\nTo get started, go to the dashboard and upload an (audio or video) recording of a meeting.\n\nPlease let us know if we can assist you in any way.\n\nAll the best,\nMax Sherman",
    MessageStream: "signup_and_purchase",
  });
}

export async function sendSignUpMagicEmail(email: string, token: string) {
  await sendEmail({
    From: '"GovClerkMinutes" <max@mail.GovClerkMinutes.com>',
    To: email,
    Subject: "Your sign in link",
    HtmlBody: `Thanks for creating an account with us!<br /><br /><a href='https://GovClerkMinutes.com/accept-token/${token}?utm_medium=memail'>Click here to be logged in.</a><br /><br />After clicking the link above, read our <a href="${GET_STARTED_GUIDE_URL}">guide on getting started.</a>`,
    TextBody: `Thanks for creating an account with us!\n\nPaste this link into your browser to complete your sign up: https://GovClerkMinutes.com/accept-token/${token}\n\nAfter clicking the link above, read our guide to getting started at ${GET_STARTED_GUIDE_URL}.`,
    MessageStream: "signup_and_purchase",
  });
}

export async function sendSignInMagicEmail(email: string, token: string) {
  await sendEmail({
    From: '"GovClerkMinutes" <max@mail.GovClerkMinutes.com>',
    To: email,
    Subject: "Your sign in link",
    HtmlBody: `Welcome back to GovClerkMinutes!<br /><br /><a href='https://GovClerkMinutes.com/accept-token/${token}?utm_medium=memail'>Click here to be logged in.</a><br /><br />After clicking the link above, read our <a href="${HOW_TO_GET_BACK_GUIDE_URL}">guide on saving a shortcut to get back easier.</a>`,
    TextBody: `Welcome back to GovClerkMinutes!\n\nPaste this link into your browser to complete your sign up: https://GovClerkMinutes.com/accept-token/${token}\n\nAfter clicking the link above, read our guide on saving a shortcut to get back easier: ${HOW_TO_GET_BACK_GUIDE_URL}.`,
    MessageStream: "signup_and_purchase",
  });
}
