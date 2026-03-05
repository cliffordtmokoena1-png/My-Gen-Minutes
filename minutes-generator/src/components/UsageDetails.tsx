import React from "react";
import {
  Box,
  Text,
  Button,
  Progress,
  Flex,
  HStack,
  Tooltip,
  Icon,
  VStack,
  Link,
} from "@chakra-ui/react";
import { MdHelpOutline } from "react-icons/md";
import NextLink from "next/link";
import { ApiGetCustomerDetailsResponse } from "@/pages/api/get-customer-details";

interface UsageDetailsProps {
  subscriptionData: ApiGetCustomerDetailsResponse;
  subscriptionPaused: boolean;
  subscriptionCanceled: boolean;
  isFreeUser: boolean;
  currentUsage: number;
  creditUsagePercentage: number;
  excessCredits: number;
  hasExcessCredits: boolean;
  daysUntilReset: number;
  isLoadingCreditDetails: boolean;
  fetchCreditDetails: () => void;
}

export default function UsageDetails({
  subscriptionData,
  subscriptionPaused,
  subscriptionCanceled,
  isFreeUser,
  currentUsage,
  creditUsagePercentage,
  excessCredits,
  hasExcessCredits,
  daysUntilReset,
  isLoadingCreditDetails,
  fetchCreditDetails,
}: UsageDetailsProps) {
  return (
    <VStack align="stretch" spacing={4}>
      {subscriptionPaused || subscriptionCanceled || isFreeUser ? (
        <Text fontSize="sm" color="gray.600">
          Need more credits? Please upgrade to a paid plan in the{" "}
          <NextLink href="/dashboard" passHref>
            <Link color="blue.500">Dashboard</Link>
          </NextLink>
          .
        </Text>
      ) : (
        <Text fontSize="sm" color="gray.600">
          Your credit usage will reset in{" "}
          <strong>
            {daysUntilReset} day{daysUntilReset > 1 && "s"}
          </strong>
          .
        </Text>
      )}

      <Box borderWidth={1} borderColor="gray.200" p={4} borderRadius="md" boxShadow="sm">
        <Text fontSize="sm" color="gray.600" mb={4}>
          You can transcribe up to <strong>{subscriptionData.remainingCredits} minutes</strong> of
          media.
        </Text>

        {hasExcessCredits && (
          <Box mb={4}>
            <Flex justify="space-between" align="center" mb={2}>
              <HStack>
                <Text fontSize="sm" fontWeight="bold">
                  One-Time Credits
                </Text>
                <Tooltip label="One-Time credits will be used first before your plan credits">
                  <span>
                    <Icon as={MdHelpOutline} boxSize={4} color="gray.500" />
                  </span>
                </Tooltip>
              </HStack>
              <Text fontSize="sm">{excessCredits}</Text>
            </Flex>
            <Progress value={100} colorScheme="purple" size="sm" borderRadius="md" />
          </Box>
        )}

        <Flex justify="space-between" align="center" mb={2}>
          <Text fontSize="sm" fontWeight="bold">
            {subscriptionPaused || subscriptionCanceled ? "Previous" : "Current"} Plan
          </Text>
          <Text fontSize="sm">
            {currentUsage} of {subscriptionData.creditsPerMonth} used
          </Text>
        </Flex>
        <Progress value={creditUsagePercentage} colorScheme="green" size="sm" borderRadius="md" />

        <Button
          mt={4}
          size="sm"
          variant="outline"
          onClick={fetchCreditDetails}
          isLoading={isLoadingCreditDetails}
          loadingText="Generating detailed report..."
        >
          View Detailed Credit Usage
        </Button>
      </Box>
    </VStack>
  );
}
