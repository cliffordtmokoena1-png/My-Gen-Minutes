import { getClerkKeys } from "./utils/clerk";
import { isProd } from "./utils/dev";
import { withMiddlewareErrorHandling } from "./error/withErrorReporting";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import type { ClerkMiddlewareAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  handleLandingPagePersonalization,
  isLandingPageRequest,
} from "./utils/landing/landingPageMiddleware";
import {
  getSiteFromHost,
  isClerkDirect,
  isGovClerkMinutes,
  Site,
  SITE_HEADER,
} from "./utils/site";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/profile(.*)",
  "/checkout(.*)",
  "/recordings(.*)",
  "/templates(.*)",
]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isOrgRoute = createRouteMatcher(["/a/(.*)", "/org/signup(.*)"]);

const ORG_ROUTE_PREFIXES = [
  "/dashboard",
  "/meetings",
  "/boards",
  "/broadcast",
  "/portal",
  "/organization",
  "/account",
];

const CD_LANDING_PREFIXES = [
  "/product",
  "/solutions",
  "/blog",
  "/docs",
  "/help",
  "/case-studies",
  "/about",
  "/contact",
  "/careers",
  "/partners",
  "/acceptable-use",
  "/overview",
];

function getOrgRewritePath(pathname: string): string | null {
  for (const prefix of ORG_ROUTE_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      return `/a${pathname}`;
    }
  }
  return null;
}

function getCdLandingRewritePath(pathname: string): string | null {
  for (const prefix of CD_LANDING_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      return `/cd${pathname}`;
    }
  }
  return null;
}

function withSiteHeader(req: NextRequest, site: string, response?: NextResponse): NextResponse {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set(SITE_HEADER, site);

  if (response) {
    response.headers.set(SITE_HEADER, site);
    return response;
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

function buildClerkHandler(site: Site) {
  return async (auth: ClerkMiddlewareAuth, req: NextRequest) => {
    const { pathname } = req.nextUrl;

    if (isGovClerkMinutes(site) && isOrgRoute(req)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (isClerkDirect(site)) {
      if (pathname === "/") {
        const { userId } = await auth();

        if (!userId) {
          return withSiteHeader(req, site, NextResponse.rewrite(new URL("/cd", req.url)));
        }

        return withSiteHeader(req, site, NextResponse.rewrite(new URL("/a/dashboard", req.url)));
      }

      const orgRewritePath = getOrgRewritePath(pathname);
      if (orgRewritePath) {
        return withSiteHeader(req, site, NextResponse.rewrite(new URL(orgRewritePath, req.url)));
      }

      const cdLandingPath = getCdLandingRewritePath(pathname);
      if (cdLandingPath) {
        return withSiteHeader(req, site, NextResponse.rewrite(new URL(cdLandingPath, req.url)));
      }
    }

    if (isLandingPageRequest(req)) {
      return withSiteHeader(req, site, handleLandingPagePersonalization(req));
    }

    if (isAdminRoute(req)) {
      const { sessionClaims } = await auth();

      if (sessionClaims?.role !== "admin") {
        return NextResponse.redirect(new URL("/sign-in", req.url));
      }

      return withSiteHeader(req, site);
    }

    if (isProtectedRoute(req)) {
      await auth.protect();
    }

    return withSiteHeader(req, site);
  };
}

function buildClerkMiddleware(site: Site) {
  const keys = getClerkKeys(site);
  return clerkMiddleware(buildClerkHandler(site), {
    debug: isProd(),
    clockSkewInMs: 10 * 60 * 1000,
    publishableKey: keys.publishableKey,
    secretKey: keys.secretKey,
  });
}

const mgMiddleware = buildClerkMiddleware("GovClerkMinutes");
const cdMiddleware = buildClerkMiddleware("clerkdirect");

const middleware = (req: NextRequest, event: Parameters<typeof mgMiddleware>[1]) => {
  const site = getSiteFromHost(req.headers.get("host"));
  if (isClerkDirect(site)) {
    return cdMiddleware(req, event);
  }
  return mgMiddleware(req, event);
};

export default withMiddlewareErrorHandling(middleware);

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
