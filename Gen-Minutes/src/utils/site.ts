export type Site = "clerkdirect" | "GovClerkMinutes";

export const SITE_HEADER = "x-mg-site";

const CLERKDIRECT_HOSTS = ["clerkdirect.com", "www.clerkdirect.com", "clerkdirect.localhost"];
const CLERKDIRECT_PORTS = ["3223"];

export function getSiteFromHost(host: string | null | undefined): Site {
  if (!host) {
    return "GovClerkMinutes";
  }

  const hostname = host.split(":")[0].toLowerCase();
  const port = host.split(":")[1];

  if (CLERKDIRECT_HOSTS.includes(hostname)) {
    return "clerkdirect";
  }

  if (port && CLERKDIRECT_PORTS.includes(port)) {
    return "clerkdirect";
  }

  return "GovClerkMinutes";
}

export function getSiteFromWindow(): Site {
  if (typeof window === "undefined") {
    return "GovClerkMinutes";
  }

  return getSiteFromHost(window.location.host);
}

export function isClerkDirect(site: Site): boolean {
  return site === "clerkdirect";
}

export function isGovClerkMinutes(site: Site): boolean {
  return site === "GovClerkMinutes";
}

export function getSiteFromRequest(headers: Record<string, string | string[] | undefined>): Site {
  const value = headers[SITE_HEADER];
  if (value === "clerkdirect") {
    return "clerkdirect";
  }
  return "GovClerkMinutes";
}

export function getSiteFromHeaders(headers: Headers): Site {
  const value = headers.get(SITE_HEADER);
  if (value === "clerkdirect") {
    return "clerkdirect";
  }
  return "GovClerkMinutes";
}
