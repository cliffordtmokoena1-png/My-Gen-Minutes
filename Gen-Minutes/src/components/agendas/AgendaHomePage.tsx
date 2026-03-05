import React, { useState } from "react";
import { VStack, Heading, Text, Textarea, Button, Input, useToast, Flex } from "@chakra-ui/react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { FaMagic } from "react-icons/fa";
import { safeCapture } from "@/utils/safePosthog";
import { useOrgContext } from "@/contexts/OrgContext";

export default function AgendaHomePage() {
  const { getToken } = useAuth();
  const { orgId } = useOrgContext();
  const router = useRouter();
  const toast = useToast();

  const [title, setTitle] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async () => {
    if (!sourceText.trim()) {
      toast({
        title: "Please provide meeting context",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    setIsCreating(true);

    try {
      const token = await getToken();

      const createResponse = await fetch("/api/agendas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sourceText: sourceText.trim(),
          title: title.trim() || null,
          orgId: orgId,
        }),
      });

      if (!createResponse.ok) {
        throw new Error("Failed to create agenda");
      }

      const { id } = await createResponse.json();

      safeCapture("agenda_created", { agenda_id: id });

      router.push(`/agendas/${id}`);

      fetch(`/api/agendas/${id}/generate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).catch((error) => {
        console.error("Generation request failed:", error);
      });
    } catch (error) {
      console.error("Error creating agenda:", error);
      toast({
        title: "Failed to create agenda",
        description: error instanceof Error ? error.message : "Please try again",
        status: "error",
        duration: 5000,
      });
      setIsCreating(false);
    }
  };

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      w="full"
      h="100%"
      minH="100dvh"
      px={{ base: 4, md: 6 }}
      py={{ base: 8, md: 12 }}
      overflowY="auto"
    >
      <VStack spacing={{ base: 4, md: 6 }} maxW="2xl" w="full">
        <VStack spacing={2} textAlign="center">
          <Heading size={{ base: "lg", md: "xl" }} fontWeight="semibold" color="gray.800">
            Create an agenda
          </Heading>
          <Text fontSize={{ base: "sm", md: "md" }} color="gray.500">
            Paste your meeting notes below
          </Text>
        </VStack>

        <VStack spacing={3} w="full">
          <Input
            placeholder="Agenda title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            size="md"
            maxLength={255}
            variant="filled"
            bg="gray.50"
            _hover={{ bg: "gray.100" }}
            _focus={{ bg: "white", borderColor: "blue.400" }}
          />

          <Textarea
            placeholder="Paste meeting notes, topics to discuss, or any context for the agenda..."
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            rows={8}
            resize="vertical"
            size="md"
            maxLength={20000}
            variant="filled"
            bg="gray.50"
            _hover={{ bg: "gray.100" }}
            _focus={{ bg: "white", borderColor: "blue.400" }}
            fontSize={{ base: "sm", md: "md" }}
          />

          <Flex w="full" justify="flex-end" align="center" px={1}>
            <Text fontSize="xs" color="gray.400">
              {sourceText.length.toLocaleString()} / 20,000
            </Text>
          </Flex>

          <Button
            rightIcon={<FaMagic />}
            colorScheme="blue"
            size="md"
            onClick={handleSubmit}
            isLoading={isCreating}
            loadingText="Generating..."
            isDisabled={!sourceText.trim() || sourceText.length > 20000}
            w="full"
            borderRadius="md"
          >
            Generate agenda
          </Button>
        </VStack>
      </VStack>
    </Flex>
  );
}
