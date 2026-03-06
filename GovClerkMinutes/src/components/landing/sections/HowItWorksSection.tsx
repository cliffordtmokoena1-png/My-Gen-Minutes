import { Box, Container, Heading, Text, VStack } from "@chakra-ui/react";
import { safeCapture } from "@/utils/safePosthog";

export const HowItWorksSection = () => {
  return (
    <Box
      as="section"
      id="how-it-works"
      py={{ base: 16, md: 24 }}
      bg="white"
      onMouseEnter={() => {
        safeCapture("new_landing_page_section_seen", {
          section: "how_it_works",
          variant: "v2",
        });
      }}
    >
      <Container maxW="7xl">
        <VStack spacing={{ base: 8, md: 12 }}>
          <VStack spacing={4} textAlign="center">
            <Heading
              as="h2"
              fontSize={{ base: "3xl", md: "5xl" }}
              fontWeight="normal"
              fontFamily="Georgia, serif"
              color="gray.800"
            >
              See How It Works
            </Heading>
            <Text fontSize={{ base: "lg", md: "xl" }} color="gray.600" maxW="2xl">
              Watch how easy it is to generate professional meeting minutes in seconds
            </Text>
          </VStack>

          <Box
            w="full"
            borderRadius="2xl"
            overflow="hidden"
            bg="rgba(239, 246, 255, 0.3)"
            border="1px solid"
            borderColor="rgba(59, 130, 246, 0.2)"
            boxShadow="xl"
            position="relative"
            paddingBottom="56.25%"
            height={0}
          >
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};
