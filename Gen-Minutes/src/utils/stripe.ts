import Stripe from "stripe";
import { isDev, isPreview } from "./dev";

export type StripeKeys = {
  secretKey: string;
  webhookSecret: string;
};

export const STRIPE_TEST_KEYS: StripeKeys = {
  secretKey: process.env.STRIPE_SECRET_TEST_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_TEST_SIGNING_SECRET!,
};

export const STRIPE_PROD_KEYS: StripeKeys = {
  secretKey: process.env.STRIPE_SECRET_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SIGNING_SECRET!,
};

// Returns Stripe api based on current environment
export function getStripe(): Stripe {
  if (isDev() || isPreview()) {
    return getStripeTest();
  }
  return getStripeProd();
}

export function getStripeTest(): Stripe {
  return new Stripe(STRIPE_TEST_KEYS.secretKey, {
    apiVersion: "2022-11-15",
  });
}

export function getStripeProd(): Stripe {
  return new Stripe(STRIPE_PROD_KEYS.secretKey, {
    apiVersion: "2022-11-15",
  });
}
