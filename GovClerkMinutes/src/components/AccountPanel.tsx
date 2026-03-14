import { Button, Flex, Text, Tooltip, Skeleton } from "@chakra-ui/react";
import { BsQuestionCircle } from "react-icons/bs";
import { LayoutKind, ModalType } from "@/pages/dashboard/[[...slug]]";
import { ApiGetCustomerDetailsResponse } from "@/pages/api/get-customer-details";
import { useSession } from "@clerk/nextjs";
import { getPrettyPlanName, isPlanBasic, isPlanPro } from "@/utils/price";

type AccountPanelProps = {
  layoutKind: LayoutKind;
  customerDetails?: ApiGetCustomerDetailsResponse;
  creditData?: { credits: number | null };
  onOpen: (modalType: ModalType) => void;
};

const AccountPanel = ({ layoutKind, customerDetails, creditData, onOpen }: AccountPanelProps) => {
  const { session, isLoaded } = useSession();

  const plan =
    customerDetails?.subscriptionStatus === "cancel_at_period_end"
      ? "Free"
      : getPrettyPlanName(customerDetails?.planName);
  return (
    <Flex
      bg="gray.50"
      borderTopColor="gray.200"
      borderTopWidth="1px"
      py="4"
      px="4"
      flexDir="column"
      justifyContent="end"
      gap={3}
    >
      {layoutKind === "desktop" && (
        <>
          {customerDetails == null ||
          !isLoaded ||
          session?.user?.publicMetadata?.isEnterprise ? null : (
            <Button
              variant="outline"
              colorScheme="blue"
              borderColor="blue.700"
              color="blue.700"
              size="sm"
              overflow="hidden"
              w="full"
              onClick={() => {
                if (customerDetails.subscriptionStatus !== "active") {
                  onOpen("pricing");
                } else if (isPlanBasic(customerDetails.planName)) {
                  onOpen("upgrade");
                } else if (isPlanPro(customerDetails.planName)) {
                  onOpen("referral");
                } else {
                  onOpen("pricing");
                }
              }}
            >
              {customerDetails.subscriptionStatus === "active" &&
              isPlanPro(customerDetails.planName)
                ? "Refer a friend"
                : "Upgrade your plan"}
            </Button>
          )}
        </>
      )}
      <Flex
        w="full"
        alignItems="center"
      >
        {creditData != null ? (
          <Flex flexDirection="column">
            <Flex alignItems="center" gap={1}>
              <Text fontSize="sm" fontWeight="semibold">
                Credits:
              </Text>
              <Text fontSize="sm">{creditData.credits ?? 0}</Text>
              <Flex alignItems="center" ml={1}>
                <Tooltip
                  label={`You can transcribe up to ${creditData.credits ?? 0} minutes of recorded meetings`}
                  fontSize="md"
                >
                  <span>
                    <BsQuestionCircle size={13} />
                  </span>
                </Tooltip>
              </Flex>
            </Flex>
            <Flex alignItems="center" gap={1}>
              <Text fontSize="sm" fontWeight="semibold">
                Plan:
              </Text>
              <Text fontSize="sm">{plan || "Free"}</Text>
            </Flex>
          </Flex>
        ) : (
          <Flex flexDirection="column" gap={2} w="full">
            <Skeleton height="14px" width="60%" />
            <Skeleton height="14px" width="50%" />
          </Flex>
        )}
      </Flex>
    </Flex>
  );
};

export default AccountPanel;
