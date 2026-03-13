import { ApiGetCustomerDetailsResponse } from "@/pages/api/get-customer-details";
import { getStripe } from "./stripe";
import { connect } from "@planetscale/database";
import { add, differenceInDays } from "date-fns";

export function isSubscriptionActive(subscriptionStatus: string): boolean {
  return subscriptionStatus === "active";
}

export function isSubscriptionPaused(subscriptionStatus: string): boolean {
  return subscriptionStatus === "cancel_at_period_end";
}

export function isSubscriptionDelinquent(subscriptionStatus: string): boolean {
  return subscriptionStatus === "delinquent";
}

export function isSubscriptionCanceled(subscriptionStatus: string): boolean {
  return subscriptionStatus === "canceled";
}

export function calculateUsage(subscriptionData: ApiGetCustomerDetailsResponse) {
  const currentUsage = Math.max(
    0,
    subscriptionData.creditsPerMonth - subscriptionData.remainingCredits
  );
  const creditUsagePercentage = (currentUsage / subscriptionData.creditsPerMonth) * 100;
  const excessCredits = Math.max(
    0,
    subscriptionData.remainingCredits - subscriptionData.creditsPerMonth
  );

  return {
    currentUsage,
    creditUsagePercentage,
    excessCredits,
    hasExcessCredits: excessCredits > 0,
  };
}

export function calculateDaysUntilCreditReset(
  subscriptionData: ApiGetCustomerDetailsResponse
): number {
  // Credits always reset monthly, regardless of billing interval
  // For annual subscribers, we need to calculate the next monthly reset, not the annual billing date

  const today = new Date();

  if (subscriptionData.interval === "year") {
    // For annual subscribers, credits reset monthly from the subscription start date
    // Parse the next bill date to get the original subscription day
    const nextBillDate = new Date(subscriptionData.nextBillDate);
    const subscriptionDay = nextBillDate.getDate();

    // Create a date for this month's reset day
    const thisMonthReset = new Date(today.getFullYear(), today.getMonth(), subscriptionDay);

    // If we've passed this month's reset day, calculate next month's reset
    const nextReset = today >= thisMonthReset ? add(thisMonthReset, { months: 1 }) : thisMonthReset;

    return differenceInDays(nextReset, today);
  } else {
    // For monthly subscribers, use the regular billing date
    const nextBill = new Date(subscriptionData.nextBillDate);
    return differenceInDays(nextBill, today);
  }
}

export async function getCustomerIdFromUserId(userId: string): Promise<string | null> {
  const conn = connect({
    host: process.env.PLANETSCALE_DB_HOST,
    username: process.env.PLANETSCALE_DB_USERNAME,
    password: process.env.PLANETSCALE_DB_PASSWORD,
  });

  const customerRows = await conn
    .execute("SELECT stripe_customer_id FROM gc_customers WHERE user_id = ?", [userId])
    .then((result) => result.rows);

  if (customerRows.length > 0) {
    return customerRows[customerRows.length - 1]["stripe_customer_id"];
  }

  return null;
}

export async function getActiveSubscription(customerId: string): Promise<any | null> {
  const stripe = getStripe();
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 1,
  });
  return subscriptions.data[0] || null;
}

export async function deleteAllSubscriptionsForUserId(userId: string): Promise<void> {
  const customerId = await getCustomerIdFromUserId(userId);
  if (!customerId) {
    return;
  }

  const stripe = getStripe();
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 100,
  });

  for (const sub of subscriptions.data) {
    await stripe.subscriptions.cancel(sub.id);
  }
}
