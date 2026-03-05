import React from "react";
import {
  Text,
  Heading,
  Spinner,
  VStack,
  Box,
  Grid,
  GridItem,
  useBreakpointValue,
} from "@chakra-ui/react";
import { useDropzone } from "react-dropzone";
import { useDropzoneLayout } from "@/hooks/useDropzoneLayout";
import DragDropOverlay from "./DragDropOverlay";
import UploadCard from "./UploadCard";
import RecordingCard from "./RecordingCard";
import { LayoutKind } from "@/pages/dashboard/[[...slug]]";
import PwaInstallPrompt from "../PwaInstallPrompt";

type Props = {
  isTransitioning: boolean;
  onDrop: (files: File[]) => Promise<void>;
  isSupported: boolean;
  layoutKind: LayoutKind;
};

export default function MediaUploadInterface({
  isTransitioning,
  onDrop,
  isSupported,
  layoutKind,
}: Props) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
  });

  const layout = useDropzoneLayout({ isDragActive, recordingState: "idle" });
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? false;

  if (isTransitioning) {
    return (
      <VStack w="full" h="full" justifyContent="center" alignItems="center" spacing={4}>
        <Spinner size="xl" color="blue.500" thickness="3px" />
        <Text color="gray.600" fontSize="md">
          Processing...
        </Text>
      </VStack>
    );
  }

  if (layout.type === "dragActive") {
    return (
      <DragDropOverlay
        config={layout.config}
        getRootProps={getRootProps}
        getInputProps={getInputProps}
      />
    );
  }

  return (
    <Box
      w={{ base: "full", md: "md", lg: "4xl" }}
      maxW="100%"
      px={{ base: 4, md: 0 }}
      role="region"
      aria-label="Media upload interface"
    >
      {!isMobile && (
        <VStack spacing={2} mb={{ base: 4, lg: 8 }} textAlign="center">
          <Heading size={{ base: "md", md: "xl" }} color="gray.700" fontWeight="bold">
            Get your minutes
          </Heading>
          <Text color="gray.600" fontSize={{ base: "sm", md: "lg" }}>
            Upload audio, video, or document files, or record directly to get started
          </Text>
        </VStack>
      )}

      {/* Mobile Layout */}
      <Box display={{ base: "block", lg: "none" }} w="full">
        <VStack spacing={3} w="full">
          <PwaInstallPrompt />

          <UploadCard
            config={layout.uploadCard}
            getRootProps={getRootProps}
            getInputProps={getInputProps}
          />

          <RecordingCard
            config={layout.recordingCard}
            isSupported={isSupported}
            layoutKind={layoutKind}
          />
        </VStack>
      </Box>

      {/* Desktop Layout */}
      <Box display={{ base: "none", lg: "block" }} w="full">
        <Grid templateColumns="1fr 1fr" gap={6} w="full">
          <GridItem>
            <UploadCard
              config={layout.uploadCard}
              getRootProps={getRootProps}
              getInputProps={getInputProps}
            />
          </GridItem>

          <GridItem>
            <RecordingCard
              config={layout.recordingCard}
              isSupported={isSupported}
              layoutKind={layoutKind}
            />
          </GridItem>
        </Grid>
      </Box>
    </Box>
  );
}
