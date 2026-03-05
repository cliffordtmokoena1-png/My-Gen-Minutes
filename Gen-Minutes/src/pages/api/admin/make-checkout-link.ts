import { getAuth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import withErrorReporting from "@/error/withErrorReporting";
import { assertString } from "@/utils/assert";
import { assertEnvironment } from "@/utils/environment";
import { getUserIdFromEmail } from "@/auth/getUserIdFromEmail";
import getPrimaryEmail from "@/utils/email";
import { sendEmail } from "@/utils/postmark";
import type { PaidSubscriptionPlan } from "@/utils/price";
import { HUBSPOT_OWNER_IDS, OUTGOING_BCC_EMAIL } from "@/crm/hubspot/consts";
import hubspot from "@/crm/hubspot";
import { getSiteFromHeaders } from "@/utils/site";

export const config = {
  runtime: "edge",
};

type RequestBody = {
  email: string;
  env: string;
  country: string;
  plan: PaidSubscriptionPlan | string;
  sendInEmail?: boolean;
};

const VALID_COUNTRIES = new Set(["ZA", "US", "IN", "PH"]);
// TODO: support Lite plan better
const VALID_PLANS = new Set<PaidSubscriptionPlan | "Lite">([
  "Lite",
  "Basic",
  "Basic_Annual",
  "Pro",
  "Pro_Annual",
]);

async function handler(req: NextRequest) {
  const { userId: adminUserId, sessionClaims } = getAuth(req);
  if (!adminUserId || !sessionClaims?.role || sessionClaims.role !== "admin") {
    return new Response(null, { status: 401 });
  }

  const body = (await req.json()) as RequestBody;
  const customerEmail = assertString(body.email);
  const env = assertEnvironment(body.env);
  let country = assertString(body.country);
  const plan = assertString(body.plan) as PaidSubscriptionPlan;
  const sendInEmail = Boolean(body.sendInEmail);

  if (!VALID_COUNTRIES.has(country)) {
    // Default to USD
    country = "US";
  }

  if (!VALID_PLANS.has(plan)) {
    return json({ error: "Invalid plan" }, 400);
  }

  const site = getSiteFromHeaders(req.headers);
  const userId = await getUserIdFromEmail({ email: customerEmail, env, site });
  if (userId == null) {
    return json({ error: "User not found" }, 404);
  }

  const origin = req.nextUrl.origin;
  const url = `${origin}/subscribe/${country}/${plan}/${userId}`;

  if (sendInEmail) {
    const operator = HUBSPOT_OWNER_IDS.CLIFF_MOKOENA;
    const contact = await hubspot.getContact({
      filter: {
        propertyName: "user_id",
        value: userId,
      },
      returnedProperties: ["firstname"],
    });
    const customerName = contact?.properties.firstname ?? "there";

    let fromEmail = (await getPrimaryEmail(adminUserId, site)) ?? operator.email;
    if (!fromEmail.includes("@minutesgenerator.com")) {
      fromEmail = operator.email;
    }

    const HtmlBody = `Hi ${customerName},<br/><br/>Here's your checkout link to subscribe to MinutesGenerator:<br/><a href="${url}">${url}</a><br/><br/>If you have any questions, just reply to this email!<br/><br/>${operator.firstname}`;
    const TextBody = `Hi ${customerName},\n\nHere's your checkout link to subscribe to MinutesGenerator:\n${url}\n\nIf you have any questions, just reply to this email!\n\n${operator.firstname}`;

    await sendEmail({
      From: `"${operator.name()}" <${fromEmail}>`,
      To: customerEmail,
      Subject: "Your MinutesGenerator checkout link",
      Bcc: [OUTGOING_BCC_EMAIL],
      HtmlBody,
      TextBody,
      MessageStream: "signup_and_purchase",
    });
  }

  return json({ url, emailed: sendInEmail }, 200);
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default withErrorReporting(handler);
