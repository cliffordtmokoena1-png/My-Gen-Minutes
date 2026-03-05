import Head from "next/head";
import { faqData } from "./faqData";

type Props = {
  title?: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
};

export default function ClerkDirectHead({ title, description, canonical, noindex }: Props) {
  const defaultTitle = "ClerkDirect | AI-Powered Meeting Management for Government & Organizations";
  const defaultDescription =
    "Automate agendas, meeting minutes, transcription, and public records for government bodies, school boards, and organizations. AI-powered meeting management that saves hours on every meeting.";
  const resolvedTitle = title || defaultTitle;
  const resolvedDescription = description || defaultDescription;
  const resolvedCanonical = canonical || "https://clerkdirect.com/";
  const ogImageUrl = "https://picsum.photos/1200/630?random=cd-og";

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqData.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "ClerkDirect",
    applicationCategory: "BusinessApplication",
    description: resolvedDescription,
    url: "https://clerkdirect.com",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Contact us for pricing",
    },
    operatingSystem: "Web",
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ClerkDirect",
    url: "https://clerkdirect.com",
    logo: "https://clerkdirect.com/clerkdirect-icon.svg",
    description:
      "AI-powered meeting management platform for government bodies, school boards, and public organizations.",
    sameAs: ["https://linkedin.com/company/clerkdirect", "https://twitter.com/clerkdirect"],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      url: "https://clerkdirect.com/",
    },
  };

  return (
    <Head>
      <title>{resolvedTitle}</title>
      {noindex && <meta name="robots" content="noindex" />}
      <meta charSet="UTF-8" />

      <link rel="icon" href="/clerkdirect-icon.svg" type="image/svg+xml" />
      <link rel="manifest" href="/manifest.json" />
      <link rel="canonical" href={resolvedCanonical} />

      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="description" content={resolvedDescription} />
      <meta
        name="keywords"
        content="government meeting management software, AI meeting minutes, agenda management, board meeting software, municipal meeting minutes, public meeting portal, meeting transcription software, ClerkDirect, open meeting compliance"
      />
      <meta name="author" content="ClerkDirect" />

      <meta property="og:type" content="website" />
      <meta property="og:url" content={resolvedCanonical} />
      <meta property="og:title" content={resolvedTitle} />
      <meta property="og:description" content={resolvedDescription} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="ClerkDirect" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={resolvedCanonical} />
      <meta name="twitter:title" content={resolvedTitle} />
      <meta name="twitter:description" content={resolvedDescription} />
      <meta name="twitter:image" content={ogImageUrl} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareJsonLd),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd),
        }}
      />
    </Head>
  );
}
