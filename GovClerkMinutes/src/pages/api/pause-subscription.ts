import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { getStripe } from "@/utils/stripe";
import { connect } from "@planetscale/database";
import { capture } from "@/utils/posthog";
import withErrorReporting from "@/error/withErrorReporting";
import { sendSlackChurnInfo } from "@/utils/slack";
import { PauseReason } from "./get-customer-details";
import { waitUntil } from "@vercel/functions";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { reason } = req.body;
  if (!reason) {
    return res.status(400).json({ error: "Reason is required" });
  }

  const posthogSessionId = req.headers["x-posthog-session-id"] as string;

  const conn = connect({
    host: process.env.PLANETSCALE_DB_HOST,
    username: process.env.PLANETSCALE_DB_USERNAME,
    password: process.env.PLANETSCALE_DB_PASSWORD,
  });

  const customerRows = await conn
    .execute("SELECT stripe_customer_id FROM gc_customers WHERE user_id = ?", [userId])
    .then((result) => result.rows);

  if (customerRows.length === 0) {
    return res.status(400).json({ error: "No customer found" });
  }

  const stripe = getStripe();
  const customerId: string = customerRows[customerRows.length - 1]["stripe_customer_id"];

  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 1,
  });

  if (subscriptions.data.length === 0) {
    return res.status(400).json({ error: "No active subscription found" });
  }

  const subscription = subscriptions.data[0];

  await capture(
    "subscription_canceled",
    {
      reason,
      subscription_id: subscription.id,
      customer_id: customerId,
    },
    userId
  );

  const feedback = reason.kind === "Other" ? reason.feedback : undefined;

  await stripe.subscriptions.update(subscription.id, {
    cancel_at_period_end: true,
    metadata: {
      cancel_reason: reason.kind,
      feedback: feedback,
    },
  });

  const response = res.status(200).json({ message: "Subscription canceled successfully" });

  waitUntil(sendSlackChurnInfo(userId, reason.kind, feedback, posthogSessionId));

  return response;
}

export default withErrorReporting(handler);
