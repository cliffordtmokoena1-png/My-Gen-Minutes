import ClerkDirectNavBar from "./ClerkDirectNavBar";
import ClerkDirectFooter from "./ClerkDirectFooter";
import ClerkDirectAnnouncementBar from "./ClerkDirectAnnouncementBar";
import ClerkDirectHeroSection from "./sections/ClerkDirectHeroSection";
import ClerkDirectTrustLogosSection from "./sections/ClerkDirectTrustLogosSection";
import ClerkDirectStatsSection from "./sections/ClerkDirectStatsSection";
import ClerkDirectWhySection from "./sections/ClerkDirectWhySection";
import ClerkDirectFeaturesSection from "./sections/ClerkDirectFeaturesSection";
import ClerkDirectHowItWorksSection from "./sections/ClerkDirectHowItWorksSection";
import ClerkDirectAiSection from "./sections/ClerkDirectAiSection";
import ClerkDirectRolesSection from "./sections/ClerkDirectRolesSection";
import ClerkDirectIntegrationsSection from "./sections/ClerkDirectIntegrationsSection";
import ClerkDirectComplianceSection from "./sections/ClerkDirectComplianceSection";
import ClerkDirectTestimonialsSection from "./sections/ClerkDirectTestimonialsSection";
import ClerkDirectFaqSection from "./sections/ClerkDirectFaqSection";
import ClerkDirectCtaSection from "./sections/ClerkDirectCtaSection";
import ClerkDirectHead from "./ClerkDirectHead";

export default function ClerkDirectLandingPage() {
  return (
    <div className="relative min-h-screen">
      <ClerkDirectHead />
      <ClerkDirectAnnouncementBar />
      <ClerkDirectNavBar />

      <div className="flex flex-col">
        <ClerkDirectHeroSection />
        <ClerkDirectTrustLogosSection />
        <ClerkDirectStatsSection />
        <ClerkDirectWhySection />
        <ClerkDirectFeaturesSection />
        <ClerkDirectHowItWorksSection />
        <ClerkDirectAiSection />
        <ClerkDirectRolesSection />
        <ClerkDirectIntegrationsSection />
        <ClerkDirectComplianceSection />
        <ClerkDirectTestimonialsSection />
        <ClerkDirectFaqSection />
        <ClerkDirectCtaSection />
      </div>

      <ClerkDirectFooter />
    </div>
  );
}
