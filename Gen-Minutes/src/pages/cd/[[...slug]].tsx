import Link from "next/link";
import { useRouter } from "next/router";
import ClerkDirectLandingPage from "@/components/landing/clerkdirect/ClerkDirectLandingPage";
import ClerkDirectPageLayout from "@/components/landing/clerkdirect/ClerkDirectPageLayout";
import ClerkDirectHead from "@/components/landing/clerkdirect/ClerkDirectHead";
import ClerkDirectSubPageHero from "@/components/landing/clerkdirect/templates/ClerkDirectSubPageHero";
import ClerkDirectFeatureDetailSection from "@/components/landing/clerkdirect/templates/ClerkDirectFeatureDetailSection";
import ClerkDirectCtaSection from "@/components/landing/clerkdirect/sections/ClerkDirectCtaSection";
import { findPageBySlug } from "@/components/landing/clerkdirect/clerkDirectPages";

export default function ClerkDirectCatchAll() {
  const router = useRouter();
  const slugParts = router.query.slug;

  // Render the layout shell while the router hydrates so the page
  // reserves its full height and avoids a CLS flash.
  if (!router.isReady) {
    return (
      <ClerkDirectPageLayout>
        <div className="min-h-[60vh]" />
      </ClerkDirectPageLayout>
    );
  }

  if (!slugParts || slugParts.length === 0) {
    return <ClerkDirectLandingPage />;
  }

  const slug = Array.isArray(slugParts) ? slugParts.join("/") : slugParts;
  const pageData = findPageBySlug(slug);

  if (!pageData) {
    return (
      <ClerkDirectPageLayout>
        <ClerkDirectHead
          title="Page Not Found | ClerkDirect"
          description="The page you are looking for does not exist."
          noindex
        />
        <div className="flex min-h-[60vh] items-center justify-center px-6">
          <div className="text-center">
            <h1 className="font-serif text-4xl font-normal text-gray-800 md:text-5xl">
              Page Not Found
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              The page you are looking for does not exist or has been moved.
            </p>
            <Link
              href="/"
              className="mt-8 inline-block rounded-lg bg-cd-blue px-8 py-3 text-base font-semibold text-white transition-all hover:bg-cd-blue-dark hover:shadow-md"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </ClerkDirectPageLayout>
    );
  }

  return (
    <ClerkDirectPageLayout>
      <ClerkDirectHead
        title={pageData.seo.title}
        description={pageData.seo.description}
        canonical={`https://clerkdirect.com/${pageData.slug}`}
      />
      <ClerkDirectSubPageHero
        label={pageData.hero.label}
        title={pageData.hero.title}
        description={pageData.hero.description}
        imageUrl={pageData.hero.imageUrl}
      />
      {pageData.features.length > 0 && (
        <ClerkDirectFeatureDetailSection features={pageData.features} />
      )}
      <ClerkDirectCtaSection />
    </ClerkDirectPageLayout>
  );
}
