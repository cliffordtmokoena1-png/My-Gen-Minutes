import { Box } from "@chakra-ui/react";
import PaywallBanner from "./PaywallBanner";
import { SubscriptionPlan } from "@/utils/price";
import { UploadKind } from "@/uploadKind/uploadKind";

type Props = {
  showPaywall: boolean;
  transcriptId?: number;
  country?: string;
  creditsRequired?: number;
  currentBalance?: number;
  uploadKind?: UploadKind;
  planName?: SubscriptionPlan;
  isCollapsed?: boolean;
};

export default function Paywall({
  showPaywall,
  transcriptId,
  country,
  creditsRequired,
  currentBalance,
  uploadKind,
  planName,
  isCollapsed,
}: Props) {
  if (
    currentBalance == null ||
    creditsRequired == null ||
    currentBalance >= creditsRequired ||
    uploadKind == null
  ) {
    return null;
  }

  return (
    <Box
      position="fixed"
      top={0}
      right={0}
      left={0}
      zIndex={1000}
      ml={{ base: 0, md: isCollapsed ? "60px" : "360px" }}
      transition="margin-left 0.3s ease"
    >
      <PaywallBanner
        showPaywall={showPaywall}
        creditsRequired={creditsRequired}
        currentBalance={currentBalance}
        uploadKind={uploadKind}
        onUpgradeClick={() => {}}
        planName={planName ?? "Free"}
        country={country}
        transcriptId={transcriptId}
      />
    </Box>
  );
}
