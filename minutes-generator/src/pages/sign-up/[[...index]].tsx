import EmailForm from "@/components/EmailForm";
import IconWordmark from "@/components/IconWordmark";
import { withGsspErrorHandling } from "@/error/withErrorReporting";
import isFbIg from "@/utils/isFbIg";
import isMobile from "@/utils/isMobile";
import { Flex } from "@chakra-ui/react";
import { SignUp, useUser } from "@clerk/nextjs";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export const getServerSideProps: GetServerSideProps = withGsspErrorHandling(async (context) => {
  const userAgent = context.req.headers["user-agent"] || "";

  return {
    props: {
      isFbIg: isFbIg(userAgent),
      isMobile: isMobile(context.req.headers),
    },
  };
});

type Props = {
  isFbIg: boolean;
  isMobile: boolean;
};

export default function SignUpPage({ isFbIg, isMobile }: Props) {
  const router = useRouter();
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const { isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return null;
  }

  const redirectUrl = "/dashboard";

  return (
    <Flex
      direction="column"
      maxH="100dvh"
      minH="100dvh"
      justifyContent="center"
      alignItems="center"
    >
      {isFbIg ? (
        <Flex flexDir="column" w="80%" gap={10} justifyContent="center">
          <IconWordmark />
          <EmailForm submitted={emailSubmitted} onSubmit={() => setEmailSubmitted(true)} />
        </Flex>
      ) : (
        <SignUp
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
          fallbackRedirectUrl={redirectUrl}
        />
      )}
    </Flex>
  );
}
