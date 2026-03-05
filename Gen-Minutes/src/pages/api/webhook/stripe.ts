import { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import withErrorReporting from "@/error/withErrorReporting";
import { getStripeProd, getStripeTest, STRIPE_PROD_KEYS, STRIPE_TEST_KEYS } from "@/utils/stripe";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const testMode = req.query.testmode === "true";

  let stripe = testMode ? getStripeTest() : getStripeProd();

  const webhookSecret: string = testMode
    ? process.env.NEW_STRIPE_WEBHOOK_TEST_SIGNING_SECRET!
    : process.env.NEW_STRIPE_WEBHOOK_SIGNING_SECRET!;

  const rawBody = await buffer(req);
  const signature = req.headers["stripe-signature"]!;

  const event = stripe.webhooks.constructEvent(rawBody.toString(), signature, webhookSecret);

  // eslint-disable-next-line no-console
  console.log("Received Stripe webhook event:", event.type);
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(event, null, 2));

  return res.status(200).end();
}

export default withErrorReporting(handler);
