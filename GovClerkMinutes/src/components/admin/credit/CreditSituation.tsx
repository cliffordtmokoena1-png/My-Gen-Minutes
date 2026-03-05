import useSWR from "swr";
import {
  Box,
  Heading,
  Spinner,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  IconButton,
  HStack,
  useToast,
} from "@chakra-ui/react";
import { CopyIcon } from "@chakra-ui/icons";
import type { CreditSituation } from "@/pages/api/admin/get-credit-situation";

type Props = {
  userId: string;
  credits: number;
  onModifyCredits: (amount: number) => Promise<void> | void;
};

export default function CreditSituation({ userId, credits, onModifyCredits }: Props) {
  const { data, error, isLoading } = useSWR<
    { rows: CreditSituation[] },
    any,
    [string, string] | null
  >(
    userId ? ["/api/admin/get-credit-situation", userId] : null,
    async ([url, id]) => {
      const res = await fetch(url as string, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || `Request failed (${res.status})`);
      }
      return (await res.json()) as { rows: CreditSituation[] };
    },
    { revalidateOnFocus: false }
  );

  const rows = data?.rows ?? [];
  const toast = useToast();

  const copyUrl = async (transcriptId: number) => {
    const url = `https://GovClerkMinutes.com/dashboard/${transcriptId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        status: "success",
        title: "Copied",
        description: "Dashboard URL copied to clipboard",
        duration: 2500,
      });
    } catch (e) {
      toast({
        status: "error",
        title: "Copy failed",
        description: (e as Error).message,
      });
    }
  };

  return (
    <Box mt={6} borderTopWidth={1} pt={4}>
      <Heading size="sm" mb={3}>
        Credit situation
      </Heading>
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <Text color="red.500">{(error as Error).message}</Text>
      ) : rows.length === 0 ? (
        <Text color="gray.500">No entries.</Text>
      ) : (
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th>Transcript</Th>
              <Th>Created</Th>
              <Th>Paused</Th>
              <Th>Finished</Th>
              <Th isNumeric>Credits required</Th>
              <Th>Action</Th>
            </Tr>
          </Thead>
          <Tbody>
            {rows.map((r) => {
              const deficit = Math.max(0, r.creditsRequired - credits);
              const canAdd = r.transcribePaused && deficit > 0;
              return (
                <Tr key={r.transcriptId}>
                  <Td>
                    <HStack spacing={2}>
                      <Button
                        variant="link"
                        colorScheme="blue"
                        onClick={() => copyUrl(r.transcriptId)}
                      >
                        #{r.transcriptId}
                      </Button>
                      <IconButton
                        aria-label="Copy dashboard URL"
                        icon={<CopyIcon />}
                        size="sm"
                        variant="ghost"
                        onClick={() => copyUrl(r.transcriptId)}
                      />
                    </HStack>
                  </Td>
                  <Td>{new Date(r.createdAt).toLocaleString()}</Td>
                  <Td>{r.transcribePaused ? "Yes" : "No"}</Td>
                  <Td>{r.transcribeFinished ? "Yes" : "No"}</Td>
                  <Td isNumeric>{r.creditsRequired.toLocaleString()}</Td>
                  <Td>
                    {canAdd ? (
                      <Button
                        size="sm"
                        colorScheme="green"
                        onClick={() => onModifyCredits(deficit)}
                      >
                        Add {deficit} credits
                      </Button>
                    ) : (
                      <Text color="gray.400">—</Text>
                    )}
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      )}
    </Box>
  );
}
