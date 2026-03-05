#!/usr/bin/env node
/**
 * Create annual equivalents for every monthly subscription Price.
 * ▸ Default: test mode (STRIPE_SECRET_TEST_KEY …)
 * ▸ --live   ⇒ production (STRIPE_SECRET_KEY …)
 * ▸ --dry    ⇒ dry run (no actual Stripe API calls)
 *
 *   node scripts/createAnnualPrices.js [--live]
 */

import minimist from "minimist";
import { getStripeProd, getStripeTest } from "@/utils/stripe";
import { CountryCode, Env, PRICE_IDS, PaidSubscriptionPlan } from "@/utils/price";

const argv = minimist(process.argv.slice(2));
const dry = argv.dry ?? false;
const useLive = argv.live ?? false;
const stripe = useLive ? getStripeProd() : getStripeTest();
const env: Env = useLive ? "prod" : "dev";

(async () => {
  const countries = Object.keys(PRICE_IDS[env].Subscription) as CountryCode[];

  for (const country of countries) {
    const tiers: Record<PaidSubscriptionPlan, string> = PRICE_IDS[env].Subscription[country];

    for (const [plan, monthlyPriceId] of Object.entries(tiers) as [
      PaidSubscriptionPlan,
      string,
    ][]) {
      console.log(`\n▶ ${country} · ${plan} - monthly price ${monthlyPriceId}`);

      const monthlyPrice = await stripe.prices.retrieve(monthlyPriceId);

      if (!monthlyPrice.recurring || monthlyPrice.recurring.interval !== "month") {
        console.warn("  ⤷ Not a monthly recurring price, skipping.");
        continue;
      } else {
        console.log(
          `  ⤷ Found monthly price: ${monthlyPrice.id} (${monthlyPrice.unit_amount} ${monthlyPrice.currency})`
        );
      }

      // does an annual price already exist on this product?
      const existingAnnual = await stripe.prices.list({
        product: monthlyPrice.product as string,
        limit: 100,
        recurring: { interval: "year" },
      });

      if (existingAnnual.data.length) {
        console.log(`  ⤷ Annual price already present: ${existingAnnual.data[0].id}`);
        continue;
      } else {
        console.log("  ⤷ No annual price found, creating one...");
      }

      const annualAmount = Math.round(monthlyPrice.unit_amount! * 10);
      console.log(`    Adding annual price of ${annualAmount} ${monthlyPrice.currency}`);

      const annualPrice = dry
        ? {
            id: "dry-run-annual-price-id",
            unit_amount: annualAmount,
            currency: monthlyPrice.currency,
          }
        : await stripe.prices.create({
            unit_amount: annualAmount,
            currency: monthlyPrice.currency,
            product: monthlyPrice.product as string,
            recurring: { interval: "year", interval_count: 1 },
            // copy useful presentation fields
            nickname: monthlyPrice.nickname
              ? monthlyPrice.nickname.replace("Monthly", "Annual")
              : `${plan} - Annual`,
            metadata: {
              ...monthlyPrice.metadata,
              cadence: "annual",
              cloned_from: monthlyPrice.id,
            },
          });

      console.log(
        `  ⤷ Created annual price ${annualPrice.id} (${annualAmount} ${annualPrice.currency})`
      );
    }
  }

  console.log("\n✅  Finished creating annual prices.");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
