import React, { useContext, useState, useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  Spinner,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  VStack,
  Heading,
  Button,
  Icon,
  Divider,
  Link,
  Tooltip,
} from "@chakra-ui/react";
import useUploadProgress from "@/hooks/useUploadProgress";
import { UploadUriContext } from "./UploadUriProvider";
import { getFileFromStorage, getTranscriptRecordFromStorage } from "@/common/indexeddb";
import { uploadWithAdaptiveConcurrency, DEFAULT_OPTIONS } from "@/common/adaptiveConcurrency";
import { useRouter } from "next/router";
import { safeCapture } from "@/utils/safePosthog";
import { isDev } from "@/utils/dev";
import { TOP_BAR_HEIGHT_PX } from "./ProductTopBar";
import { MdErrorOutline, MdOutlineArrowBack, MdRefresh, MdDashboard } from "react-icons/md";
import { IntercomContext } from "./IntercomProvider";

type Props = {
  transcriptId?: number;
  uploadComplete?: boolean;
  transcribeFinished?: boolean;
  onRetry?: () => void;
  onUploadRetry?: (transcriptId: number) => Promise<void>;
  transcribeFailedMessage?: string;
  transcribeFailed?: boolean;
  uploadStalled?: boolean;
  transcriptTitle?: string;
};

