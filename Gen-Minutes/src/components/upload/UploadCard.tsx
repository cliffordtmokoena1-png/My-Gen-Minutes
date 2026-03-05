import React from "react";
import { Box, VStack, Heading, Text, Icon } from "@chakra-ui/react";
import { FiUpload } from "react-icons/fi";
import { DropzoneInputProps, DropzoneRootProps } from "react-dropzone";
import { LayoutConfig } from "@/hooks/useDropzoneLayout";

type UploadCardProps = {
  config: LayoutConfig;
  getRootProps: () => DropzoneRootProps;
  getInputProps: () => DropzoneInputProps;
};

export default function UploadCard({ config, getRootProps, getInputProps }: UploadCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      // The dropzone will handle the file selection
    }
  };

  return (
    <Box
      {...getRootProps()}
      bg={config.container.bg}
      borderWidth={config.container.borderWidth}
      borderStyle={config.container.borderStyle}
      borderColor={config.container.borderColor}
      borderRadius={config.container.borderRadius}
      p={config.container.padding}
      w={config.container.width}
      h={config.container.height}
      minH={config.container.minHeight}
      cursor="pointer"
      transition={config.container.transition}
      _hover={{
        bg: "blue.100",
        borderColor: "blue.500",
        transform: "translateY(-2px) scale(1.01)",
        boxShadow: "lg",
      }}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      position="relative"
      role="button"
      aria-label="Upload media file by dragging and dropping or clicking to browse"
      aria-describedby="upload-instructions"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <input {...getInputProps()} />

      <VStack spacing={config.spacing} textAlign="center">
        <Box p={config.icon.padding} bg={config.icon.bg} borderRadius="full" transition="all 0.2s">
          <Icon
            as={FiUpload}
            boxSize={config.icon.size}
            color={config.icon.color}
            aria-hidden="true"
          />
        </Box>

        <VStack spacing={{ base: 2, md: 3 }}>
          <Heading
            size={config.text.heading.size}
            color={config.text.heading.color}
            fontWeight="bold"
          >
            Upload Media File
          </Heading>
          <Text
            color={config.text.body.color}
            fontSize={config.text.body.fontSize}
            textAlign="center"
            fontWeight="semibold"
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
              "Drag and drop or click here"
            )}
          </Text>
          <Text
            color={config.text.subtitle.color}
            fontSize={config.text.subtitle.fontSize}
            textAlign="center"
            id="upload-instructions"
          >
            MP3, MP4, WAV, DOC, TXT, and more
          </Text>
        </VStack>
      </VStack>
    </Box>
  );
}
