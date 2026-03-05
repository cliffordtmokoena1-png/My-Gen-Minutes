import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { connect } from "@planetscale/database";
import { getUpgradePriceId } from "@/utils/price";
import withErrorReporting from "@/error/withErrorReporting";
import { getStripe } from "@/utils/stripe";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req);
  if (userId == null) {
    res.status(401).end();
    return;
  }

  const { country, targetPlan } = req.body;

  const conn = connect({
    host: process.env.PLANETSCALE_DB_HOST,
    username: process.env.PLANETSCALE_DB_USERNAME,
    password: process.env.PLANETSCALE_DB_PASSWORD,
  });

  const customerRows = await conn
    .execute("SELECT stripe_customer_id FROM mg_customers WHERE user_id = ?", [userId])
    .then((result) => result.rows);

  // 1. Customer rows can be empty (if no payment yet)
  // 2. Or many entries (if payment, then cancel, then pay again (2 rows))
  // Multiple rows is fine and happens because the user may have repurchased a plan, rather than renewing.
  // We always take the most recent customer record for a given user_id and its associated subscription

  if (customerRows.length === 0) {
    return res.status(412).end();
  }

  const stripe = getStripe();

  const customer: string = customerRows[customerRows.length - 1]["stripe_customer_id"];

  const subscriptions = await stripe.subscriptions.list({
    customer,
    status: "all",
    expand: ["data.items.data.price"],
  });

  const latestSubscription = subscriptions.data[0];

  const latestSubscriptionItem = latestSubscription.items.data[0];

  const basePriceId = latestSubscriptionItem.price.id;

  const upgradePriceId = basePriceId ? getUpgradePriceId(basePriceId) : null;

  // keeping this because i wanna catch if theres a ui endpoint that allows for this behavior
  if (upgradePriceId == null) {
    return res.status(412).json({ reason: "UPGRADE_NOT_POSSIBLE" });
  }

  await stripe.subscriptionItems.update(latestSubscriptionItem.id, {
    payment_behavior: "pending_if_incomplete",
    proration_behavior: "always_invoice",
    price: upgradePriceId,
  });

  return res.status(200).json({});
}

export default withErrorReporting(handler);