export default function UploadProgressScreen({
  transcriptId,
  uploadComplete,
  transcribeFinished,
  onRetry,
  onUploadRetry,
  transcribeFailedMessage,
  transcribeFailed,
  uploadStalled,
  transcriptTitle,
}: Props) {
  const { chunksUploaded, totalChunks, uploadProgressError } = useUploadProgress(transcriptId);
  const [fileExistsInIndexedDB, setFileExistsInIndexedDB] = useState<boolean>(false);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [isRetryInProgress, setIsRetryInProgress] = useState<boolean>(false);
  const router = useRouter();
  const { uploadUriMap } = useContext(UploadUriContext);
  const { show: showIntercom } = useContext(IntercomContext);
  const uploadUriRecord = transcriptId != null ? uploadUriMap[transcriptId] : null;
  const fileName = transcriptTitle || uploadUriRecord?.filename || "File";

  const percentComplete = totalChunks > 0 ? Math.floor((100.0 * chunksUploaded) / totalChunks) : 0;

  const showError = (transcribeFailed || uploadStalled) && !isRetryInProgress;

  // Force uploading status when retry is in progress
  const isUploading = !uploadComplete || isRetryInProgress;

  const getStatusMessage = () => {
    if (isRetryInProgress) {
      return "Retrying Upload";
    }

    if (transcribeFailed) {
      return "Transcription failed";
    }

    if (uploadStalled) {
      return "Upload failed";
    }

    if (!uploadComplete) {
      return "Uploading";
    }

    if (!transcribeFinished) {
      return "Transcribing";
    }

    return "Processing";
  };

  // Check if the file exists in IndexedDB
  useEffect(() => {
    async function checkFile() {
      if (transcriptId && (uploadStalled || uploadProgressError)) {
        try {
          const file = await getFileFromStorage(transcriptId);
          const transcript = await getTranscriptRecordFromStorage(transcriptId);
          setFileExistsInIndexedDB(file !== undefined && transcript !== undefined);
        } catch (err) {
          console.error("Error checking IndexedDB:", err);
          setFileExistsInIndexedDB(false);
        }
      }
    }

    checkFile();
  }, [transcriptId, uploadStalled, uploadProgressError]);

  const handleRetryUpload = async () => {
    if (!transcriptId || !fileExistsInIndexedDB) {
      return;
    }

    setIsRetrying(true);
    setIsRetryInProgress(true);

    try {
      if (onUploadRetry) {
        await onUploadRetry(transcriptId);
      }
    } catch (err) {
      console.error("Error retrying upload:", err);
      safeCapture("retry_upload_error", {
        transcript_id: transcriptId,
        error: err instanceof Error ? err.message : String(err),
      });
      setIsRetryInProgress(false);
    } finally {
      setIsRetrying(false);
    }
  };

  const getErrorMessage = () => {
    if (transcribeFailed && transcribeFailedMessage) {
      return transcribeFailedMessage;
    }

    if (uploadStalled) {
      return "The upload process was interrupted or failed to complete. Please try again.";
    }

    return "There was an error processing your file.";
  };

  return (
    <Flex
      flexDir="column"
      w="full"
      h="full"
      alignItems="center"
      justifyContent="center"
      bg="white"
      pt={`${TOP_BAR_HEIGHT_PX}px`}
      px={4}
    >
      <VStack spacing={6} align="center" maxW="700px" w="full">
        {showError ? (
          <Box w="full" py={8}>
            <VStack spacing={8} align="center">
              <Icon as={MdErrorOutline} w={20} h={20} color="red.500" opacity={0.9} />

              <VStack spacing={2}>
                <Heading size="lg" color="gray.700" fontWeight="semibold">
                  {uploadStalled ? "Upload Failed" : "Transcription Failed"}
                </Heading>
                <Text color="gray.500" fontSize="md" textAlign="center" maxW="md">
                  {getErrorMessage()}
                </Text>

                <Text fontSize="xs" color="gray.400" textAlign="center" mt={2} maxW="sm">
                  No charges were applied for this failed process.
                  <br />
                  If you believe you were charged in error,{" "}
                  <Link
                    color="blue.500"
                    onClick={(e) => {
                      e.preventDefault();
                      showIntercom();
                    }}
                    cursor="pointer"
                    textDecoration="underline"
                  >
                    contact support
                  </Link>
                  .
                </Text>
              </VStack>

              <Flex mt={6} direction="column" gap={3} width="full" maxW="md" alignItems="center">
                <Tooltip
                  isDisabled={fileExistsInIndexedDB || !uploadStalled}
                  label="Original file data is no longer available. Please upload the file again."
                  placement="top"
                  hasArrow
                >
                  <Button
                    size="md"
                    colorScheme={!fileExistsInIndexedDB || !uploadStalled ? "gray" : "blue"}
                    onClick={handleRetryUpload}
                    px={8}
                    borderRadius="full"
                    boxShadow="sm"
                    _hover={{
                      boxShadow:
                        !fileExistsInIndexedDB || !uploadStalled ? {} : { boxShadow: "md" },
                    }}
                    isLoading={isRetrying}
                    loadingText="Retrying"
                    width="full"
                    maxW="xs"
                    isDisabled={!fileExistsInIndexedDB || !uploadStalled}
                    opacity={!fileExistsInIndexedDB || !uploadStalled ? 0.6 : 1}
                    cursor={!fileExistsInIndexedDB || !uploadStalled ? "not-allowed" : "pointer"}
                    leftIcon={<Icon as={MdRefresh} />}
                  >
                    Retry Upload
                  </Button>
                </Tooltip>

                <Button
                  size="md"
                  colorScheme={fileExistsInIndexedDB && uploadStalled ? "gray" : "blue"}
                  onClick={onRetry}
                  px={8}
                  borderRadius="full"
                  boxShadow="sm"
                  _hover={{ boxShadow: "md" }}
                  variant={fileExistsInIndexedDB && uploadStalled ? "outline" : "solid"}
                  width="full"
                  maxW="xs"
                  isDisabled={!onRetry}
                  leftIcon={<Icon as={MdDashboard} />}
                >
                  Return to Dashboard
                </Button>
              </Flex>
            </VStack>
          </Box>
        ) : (
          <Box w="full" py={6}>
            <VStack spacing={8} align="center">
              {/* Display filename prominently */}
              <VStack spacing={1}>
                <Heading size="md" color="gray.700" fontWeight="semibold">
                  {fileName}
                </Heading>
                <Text color="gray.500" fontSize="sm">
                  {getStatusMessage()}
                </Text>
              </VStack>

              {/* Upload progress with cleaner styling */}
              <Box w="full" maxW="md">
                {isUploading ? (
                  <VStack spacing={2} w="full">
                    <Progress
                      w="full"
                      value={percentComplete}
                      size="md"
                      colorScheme="blue"
                      borderRadius="full"
                      boxShadow="sm"
                      bg="blue.50"
                    />
                    <Text fontSize="sm" color="blue.600" alignSelf="flex-end" fontWeight="medium">
                      {percentComplete}%
                    </Text>
                  </VStack>
                ) : !uploadComplete || isRetryInProgress ? null : ( // Skip this case during retry in progress - handled above
                  <VStack spacing={3} w="full">
                    <Flex gap={3} alignItems="center" justifyContent="center">
                      <Spinner size="md" color="blue.500" thickness="3px" />
                    </Flex>
                    <Text fontSize="sm" color="gray.600" textAlign="center">
                      {transcribeFinished &&
                        "This may take a few minutes depending on the file size"}
                    </Text>
                  </VStack>
                )}
              </Box>
              {!transcribeFinished && (
                <Text fontSize="xs" color="gray.400" textAlign="center" maxW="sm">
                  Please keep this tab open while we process your file.
                </Text>
              )}
            </VStack>
          </Box>
        )}
      </VStack>
    </Flex>
  );
}
