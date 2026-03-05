import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { getStripe } from "@/utils/stripe";
import { capture } from "@/utils/posthog";
import withErrorReporting from "@/error/withErrorReporting";
import { isDev } from "@/utils/dev";
import { getCustomerIdFromUserId, getActiveSubscription } from "@/utils/subscription";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isDev()) {
    return res.status(403).json({ error: "Only available in development" });
  }

  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const customerId = await getCustomerIdFromUserId(userId);
    if (!customerId) {
      return res.status(400).json({ error: "No customer found" });
    }

    const subscription = await getActiveSubscription(customerId);
    if (!subscription) {
      return res.status(400).json({ error: "No active subscription found" });
    }

    const stripe = getStripe();
    await stripe.subscriptions.cancel(subscription.id);

    await capture(
      "subscription_canceled",
      {
        subscription_id: subscription.id,
        customer_id: customerId,
        reason: "dev_testing",
      },
      userId
    );

    return res.status(200).json({ message: "Subscription canceled successfully" });
  } catch (error) {
    console.error("Error in dev-cancel-subscription:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export default withErrorReporting(handler);
