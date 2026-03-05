import "@/styles/globals.css";
import type { AppContext, AppProps } from "next/app";
import App from "next/app";
import { ChakraProvider } from "@chakra-ui/react";
import theme from "@/theme";

import "@fontsource-variable/plus-jakarta-sans";

import "react-h5-audio-player/lib/styles.css";
import { UploadUriProvider } from "@/components/UploadUriProvider";
import { RecordingStateProvider } from "@/contexts/RecordingStateContext";
import { AnnouncementProvider } from "@/contexts/AnnouncementContext";
import Script from "next/script";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import Cookies from "js-cookie";
import { getClerkKeys } from "@/utils/clerk";
import { getSiteFromWindow } from "@/utils/site";
import type { Site } from "@/utils/site";
import { SITE_HEADER } from "@/utils/site";
import { NavigationPerfAnalyticsProvider } from "@/components/NavigationPerfAnalyticsProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { IntercomProvider } from "@/components/IntercomProvider";
import CustomPosthogProvider from "@/components/CustomPosthogProvider";
import { WebSocketProvider } from "@/admin/hooks/useWebSocket";
import { SWRConfig } from "swr";
import { OrgContextProvider } from "@/contexts/OrgContext";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans-inter",
});

type MyAppProps = AppProps & {
  site: Site;
};

function MyApp({ Component, pageProps, site: ssrSite }: MyAppProps) {
  const router = useRouter();
  const discount = router.query.discount;
  // Use SSR-provided site so ClerkProvider initializes with the correct key
  // on the very first render, before any useEffect can fire.
  const [site] = useState<Site>(() => ssrSite ?? getSiteFromWindow());

  useEffect(() => {
    if (discount === "valuedcustomer") {
      Cookies.set("mgdiscount", "true", { expires: 30 });
    }

    // Manually set the _fbc cookie to track Facebook ad conversions
    // Despite this check, the fb pixel sometimes tries to do the same thing asynchronously, and so we may end up with two _fbc cookies.
    // On the server we should choose the last cookie set, which should be fine.  And we are doing this to make sure we get an _fbc cookie.
    const fbclid = router.query.fbclid;
    if (fbclid && Cookies.get("_fbc") === undefined) {
      const timestamp = Date.now();
      const fbcValue = `fb.1.${timestamp}.${fbclid}`;
      Cookies.set("_fbc", fbcValue, { expires: 90 }); // Expires in 90 days
    }

    const sendMetaConversionsViewContent = (): Promise<string> => {
      return fetch("/api/meta-conversions-api-view-content")
        .then((res) => res.json())
        .then((data) => {
          return data?.fbc;
        });
    };

    sendMetaConversionsViewContent().then((fbc) => {
      // If the user switches browsers, we want to preserve their fbc cookie.
      // This happens e.g. when switching between the FB in-app browser, and the
      // user's system browser, which is a very common occurence.
      if (fbc && Cookies.get("_fbc") === undefined) {
        Cookies.set("_fbc", fbc, { expires: 90 }); // Expires in 90 days
      }
    });

    const handleRouteChange = (url: string) => {
      sendMetaConversionsViewContent().then((fbc) => {
        if (fbc && Cookies.get("_fbc") === undefined) {
          Cookies.set("_fbc", fbc, { expires: 90 }); // Expires in 90 days
        }
      });
    };
    router.events.on("routeChangeComplete", handleRouteChange);

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [discount, router.events, router.query.fbclid]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // Force update by adding version parameter
      navigator.serviceWorker
        .register("/service-worker.js?v=2", { scope: "/" })
        .then((registration) => {
          // Force immediate update check
          registration.update();
        })
        .catch((err) => console.error("Service Worker registration failed: ", err));
    }
  }, []);

  return (
    <div className={inter.variable}>
      <ClerkProvider key={site} {...pageProps} publishableKey={getClerkKeys(site).publishableKey}>
        <OrgContextProvider>
          <IntercomProvider>
            <CustomPosthogProvider>
              <SWRConfig
                value={{
                  dedupingInterval: 2000,
                  revalidateOnFocus: false,
                  revalidateOnReconnect: false,
                  shouldRetryOnError: false,
                }}
              >
                <ChakraProvider theme={theme}>
                  <NavigationPerfAnalyticsProvider>
                    <AnnouncementProvider>
                      <UploadUriProvider>
                        <RecordingStateProvider>
                          <WebSocketProvider debug>
                            <Component {...pageProps} />
                          </WebSocketProvider>
                        </RecordingStateProvider>
                        <Script id="fb-pixel" strategy="afterInteractive">
                          {`!function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${process.env.NEXT_PUBLIC_FB_PIXEL_ID}');
                fbq('track', 'PageView');
                `}
                        </Script>
                      </UploadUriProvider>
                    </AnnouncementProvider>
                  </NavigationPerfAnalyticsProvider>
                </ChakraProvider>
              </SWRConfig>
            </CustomPosthogProvider>
          </IntercomProvider>
        </OrgContextProvider>
      </ClerkProvider>
    </div>
  );
}

MyApp.getInitialProps = async (appContext: AppContext) => {
  const appProps = await App.getInitialProps(appContext);
  const req = appContext.ctx.req;

  // During SSR, read the site from the x-mg-site header set by middleware.
  // On client-side navigations req is undefined, so fall back to window detection.
  let site: Site = "minutesgenerator";
  if (req) {
    const headerValue = req.headers[SITE_HEADER];
    if (headerValue === "clerkdirect") {
      site = "clerkdirect";
    }
  }

  return { ...appProps, site };
};

export default MyApp;
