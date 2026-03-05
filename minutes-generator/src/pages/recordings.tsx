import React from "react";
import { Box, Container, Heading, Text, VStack, Flex } from "@chakra-ui/react";
import { useAuth } from "@clerk/nextjs";
import MgHead from "@/components/MgHead";
import { withGsspErrorHandling } from "@/error/withErrorReporting";
import RecordingsList from "@/components/recordings/RecordingsList";
import DesktopLayout from "@/components/layouts/DesktopLayout";
import AnnouncementBar, { useAnnouncementBarHeight } from "@/components/AnnouncementBar";

export const getServerSideProps = withGsspErrorHandling(async () => {
  return {
    props: {},
  };
});

export default function RecordingsPage() {
  const { isLoaded } = useAuth();
  const announcementBarHeight = useAnnouncementBarHeight();
  const mainContainerHeight = `calc(100dvh - ${announcementBarHeight}px)`;

  if (!isLoaded) {
    return (
      <>
        <MgHead title="Recordings" />
        <AnnouncementBar />
        <Container maxW="container.lg" py={8}>
          <Text>Loading...</Text>
        </Container>
      </>
    );
  }

  const recordingsContent = (
    <VStack spacing={6} align="stretch">
      <Box>
        <Heading as="h1" size="lg" mb={2}>
          Your Recordings
        </Heading>
        <Text color="gray.600">
          Download and manage your audio recordings stored locally on this device.
        </Text>
      </Box>
      <RecordingsList />
    </VStack>
  );

  return (
    <>
      <MgHead title="Recordings" />
      <AnnouncementBar />

      <Flex w="full" h={mainContainerHeight} mt={`${announcementBarHeight}px`}>
        <DesktopLayout>
          <Container maxW="container.xl" py={8} w="full">
            {recordingsContent}
          </Container>
        </DesktopLayout>

        <Container maxW="container.lg" py={8} display={{ base: "block", md: "none" }}>
          {recordingsContent}
        </Container>
      </Flex>
    </>
  );
}
