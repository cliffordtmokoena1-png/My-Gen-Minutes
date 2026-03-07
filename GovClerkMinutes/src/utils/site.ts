export type Site = "GovClerk" | "GovClerkMinutes";

export const SITE_HEADER = "x-mg-site";

// These are your "Official" domains
const GOVCLERK_DOMAINS = ["govclerk.com", "www.govclerk.com"];

export function getSiteFromHost(host: string | null | undefined): Site {
  if (!host) return "GovClerkMinutes";

  const hostname = host.split(":")[0].toLowerCase();

  // 1. Check if it's the official production domain
  if (GOVCLERK_DOMAINS.includes(hostname)) {
    return "GovClerk";
  }

  // 2. Check if it's a Vercel preview or local testing for GovClerk
  // This makes sure 'govclerk.localhost' or 'govclerk-preview.vercel.app' work
  if (hostname.includes("govclerk") && !hostname.includes("minutes")) {
    return "GovClerk";
  }

  // Default to your GovClerkMinutes project
  return "GovClerkMinutes";
}

export function getSiteFromWindow(): Site {
  if (typeof window === "undefined") return "GovClerkMinutes";
  return getSiteFromHost(window.location.host);
}

export function isGovClerk(site: Site): boolean {
  return site === "GovClerk";
}

export function isGovClerkMinutes(site: Site): boolean {
  return site === "GovClerkMinutes";
}

// These helpers look for the "Stamp" we put on the request in Middleware
export function getSiteFromHeaders(headers: Headers): Site {
  const value = headers.get(SITE_HEADER);
  return value === "GovClerk" ? "GovClerk" : "GovClerkMinutes";
}