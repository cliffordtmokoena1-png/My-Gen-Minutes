import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { getStripe } from "@/utils/stripe";
import { connect } from "@planetscale/database";
import { capture } from "@/utils/posthog";
import withErrorReporting from "@/error/withErrorReporting";
import type { Stripe } from "stripe";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

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

  const activeSubscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 1,
  });

  if (activeSubscriptions.data.length > 0) {
    const subscription = activeSubscriptions.data[0];
    await capture(
      "subscription_renewed",
      {
        subscription_id: subscription.id,
        customer_id: customerId,
      },
      userId
    );

    await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: false,
      metadata: {
        cancel_reason: null,
        is_custom_reason: null,
      },
    });

    return res.status(200).json({ message: "Subscription renewed successfully" });
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 1,
  });

  if (subscriptions.data.length === 0) {
    return res.status(400).json({ error: "No previous subscription found" });
  }

  const lastSubscription = subscriptions.data[0];
  const priceId = lastSubscription.items.data[0].price.id;

  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) {
    return res.status(400).json({ error: "Customer account has been deleted" });
  }

  let defaultPaymentMethodId = (customer as Stripe.Customer).invoice_settings
    ?.default_payment_method;

  if (!defaultPaymentMethodId && lastSubscription.default_payment_method) {
    const paymentMethod = lastSubscription.default_payment_method;
    defaultPaymentMethodId = typeof paymentMethod === "string" ? paymentMethod : paymentMethod.id;

    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: defaultPaymentMethodId as string,
      },
    });
  }

  if (!defaultPaymentMethodId) {
    return res.status(400).json({
      error: "No payment method found. Please add a payment method to your account.",
    });
  }

  const newSubscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    default_payment_method: defaultPaymentMethodId as string,
    metadata: {
      cancel_reason: null,
      is_custom_reason: null,
    },
  });

  await capture(
    "subscription_renewed",
    {
      subscription_id: newSubscription.id,
      customer_id: customerId,
      previous_subscription_id: lastSubscription.id,
    },
    userId
  );

  return res.status(200).json({ message: "Subscription renewed successfully" });
}

export default withErrorReporting(handler);
