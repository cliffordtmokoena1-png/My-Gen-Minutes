import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useToast,
  Text,
  FormHelperText,
} from "@chakra-ui/react";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useOrgContext } from "@/contexts/OrgContext";

type CreateAgendaModalProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (seriesId: string) => void;
}>;

export default function CreateAgendaModal({ isOpen, onClose, onSuccess }: CreateAgendaModalProps) {
  const { getToken } = useAuth();
  const { orgId } = useOrgContext();
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

      const generateResponse = await fetch(`/api/agendas/${id}/generate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!generateResponse.ok) {
        throw new Error("Failed to generate agenda");
      }

      toast({
        title: "Agenda created successfully",
        status: "success",
        duration: 3000,
      });

      onSuccess(id.toString());
      handleClose();
    } catch (error) {
      console.error("Error creating agenda:", error);
      toast({
        title: "Failed to create agenda",
        description: error instanceof Error ? error.message : "Please try again",
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setSourceText("");
    onClose();
  };

  const charCount = sourceText.length;
  const maxChars = 20000;
  const isOverLimit = charCount > maxChars;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create New Agenda</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Agenda Title (Optional)</FormLabel>
              <Input
                placeholder="e.g., Monthly Board Meeting"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={255}
              />
            </FormControl>

            <FormControl isRequired isInvalid={isOverLimit}>
              <FormLabel>Meeting Context</FormLabel>
              <Textarea
                placeholder="Paste meeting notes, topics to discuss, or any context for the agenda..."
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                rows={10}
                resize="vertical"
              />
              <FormHelperText>
                <Text color={isOverLimit ? "red.500" : "gray.500"}>
                  {charCount.toLocaleString()} / {maxChars.toLocaleString()} characters
                </Text>
              </FormHelperText>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose} isDisabled={isCreating}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isCreating}
            loadingText="Creating..."
            isDisabled={!sourceText.trim() || isOverLimit}
          >
            Create Agenda
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
