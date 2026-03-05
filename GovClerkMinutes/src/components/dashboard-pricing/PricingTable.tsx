import { Box, Grid } from "@chakra-ui/react";
import { ApiGetCustomerDetailsResponse } from "@/pages/api/get-customer-details";
import { getPriceUnit, getPriceId, BillingPeriod } from "@/utils/price";
import PricingCard from "./PricingCard";
import PricingToggle from "@/components/shared/PricingToggle";
import { useUser } from "@clerk/nextjs";
import { getClientReferenceId } from "@/utils/getClientReferenceId";
import { usePricingToggle } from "@/hooks/usePricingToggle";
import { CUSTOM_FEATURES } from "@/utils/planFeatures";

interface Props {
  country: string | null | undefined;
  transcriptId?: number;
  customerDetails?: ApiGetCustomerDetailsResponse | null;
}

export default function PricingTable({ country, transcriptId, customerDetails }: Props) {
  const { user } = useUser();
  const { billingPeriod, setBillingPeriod, basicInfo, proInfo } = usePricingToggle({
    country,
    initialBillingPeriod: BillingPeriod.Yearly,
  });

  const isAnnual = billingPeriod === BillingPeriod.Yearly;
  const toggleBilling = () =>
    setBillingPeriod(isAnnual ? BillingPeriod.Monthly : BillingPeriod.Yearly);

  const priceUnit = getPriceUnit(country);

  return (
    <Box py={12}>
      <PricingToggle
        isAnnual={isAnnual}
        onToggle={(annual) =>
          setBillingPeriod(annual ? BillingPeriod.Yearly : BillingPeriod.Monthly)
        }
        className="mb-8"
      />

      <Grid templateColumns={{ base: "1fr", lg: "repeat(3, 1fr)" }} gap={8} maxW="6xl" mx="auto">
        <PricingCard
          title="Basic"
          subtitle="Perfect for getting started"
          price={basicInfo.price}
          priceUnit={priceUnit}
          features={basicInfo.features}
          clientReferenceId={getClientReferenceId(transcriptId, user?.id)}
          priceId={basicInfo.priceId}
          credits={300}
          isAnnual={isAnnual}
          country={country ?? "US"}
          onToggleBilling={toggleBilling}
        />
        <PricingCard
          title="Pro"
          subtitle="For power users who need more"
          price={proInfo.price}
          priceUnit={priceUnit}
          features={proInfo.features}
          clientReferenceId={getClientReferenceId(transcriptId, user?.id)}
          priceId={proInfo.priceId}
          isPopular
          credits={1200}
          isAnnual={isAnnual}
          country={country ?? "US"}
          onToggleBilling={toggleBilling}
        />
        <PricingCard
          title="Custom"
          subtitle="For enterprises & high volume"
          price={-1}
          priceUnit={priceUnit}
          features={CUSTOM_FEATURES}
          clientReferenceId={getClientReferenceId(transcriptId, user?.id)}
          priceId={getPriceId(country, "Pro")}
          credits={-1}
          isAnnual={isAnnual}
          onToggleBilling={toggleBilling}
        />
      </Grid>
    </Box>
  );
}
