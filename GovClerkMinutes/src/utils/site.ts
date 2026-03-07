export type Site = "GovClerk" | "GovClerkMinutes";

export const SITE_HEADER = "x-mg-site";

const GovClerk_HOSTS = ["GovClerk.com", "www.GovClerk.com", "GovClerk.localhost"];
const GovClerk_PORTS = ["3223"];

export function getSiteFromHost(host: string | null | undefined): Site {
  if (!host) {
    return "GovClerkMinutes";
  }

  const hostname = host.split(":")[0].toLowerCase();
  const port = host.split(":")[1];

  if (GovClerk_HOSTS.includes(hostname)) {
    return "GovClerk";
  }

  if (port && GovClerk_PORTS.includes(port)) {
    return "GovClerk";
  }

  return "GovClerkMinutes";
}

export function getSiteFromWindow(): Site {
  if (typeof window === "undefined") {
    return "GovClerkMinutes";
  }

  return getSiteFromHost(window.location.host);
}

export function isGovClerk(site: Site): boolean {
  return site === "GovClerk";
}

export function isGovClerkMinutes(site: Site): boolean {
  return site === "GovClerkMinutes";
}

export function getSiteFromRequest(headers: Record<string, string | string[] | undefined>): Site {
  const value = headers[SITE_HEADER];
  if (value === "GovClerk") {
    return "GovClerk";
  }
  return "GovClerkMinutes";
}

export function getSiteFromHeaders(headers: Headers): Site {
  const value = headers.get(SITE_HEADER);
  if (value === "GovClerk") {
    return "GovClerk";
  }
  return "GovClerkMinutes";
}
