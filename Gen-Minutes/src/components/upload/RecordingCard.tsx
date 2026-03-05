import React, { useState, useEffect } from "react";
import { Box, VStack, Heading, Text, Icon } from "@chakra-ui/react";
import { FiMic, FiAlertCircle } from "react-icons/fi";
import { LayoutConfig } from "@/hooks/useDropzoneLayout";
import { getAvailableRecordingTime } from "@/utils/recording";
import useRecordingSessionCreator from "@/hooks/useRecordingSessionCreator";
import { LayoutKind } from "@/pages/dashboard/[[...slug]]";

type RecordingCardProps = {
  config: LayoutConfig;
  isSupported: boolean;
  layoutKind: LayoutKind;
};

export default function RecordingCard({
  config,
  isSupported: propIsSupported,
  layoutKind,
}: RecordingCardProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isSupported = isClient && propIsSupported;
  const [storageWarning, setStorageWarning] = useState<string>("");

  const { createSessionAndNavigate, isCreating, error, clearError } = useRecordingSessionCreator({
    layoutKind,
  });

  const isClickable = isSupported && isClient && !isCreating;

  useEffect(() => {
    if (isClient && isSupported && !isCreating) {
      getAvailableRecordingTime().then(setStorageWarning);
    }
  }, [isClient, isSupported, isCreating]);

  const handleClick = () => {
    if (!isClickable) {
      return;
    }

    if (error) {
      clearError();
    } else {
      createSessionAndNavigate();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && isClickable) {
      e.preventDefault();
      if (error) {
        clearError();
      } else {
        createSessionAndNavigate();
      }
    }
  };

  const getHoverStyles = () => {
    if (!isClient) {
      return {};
    }

    if (error) {
      return isClickable
        ? {
            borderColor: "orange.400",
            bg: "orange.100",
            transform: "translateY(-1px)",
            boxShadow: "sm",
          }
        : {};
    }

    if (isCreating) {
      return {};
    }

    return isClickable
      ? {
          borderColor: "red.400",
          bg: "red.25",
          transform: "translateY(-1px)",
          boxShadow: "sm",
        }
      : {};
  };

  const getAriaLabel = () => {
    if (!isClient) {
      return "Loading recording interface";
    }
    if (error) {
      return "Error occured while recording";
    }
    if (isCreating) {
      return "Creating recording session";
    }
    if (!isClickable) {
      return "Recording not available";
    }
    return "Start recording audio from microphone";
  };

  const renderContent = () => {
    if (!isClient) {
      return (
        <VStack spacing={config.spacing} textAlign="center">
          <Box
            p={config.icon.padding}
            bg={config.icon.bg}
            borderRadius="full"
            transition="all 0.2s"
          >
            <Icon
              as={FiMic}
              boxSize={config.icon.size}
              color={config.icon.color}
              aria-hidden="true"
            />
          </Box>

          <VStack spacing={{ base: 2, md: 2 }}>
            <Heading size={config.text.heading.size} color={config.text.heading.color}>
              Record Audio
            </Heading>
            <Text color="gray.400" fontSize={config.text.body.fontSize} textAlign="center">
              Loading...
            </Text>
          </VStack>
        </VStack>
      );
    }

    if (!isSupported) {
      return (
        <VStack spacing={config.spacing} textAlign="center">
          <Box p={config.icon.padding} bg="gray.200" borderRadius="full" transition="all 0.2s">
            <Icon as={FiMic} boxSize={config.icon.size} color="gray.400" aria-hidden="true" />
          </Box>

          <VStack spacing={{ base: 2, md: 2 }}>
            <Heading size={config.text.heading.size} color="gray.400">
              Record Audio
            </Heading>
            <Text color="gray.400" fontSize={config.text.body.fontSize} textAlign="center">
              Recording not supported in this browser
            </Text>
          </VStack>
        </VStack>
      );
    }

    if (error) {
      return (
        <VStack spacing={config.spacing} textAlign="center">
          <Box p={config.icon.padding} bg="orange.100" borderRadius="full" transition="all 0.2s">
            <Icon
              as={FiAlertCircle}
              boxSize={config.icon.size}
              color="orange.500"
              aria-hidden="true"
            />
          </Box>

          <VStack spacing={{ base: 2, md: 2 }}>
            <Heading size={config.text.heading.size} color="orange.600">
              Recording Error
            </Heading>
            <Text
              color="orange.500"
              fontSize={config.text.body.fontSize}
              textAlign="center"
              fontWeight="medium"
            >
              {config.text.body.content ? (
                <>
                  <Text as="span" display={{ base: "inline", md: "none" }}>
                    Tap to retry
                  </Text>
                  <Text as="span" display={{ base: "none", md: "inline" }}>
                    Click to retry
                  </Text>
                </>
              ) : (
                "Click to retry"
              )}
            </Text>
            <Text color="gray.500" fontSize={config.text.subtitle.fontSize} textAlign="center">
              {error}
            </Text>
          </VStack>
        </VStack>
      );
    }

    if (isCreating) {
      return (
        <VStack spacing={config.spacing} textAlign="center">
          <Box p={config.icon.padding} bg="blue.100" borderRadius="full" transition="all 0.2s">
            <Icon as={FiMic} boxSize={config.icon.size} color="blue.500" aria-hidden="true" />
          </Box>

          <VStack spacing={{ base: 2, md: 2 }}>
            <Heading size={config.text.heading.size} color="blue.600">
              Creating Session
            </Heading>
            <Text color="blue.500" fontSize={config.text.body.fontSize} textAlign="center">
              Setting up your recording session...
            </Text>
          </VStack>
        </VStack>
      );
    }

    return (
      <VStack spacing={config.spacing} textAlign="center">
        <Box p={config.icon.padding} bg={config.icon.bg} borderRadius="full" transition="all 0.2s">
          <Icon
            as={FiMic}
            boxSize={config.icon.size}
            color={config.icon.color}
            aria-hidden="true"
          />
        </Box>

        <VStack spacing={{ base: 2, md: 2 }}>
          <Heading size={config.text.heading.size} color={config.text.heading.color}>
            Record Audio
          </Heading>
          <Text
            color={config.text.body.color}
            fontSize={config.text.body.fontSize}
            textAlign="center"
            fontWeight="medium"
          >
            {config.text.body.content ? (
              <>
                <Text as="span" display={{ base: "inline", md: "none" }}>
                  {config.text.body.content.base}
                </Text>
                <Text as="span" display={{ base: "none", md: "inline" }}>
                  {config.text.body.content.md}
                </Text>
              </>
            ) : (
              "Click to start recording"
            )}
          </Text>
          <Text
            color={config.text.subtitle.color}
            fontSize={config.text.subtitle.fontSize}
            textAlign="center"
          >
            Record your ongoing meeting
          </Text>
          {storageWarning && (
            <Text color="orange.500" fontSize="sm" textAlign="center">
              {storageWarning}
            </Text>
          )}
        </VStack>
      </VStack>
    );
  };

  return (
    <Box
      bg={config.container.bg}
      borderWidth={config.container.borderWidth}
      borderStyle={config.container.borderStyle}
      borderColor={config.container.borderColor}
      borderRadius={config.container.borderRadius}
      p={config.container.padding}
      w={config.container.width}
      h={config.container.height}
      minH={config.container.minHeight}
      cursor={!isClient ? "default" : isClickable ? "pointer" : "default"}
      opacity={!isClient ? 1 : !isClickable ? 0.6 : 1}
      transition={config.container.transition}
      _hover={getHoverStyles()}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      onClick={handleClick}
      role="button"
      aria-label={getAriaLabel()}
      aria-describedby="recording-instructions"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {renderContent()}

      {/* hidden instructions for screen readers because who knows maybe we have some users */}
      <Text id="recording-instructions" position="absolute" left="-10000px" aria-hidden="true">
        {!isClient
          ? "Loading recording interface, please wait"
          : error
            ? "Press Enter or Space to clear error and retry recording"
            : isCreating
              ? "Creating recording session, please wait"
              : isClickable
                ? "Press Enter or Space to start recording audio from your microphone"
                : "Recording is not available"}
      </Text>
    </Box>
  );
}
