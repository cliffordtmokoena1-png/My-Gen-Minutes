import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import getPrimaryEmail from "@/utils/email";
import { getCustomerDetails } from "./get-customer-details";
import withErrorReporting from "@/error/withErrorReporting";
import { getStripe } from "@/utils/stripe";
import { connect } from "@planetscale/database";
import { DISCOUNT_COOKIE_NAME, getDiscountCodeId } from "@/cookies/discounts";
import Stripe from "stripe";
import { getCustomerIdFromUserId } from "@/utils/subscription";
import { resolveRequestContext } from "@/utils/resolveRequestContext";

export type CreateCheckoutSessionParams = {
  clientReferenceId: string;
  customerEmail?: string;
  customerId?: string;
  priceId: string;
  mode: "payment" | "subscription";
  quantity?: number;
  successUrl?: string;
  cancelUrl?: string;
  promoCode?: string;
  orgId?: string | null;
};
export async function createCheckoutSession({
  clientReferenceId,
  customerEmail,
  customerId,
  priceId,
  mode,
  quantity,
  successUrl,
  cancelUrl,
  promoCode,
  orgId,
}: CreateCheckoutSessionParams): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();

  const params: Stripe.Checkout.SessionCreateParams = {
    client_reference_id: clientReferenceId,
    line_items: [
      {
        price: priceId,
        quantity: quantity ?? 1,
      },
    ],
    mode: mode === "payment" ? "payment" : "subscription",
    invoice_creation:
      mode === "payment"
        ? {
            enabled: true,
            ...(orgId
              ? {
                  invoice_data: {
                    metadata: {
                      org_id: orgId,
                    },
                  },
                }
              : {}),
          }
        : undefined,
    success_url: successUrl ?? `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/{CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    automatic_tax: { enabled: true },
    billing_address_collection: "required",
    ...(promoCode == null
      ? { allow_promotion_codes: true }
      : {
          discounts: [
            {
              promotion_code: promoCode,
            },
          ],
        }),
    metadata: {
      ...(orgId ? { org_id: orgId } : {}),
    },
    ...(mode === "subscription" && orgId
      ? {
          subscription_data: {
            metadata: {
              org_id: orgId,
            },
          },
        }
      : {}),
  };

  if (customerId) {
    params.customer = customerId;
  } else if (customerEmail) {
    params.customer_email = customerEmail;
  }

  return await stripe.checkout.sessions.create(params);
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = getAuth(req);
  if (auth.userId == null) {
    res.status(401).json({});
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  const body = req.body;
  const clientReferenceId = body.clientReferenceId as string;
  const priceId = body.priceId as string;
  const mode = body.mode as "payment" | "subscription";

  const { userId, orgId, site } = await resolveRequestContext(auth.userId, body.orgId, req.headers);

  const referer = req.headers.referer || "https://GovClerkMinutes.com/dashboard";
  const cancelUrlBuilder = new URL(referer);
  cancelUrlBuilder.searchParams.set("canceled", "true");
  const cancelUrl = cancelUrlBuilder.toString();

  // 1. Check the legacy discount cookie
  let promoCode =
    req.cookies.mgdiscount === "true" ? getDiscountCodeId("valuedcustomer") : undefined;
  if (promoCode == null) {
    // 2. If not found, check the normal discount cookie
    promoCode = getDiscountCodeId(req.cookies[DISCOUNT_COOKIE_NAME]);
  }
  // Only allow PAYG (mode=payment) for subscribed users
  if (mode === "payment") {
    const details = await getCustomerDetails(userId, orgId);
    if (
      !(
        details.subscriptionStatus === "active" ||
        details.subscriptionStatus === "cancel_at_period_end"
      )
    ) {
      return res
        .status(412)
        .json({ error: "One-time credit purchases are only available to subscribers." });
    }
  }

  // For subscriptions, check mutual exclusivity
  if (mode === "subscription") {
    const conn = connect({
      host: process.env.PLANETSCALE_DB_HOST,
      username: process.env.PLANETSCALE_DB_USERNAME,
      password: process.env.PLANETSCALE_DB_PASSWORD,
    });

    // Check if user already has a subscription in the opposite context
    let existingSubscription;
    if (orgId) {
      existingSubscription = await conn
        .execute("SELECT id FROM gc_customers WHERE user_id = ? AND org_id IS NULL", [userId])
        .then((res) => res.rows);

      if (existingSubscription.length > 0) {
        return res.status(409).json({
          error:
            "You already have a personal subscription. Please cancel it before subscribing for an organization.",
        });
      }
    } else {
      existingSubscription = await conn
        .execute("SELECT id FROM gc_customers WHERE user_id = ? AND org_id IS NOT NULL", [userId])
        .then((res) => res.rows);

      if (existingSubscription.length > 0) {
        return res.status(409).json({
          error:
            "You already have an organization subscription. Please cancel it before subscribing personally.",
        });
      }
    }
  }

  if (promoCode == null) {
    // 3. If not found, check the database
    const conn = await connect({
      host: process.env.PLANETSCALE_DB_HOST,
      username: process.env.PLANETSCALE_DB_USERNAME,
      password: process.env.PLANETSCALE_DB_PASSWORD,
    });

    const rows = await conn
      .execute("SELECT discount_code FROM gc_meta_conversions WHERE user_id = ?", [userId])
      .then((res) => res.rows);

    promoCode = rows.length > 0 ? rows[0].discount_code : undefined;
  }

  const [session, customerDetails] = await Promise.all([
    createCheckoutSession({
      clientReferenceId,
      customerEmail: (await getPrimaryEmail(userId, site)) ?? undefined,
      customerId: (await getCustomerIdFromUserId(userId)) ?? undefined,
      priceId,
      mode: body.mode,
      quantity: body.quantity,
      successUrl: `${req.headers.origin}/checkout/{CHECKOUT_SESSION_ID}`,
      cancelUrl,
      promoCode,
      orgId,
    }),
    getCustomerDetails(userId, orgId),
  ]);

  if (session.url == null) {
    return res.status(500).json({ error: "Invalid session URL" });
  }

  return res.status(200).json({ url: session.url, plan: customerDetails.subscriptionStatus });
}

export default withErrorReporting(handler);
