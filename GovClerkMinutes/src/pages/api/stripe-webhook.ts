import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { buffer } from "micro";
import { assertString } from "@/utils/assert";
import { capture } from "@/utils/posthog";
import withErrorReporting from "@/error/withErrorReporting";
import { getStripeProd, getStripeTest, STRIPE_PROD_KEYS, STRIPE_TEST_KEYS } from "@/utils/stripe";
import { moveLead } from "@/instantly/leads";
import { CAMPAIGNS } from "@/instantly/campaigns";
import { connect } from "@planetscale/database";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  const testMode = req.query.testmode === "true";

  let stripe = testMode ? getStripeTest() : getStripeProd();

  const webhookSecret: string = testMode
    ? STRIPE_TEST_KEYS.webhookSecret!
    : STRIPE_PROD_KEYS.webhookSecret!;

  const rawBody = await buffer(req);
  const signature = req.headers["stripe-signature"]!;

  const event = stripe.webhooks.constructEvent(rawBody.toString(), signature, webhookSecret);

  const conn = connect({
    host: process.env.PLANETSCALE_DB_HOST,
    username: process.env.PLANETSCALE_DB_USERNAME,
    password: process.env.PLANETSCALE_DB_PASSWORD,
  });

  // FYI: this event doesn't fire for plan upgrades.
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    // TODO: void the transcraction if this is null
    // client_reference_id is transcriptId + _____ + userId + _____ + referralId
    const splitRefId = assertString(session.client_reference_id).split("_____");
    const transcriptId = splitRefId[0] === "" ? null : parseInt(splitRefId[0]);
    const userId = splitRefId[1];
    const referralId = splitRefId[2];
    const invoiceId = assertString(session.invoice);
    const customerId = assertString(session.customer);
    const orgId = session.metadata?.org_id || null;

    // Add referral tracking metadata to customer object.
    // We are either renewing a subscription, or creating a new one.
    // We handle not overwriting existing referral IDs.
    try {
      const customer = await stripe.customers.retrieve(customerId);

      if (customer.deleted == null && customer.metadata && customer.metadata.referral) {
      } else {
        await stripe.customers.update(customerId, {
          metadata: {
            referral: referralId,
          },
        });
      }
    } catch (err) {}

    // Add a row to be able to later lookup user_id from stripe_customer_id
    await conn.execute(
      `
      INSERT INTO gc_customers (user_id, org_id, stripe_customer_id, referral, billing_model)
      VALUES (?, ?, ?, ?, 'self_service');
      `,
      [orgId ? null : userId, orgId, customerId, referralId]
    );

    await conn.execute(
      `
      INSERT INTO payments (
        invoice_id,
        user_id,
        org_id,
        transcript_id,
        checkout_session_id,
        mode,
        token,
        action,
        billing_subject,
        currency,
        purchase_amount
      ) VALUES (?, ?, ?, ?, ?, ?, 0, 'pending', ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      -- refresh metadata but never touch token/action here
      user_id             = VALUES(user_id),
      org_id              = VALUES(org_id),
      transcript_id       = VALUES(transcript_id),
      checkout_session_id = VALUES(checkout_session_id),
      mode                = VALUES(mode),
      billing_subject     = VALUES(billing_subject),
      currency            = VALUES(currency),
      purchase_amount     = VALUES(purchase_amount);`,
      [
        invoiceId,
        userId,
        orgId,
        transcriptId,
        session.id,
        session.mode,
        orgId ? "org" : "user",
        session.currency,
        session.amount_subtotal,
      ]
    );

    await conn.execute(
      "UPDATE gc_emails SET should_email = 0 WHERE (campaign = 'paywall_abandonment' AND user_id = ?) OR transcript_id = ?;",
      [userId, transcriptId]
    );

    try {
      await moveLead(userId, CAMPAIGNS.POST_PURCHASE);
    } catch (err) {
      console.error("Failed to move lead:", err);
    }

    if (!testMode) {
      await fetch("https://GovClerkMinutes.com/api/meta-conversions-api-purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: session.customer_email,
          userId,
          currency: session.currency,
          value: session.amount_subtotal,
          name: session.customer_details?.name,
          state: session.customer_details?.address?.state,
          zipCode: session.customer_details?.address?.postal_code,
          phone: session.customer_details?.phone,
          country: session.customer_details?.address?.country,
          city: session.customer_details?.address?.city,
        }),
      });
    }

    await capture(
      "user_purchase",
      {
        transcript_id: transcriptId,
        referral_id: referralId,
        session_id: session.id,
        amount_subtotal: session.amount_subtotal,
        mode: session.mode,
      },
      userId
    );

    return res.status(200).end();
  } else if (event.type === "invoice.payment_succeeded") {
    const evt = event.data.object as Stripe.Invoice;

    const billingModel = (evt.metadata ?? {}).billing_model;
    if (billingModel === "contract") {
      // Handle this case in `invoice.paid` handler
      return res.status(200).end();
    }

    // If this is a subscription upgrade, there will be two products, and we
    // need the second one to get the right number of tokens.  The first one is
    // the original product.
    const productIdIdx = evt.billing_reason === "subscription_update" ? 1 : 0;

    const line = evt.lines.data[productIdIdx];
    const productId = line.price?.product;
    const productDetails = await stripe.products.retrieve(productId as any);
    const metadata = productDetails.metadata;
    console.info("Metadata:", metadata);
    const token = parseInt(metadata["tokens"] || "0");

    const customerId = assertString(evt.customer);
    const customerData: { user_id: string | null; org_id: string | null } | null = await conn
      .execute("SELECT user_id, org_id FROM gc_customers WHERE stripe_customer_id = ?;", [
        customerId,
      ])
      .then((r) => (r.rows?.[0] as any) ?? null);

    let invoiceOrgId: string | null = null;

    invoiceOrgId = evt.metadata?.org_id || null;

    if (!invoiceOrgId && (evt as any).subscription_details?.metadata?.org_id) {
      invoiceOrgId = (evt as any).subscription_details.metadata.org_id;
    }

    if (!invoiceOrgId && evt.subscription) {
      try {
        const subscription = await stripe.subscriptions.retrieve(evt.subscription as string);
        invoiceOrgId = subscription.metadata?.org_id || null;
      } catch (err) {
        console.error("Failed to retrieve subscription metadata:", err);
      }
    }

    const upsertUserId = customerData?.user_id ?? null;
    const upsertOrgId = invoiceOrgId || customerData?.org_id || null;

    await conn.execute(
      `
      INSERT INTO payments (
        invoice_id,
        user_id,
        org_id,
        token,
        action,
        billing_subject,
        mode
      ) VALUES (?, ?, ?, ?, 'add', ?, ?)
      ON DUPLICATE KEY UPDATE
        token = VALUES(token),
        action = 'add',
        user_id = COALESCE(VALUES(user_id), user_id),
        org_id = COALESCE(VALUES(org_id), org_id),
        billing_subject = VALUES(billing_subject);`,
      [
        evt.id,
        upsertUserId, // May be null for first-time checkout, and later set in checkout.session.completed
        upsertOrgId,
        token,
        upsertOrgId ? "org" : "user",
        evt.subscription ? "subscription" : "payment",
      ]
    );

    return res.status(200).end();
  } else if (event.type === "invoice.paid") {
    // This event is for handling the manual contract billing model.  In this
    // case, the customer has been manually sent and invoice (along with a
    // contract they signed).  When they pay the invoice, we detect if it was a
    // "contract" billing model based on the invoice metadata, and update our
    // tables accordingly.

    const evt = event.data.object as Stripe.Invoice;
    const metadata = evt.metadata || {};
    const userId = metadata.user_id;
    const billingModel = metadata.billing_model;
    const tokensTarget = parseInt(metadata.tokens || "0");

    if (billingModel !== "contract") {
      return res.status(200).end();
    }

    if (!userId) {
      console.warn("invoice.paid event with contract billing model missing user_id");
      return res.status(200).end();
    }

    const customerId = assertString(evt.customer);

    await conn.execute(
      `
      INSERT INTO gc_customers (user_id, stripe_customer_id, billing_model)
      VALUES (?, ?, ?);
      `,
      [userId, customerId, billingModel]
    );

    // Make sure the user has at least `tokens` tokens, and if not, add the difference to the payments table.
    const rows = await conn
      .execute("SELECT SUM(token) as balance FROM payments WHERE user_id = ?;", [userId])
      .then((r) => r.rows);
    const balanceVal = (rows?.[0] as any)?.balance;
    const currentBalance = balanceVal ? parseInt(balanceVal) : 0;

    const diff = tokensTarget - currentBalance;

    await conn.execute(
      `
      INSERT INTO payments (
        invoice_id,
        user_id,
        token,
        action,
        billing_subject,
        mode,
        currency,
        purchase_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [evt.id, userId, Math.max(diff, 0), "add", "user", "payment", evt.currency, evt.amount_paid]
    );

    return res.status(200).end();
  } else {
    return res.status(200).end();
  }
}

export default withErrorReporting(handler);
