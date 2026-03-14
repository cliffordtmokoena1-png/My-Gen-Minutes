import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Radio,
  RadioGroup,
  Stack,
  Text,
  useToast,
  InputGroup,
  InputRightElement,
  Alert,
  AlertIcon,
  Skeleton,
} from "@chakra-ui/react";
import { useContactLookup } from "@/admin/whatsapp/hooks/useContactLookup";
import type { LookupUserApiResponse } from "@/pages/api/admin/lookup-user";
import CreditSituation from "@/components/admin/credit/CreditSituation";

type Props = {
  onSuccess?: () => void;
  initialWhatsappId?: string;
};

export default function CreditManagementForm({ onSuccess, initialWhatsappId }: Props) {
  const [identifier, setIdentifier] = useState("");
  const [tokenAmount, setCreditAmount] = useState<number>(100);
  const [tokenAction, setCreditAction] = useState<"add" | "subtract">("add");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(Boolean(initialWhatsappId));
  const [userInfo, setUserInfo] = useState<LookupUserApiResponse | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const toast = useToast();

  // Look up contact by whatsapp id (phone) to derive an email for identifier
  const { contact, loading: contactLoading, notFound } = useContactLookup(initialWhatsappId);

  const handleLookupUser = async (overrideIdentifier?: string) => {
    const idToUse = (overrideIdentifier ?? identifier).trim();
    if (!idToUse) {
      toast({
        status: "error",
        title: "Input required",
        description: "Please enter an email or user ID",
      });
      return;
    }

    setIsLookingUp(true);
    setLookupError(null);
    setUserInfo(null);

    try {
      const res = await fetch("/api/admin/lookup-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: idToUse }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to look up user");
      }

      setUserInfo(data);
    } catch (error) {
      setLookupError((error as Error).message);
      toast({
        status: "error",
        title: "User lookup failed",
        description: (error as Error).message,
        duration: 5000,
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  // Prefill identifier from contact, and auto trigger lookup once per contact change
  useEffect(() => {
    const emailFromContact = (contact?.email || "").trim();
    if (!emailFromContact) {
      if (notFound) {
        setIdentifier("");
        setIsLookingUp(false);
        setLookupError("No email found for this contact");
      }
      return;
    }
    setIdentifier(emailFromContact);
    // fire and forget lookup with the preferred identifier
    handleLookupUser(emailFromContact);
    // Only react when contact changes, similar to WhatsappFollowupForm pattern
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contact?.email, contactLoading]);

  const handleCreditOperation = async () => {
    await submitCreditOperation(tokenAmount, tokenAction, {
      resetAfter: true,
    });
  };

  const handleModifyToken = async (amount: number) => {
    await submitCreditOperation(amount, "add");
  };

  type SubmitOpts = { resetAfter?: boolean; successDescription?: string };
  const submitCreditOperation = async (
    amount: number,
    action: "add" | "subtract",
    opts: SubmitOpts = {}
  ) => {
    if (!userInfo) {
      toast({
        status: "error",
        title: "No user selected",
        description: "Please look up a user first",
      });
      return;
    }
    if (!amount || amount <= 0) {
      toast({
        status: "error",
        title: "Invalid amount",
        description: "Please enter a valid positive amount",
      });
      return;
    }
    setIsProcessing(true);
    try {
      const res = await fetch("/api/admin/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userInfo.userId, amount, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process token operation");
      }
      toast({
        status: "success",
        title: "Success",
        description:
          opts.successDescription ??
          `Successfully ${action === "subtract" ? "deducted" : "added"} ${Math.abs(amount)} tokens`,
        duration: 4000,
      });
      if (opts.resetAfter) {
        setIdentifier("");
        setCreditAmount(100);
        setUserInfo(null);
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      toast({
        status: "error",
        title: "Error",
        description: (error as Error).message,
        duration: 5000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Stack spacing={5}>
      <FormControl isRequired>
        <FormLabel>Email or User ID</FormLabel>
        <InputGroup>
          <Input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="email@example.com or user_..."
            isDisabled={isLookingUp || contactLoading}
          />
          <InputRightElement width="4.5rem" mx={2}>
            <Button
              h="1.75rem"
              size="sm"
              onClick={() => handleLookupUser()}
              isLoading={isLookingUp}
              isDisabled={contactLoading}
            >
              Look up
            </Button>
          </InputRightElement>
        </InputGroup>
        <Text fontSize="sm" color="gray.500" mt={1}>
          Enter an email address or Clerk user ID
        </Text>
      </FormControl>

      {lookupError && (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {lookupError}
        </Alert>
      )}

      {userInfo ? (
        <Alert status="success" borderRadius="md">
          <AlertIcon />
          <Stack spacing={0} width="100%">
            <Flex justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Text fontWeight="bold">User found:</Text>
                <Text>{userInfo.email}</Text>
                <Text>{userInfo.displayName}</Text>
                <Text fontSize="sm" color="gray.500">
                  ID: {userInfo.userId}
                </Text>
              </Box>
              <Box textAlign="right">
                <Text fontWeight="bold">Current Tokens:</Text>
                <Text
                  fontSize="xl"
                  fontWeight="bold"
                  color={userInfo.tokens && userInfo.tokens > 0 ? "green.500" : "red.500"}
                >
                  {userInfo.tokens !== undefined ? userInfo.tokens.toLocaleString() : "--"}
                </Text>
              </Box>
            </Flex>
          </Stack>
        </Alert>
      ) : isLookingUp ? (
        <Box h="120px">
          <Stack flex="1">
            <Skeleton height="5" />
            <Skeleton height="5" width="80%" />
            <Skeleton height="5" width="60%" />
          </Stack>
        </Box>
      ) : null}

      <FormControl isRequired>
        <FormLabel>Action</FormLabel>
        <RadioGroup
          value={tokenAction}
          onChange={(val) => setCreditAction(val as "add" | "subtract")}
        >
          <HStack spacing={4}>
            <Radio value="add" colorScheme="green">
              Add Tokens
            </Radio>
            <Radio value="subtract" colorScheme="red">
              Remove Tokens
            </Radio>
          </HStack>
        </RadioGroup>
      </FormControl>

      <FormControl isRequired>
        <FormLabel>Amount</FormLabel>
        <NumberInput
          min={1}
          value={tokenAmount}
          onChange={(_, val) => setCreditAmount(isNaN(val) ? 0 : val)}
        >
          <NumberInputField placeholder="100" />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </FormControl>

      <Button
        mt={2}
        colorScheme={tokenAction === "add" ? "green" : "red"}
        onClick={handleCreditOperation}
        isLoading={isProcessing}
        loadingText="Processing..."
        isDisabled={!userInfo}
      >
        {tokenAction === "add" ? "Add Tokens" : "Remove Tokens"}
      </Button>

      {userInfo && (
        <CreditSituation
          userId={userInfo.userId}
          tokens={userInfo.tokens}
          onModifyToken={handleModifyToken}
        />
      )}
    </Stack>
  );
}
