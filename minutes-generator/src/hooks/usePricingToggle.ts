import { useState } from "react";
import {
  getPrice,
  getPriceId,
  PaidSubscriptionPlan,
  BillingPeriod,
  getPlanForBillingPeriod,
} from "@/utils/price";
import { BASIC_FEATURES, PRO_FEATURES } from "@/utils/planFeatures";

type PlanInfo = {
  plan: PaidSubscriptionPlan;
  price: number;
  priceId: string;
  features: string[];
};

type UsePricingToggleParams = {
  country?: string | null;
  initialBillingPeriod: BillingPeriod;
};

type UsePricingToggleReturn = {
  billingPeriod: BillingPeriod;
  setBillingPeriod: (billingPeriod: BillingPeriod) => void;
  basicInfo: PlanInfo;
  proInfo: PlanInfo;
};

export function usePricingToggle({
  country,
  initialBillingPeriod,
}: UsePricingToggleParams): UsePricingToggleReturn {
  const [billingPeriod, setBillingPeriod] = useState(initialBillingPeriod);

  const basicPlan: PaidSubscriptionPlan = getPlanForBillingPeriod("Basic", billingPeriod);
  const proPlan: PaidSubscriptionPlan = getPlanForBillingPeriod("Pro", billingPeriod);

  const basicInfo: PlanInfo = {
    plan: basicPlan,
    price: getPrice(country, basicPlan),
    priceId: getPriceId(country, basicPlan),
    features: BASIC_FEATURES,
  };

  const proInfo: PlanInfo = {
    plan: proPlan,
    price: getPrice(country, proPlan),
    priceId: getPriceId(country, proPlan),
    features: PRO_FEATURES,
  };

  return {
    billingPeriod,
    setBillingPeriod,
    basicInfo,
    proInfo,
  };
}
