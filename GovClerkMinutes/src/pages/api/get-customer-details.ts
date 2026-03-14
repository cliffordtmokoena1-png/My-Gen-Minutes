import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { connect } from "@planetscale/database";
import withErrorReporting from "@/error/withErrorReporting";
import { getStripe } from "@/utils/stripe";
import { getCurrentBalance } from "./get-credits";
import { getCountryFromPriceId, getPlanFromPriceId, SubscriptionPlan } from "@/utils/price";
import type { Stripe } from "stripe";
import { resolveRequestContext } from "@/utils/resolveRequestContext";

export type PauseReason =
  | { kind: "BadCadence" }
  | { kind: "TooExpensive" }
  | { kind: "BetterAlternative" }
  | { kind: "NotNeeded" }
  | { kind: "BadQuality" }
  | { kind: "Other"; feedback?: string };

export type SubscriptionStatus =
  | "free"
  | "active"
  | "canceled"
  | "cancel_at_period_end"
  | "delinquent";

export type BillingModel = "self_service" | "contract";

export type ApiGetCustomerDetailsResponse = {
  subscriptionStatus: SubscriptionStatus;
  planName: SubscriptionPlan;
  tokensPerMonth: number;
  interval: Stripe.Price.Recurring.Interval | null;
  nextBillDate: string;
  remainingToken: number;
  isFreeUser: boolean;
  country: string | null;
  billingModel: BillingModel;
};

export async function getCustomerDetails(
  userId: string,
  orgId: string | null = null
): Promise<ApiGetCustomerDetailsResponse> {
  const conn = connect({
    host: process.env.PLANETSCALE_DB_HOST,
    username: process.env.PLANETSCALE_DB_USERNAME,
    password: process.env.PLANETSCALE_DB_PASSWORD,
  });

  let query: string;
  let params: string[];

  if (orgId) {
    query = "SELECT stripe_customer_id, billing_model FROM gc_customers WHERE org_id = ?";
    params = [orgId];
  } else {
    query = "SELECT stripe_customer_id, billing_model FROM gc_customers WHERE user_id = ?";
    params = [userId];
  }

  const customerRows = await conn.execute(query, params).then((result) => result.rows);

  let planName: SubscriptionPlan = "Free";
  let subscriptionStatus: ApiGetCustomerDetailsResponse["subscriptionStatus"] = "free";
  let tokensPerMonth = 30;
  let interval: Stripe.Price.Recurring.Interval | null = null;
  let nextBillDate = "";
  let remainingToken = 0;
  let isFreeUser = true;
  let country = null;
  let billingModel: BillingModel = "self_service";

  if (customerRows.length > 0) {
    const stripe = getStripe();
    const customer: string = customerRows[customerRows.length - 1]["stripe_customer_id"];
    billingModel = customerRows[customerRows.length - 1]["billing_model"];

    const subscriptions = await stripe.subscriptions.list({
      customer,
      status: "all",
    });

    const latestSubscription = subscriptions.data[0];

    if (latestSubscription) {
      isFreeUser = false;
      switch (latestSubscription.status) {
        case "active":
          const subscriptionItem = latestSubscription.items.data[0];
          country = getCountryFromPriceId(subscriptionItem.price.id);
          const productId = subscriptionItem.price.product;
          const product = await stripe.products.retrieve(productId as any);
          planName = getPlanFromPriceId(subscriptionItem.price.id) ?? "Free";

          if (planName === "Free") {
            subscriptionStatus = "free";
            tokensPerMonth = 30;
            interval = null;
          } else {
            subscriptionStatus = latestSubscription.cancel_at_period_end
              ? "cancel_at_period_end"
              : "active";
            tokensPerMonth = parseInt(product.metadata["tokens"] || "0");
            interval = subscriptionItem.price.recurring?.interval ?? null;
          }
          break;
        case "canceled":
          subscriptionStatus = "canceled";
          planName = "Free";
          tokensPerMonth = 30;
          break;
        case "incomplete":
        case "incomplete_expired":
        case "past_due":
        case "unpaid":
          subscriptionStatus = "delinquent";
          planName = "Free";
          tokensPerMonth = 30;
          break;
      }

      if (subscriptionStatus === "active" || subscriptionStatus === "cancel_at_period_end") {
        const date = new Date(latestSubscription.current_period_end * 1000);
        nextBillDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
      }
    }
  }

  remainingToken = (await getCurrentBalance(userId, orgId)) ?? 0;

  return {
    subscriptionStatus,
    planName,
    tokensPerMonth,
    interval,
    nextBillDate,
    remainingToken,
    isFreeUser,
    country,
    billingModel,
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = getAuth(req, { treatPendingAsSignedOut: false });
  if (auth.userId == null) {
    res.status(401).end();
    return;
  }

  const orgId = req.body?.orgId;
  const { userId, orgId: resolvedOrgId } = await resolveRequestContext(
    auth.userId,
    orgId,
    req.headers
  );

  const customerDetails = await getCustomerDetails(userId, resolvedOrgId);

  return res.status(200).json(customerDetails);
}

export default withErrorReporting(handler);
