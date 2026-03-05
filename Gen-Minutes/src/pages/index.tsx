import type { GetStaticProps } from "next";
import LandingPageWrapper from "@/components/landing/LandingPageWrapper";
import { LandingPageContent } from "@/types/landingPage";
import { generateLandingPageStaticProps } from "@/components/landing/pseo/config";

type Props = {
  content: LandingPageContent;
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  return generateLandingPageStaticProps("default");
};

export default function LandingPage({ content }: Props) {
  return <LandingPageWrapper content={content} />;
}
