import React, { useState, useEffect, useCallback } from "react";
import Script from "next/script";
import { createContext } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { useAuth } from "@clerk/nextjs";
import { ApiGetCustomerDetailsResponse } from "@/pages/api/get-customer-details";

export interface IntercomContextValues {
  isChatOpen: boolean;
  boot: (settings?: Record<string, any>) => void;
  shutdown: () => void;
  update: (settings?: Record<string, any>) => void;
  show: () => void;
  hide: () => void;
  showNewMessage: (content?: string) => void;
  hideDefaultLauncher: (hide?: boolean) => void;
}

export const IntercomContext = createContext<IntercomContextValues>({
  isChatOpen: false,
  boot: () => {},
  shutdown: () => {},
  update: () => {},
  show: () => {},
  hide: () => {},
  showNewMessage: () => {},
  hideDefaultLauncher: () => {},
});

const MOBILE_BREAKPOINT = 768;
const INTERCOM_MAX_RETRIES = 10;
const INTERCOM_RETRY_DELAY_MS = 300;

function retryUntilIntercomLoaded(callback: () => void, retries = INTERCOM_MAX_RETRIES) {
  if (window.Intercom) {
    callback();
    return;
  }
  if (retries > 0) {
    setTimeout(() => retryUntilIntercomLoaded(callback, retries - 1), INTERCOM_RETRY_DELAY_MS);
  }
}

export function IntercomProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { userId, getToken } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { data: userData } = useSWR<{ email?: string }>(
    userId == null ? null : ["/api/get-email", userId],
    async (_) => {
      await getToken();
      return await fetch("/api/get-email").then((res) => res.json());
    }
  );

  const { data: intercomIdentity } = useSWR<{ user_hash: string; name: string | null }>(
    userId == null ? null : ["/api/intercom-identity", userId],
    async (_) => {
      await getToken();
      return await fetch("/api/intercom-identity").then((res) => res.json());
    }
  );

  const { data: customerDetails } = useSWR<ApiGetCustomerDetailsResponse>(
    "/api/get-customer-details",
    async (uri: string) => {
      await getToken();
      const response = await fetch(uri, {
        method: "POST",
      });
      const data = await response.json();
      return data;
    },
    {
      revalidateOnMount: true,
      refreshWhenHidden: true,
    }
  );

  useEffect(() => {
    if (typeof window !== "undefined" && window.Intercom && customerDetails) {
      window.Intercom("update", {
        plan: customerDetails.planName || "Free",
        name: intercomIdentity?.name ?? undefined,
        user_hash: intercomIdentity?.user_hash ?? undefined,
        hide_default_launcher: isMobile,
      });
    }
  }, [customerDetails, intercomIdentity, isMobile]);

  useEffect(() => {
    const loadIntercomScript = () => {
      // @ts-ignore
      if (typeof window === "undefined" || window.Intercom) {
        return;
      }

      const script = document.createElement("script");
      script.src = "https://widget.intercom.io/widget/efoxc8ye";
      script.async = true;

      script.onload = () => {
        window.Intercom("boot", {
          app_id: "efoxc8ye",
          api_base: "https://api-iam.intercom.io",
          user_id: userId ?? undefined,
          email: userData?.email,
          name: intercomIdentity?.name ?? undefined,
          user_hash: intercomIdentity?.user_hash ?? undefined,
          plan: customerDetails?.planName || "Free",
          hide_default_launcher: isMobile,
        });
        window.Intercom("onShow", () => setIsChatOpen(true));
        window.Intercom("onHide", () => {
          setIsChatOpen(false);
          if (window.innerWidth < MOBILE_BREAKPOINT) {
            window.Intercom("update", { hide_default_launcher: true });
          }
        });
      };

      script.onerror = () => {
        console.error("Failed to load Intercom script");
      };

      document.body.appendChild(script);
    };

    loadIntercomScript();
  }, [userId, userData?.email, intercomIdentity, customerDetails, isMobile]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.Intercom) {
      return;
    }
    window.Intercom("onShow", () => setIsChatOpen(true));
    window.Intercom("onHide", () => {
      setIsChatOpen(false);
      if (window.innerWidth < MOBILE_BREAKPOINT) {
        window.Intercom("update", { hide_default_launcher: true });
      }
    });
  }, []);

  const boot = useCallback((settings?: Record<string, any>) => {
    if (!window.Intercom) {
      return;
    }
    window.Intercom("boot", settings || {});
  }, []);

  const shutdown = useCallback(() => {
    if (!window.Intercom) {
      return;
    }
    window.Intercom("shutdown");
  }, []);

  const update = useCallback((settings?: Record<string, any>) => {
    if (!window.Intercom) {
      return;
    }
    window.Intercom("update", settings || {});
  }, []);

  const show = useCallback(() => {
    retryUntilIntercomLoaded(() => {
      // Temporarily unhide the launcher so show() works on mobile
      window.Intercom("update", { hide_default_launcher: false });
      window.Intercom("show");
    });
  }, []);

  const hide = useCallback(() => {
    if (!window.Intercom) {
      return;
    }
    window.Intercom("hide");
  }, []);

  const showNewMessage = useCallback((content?: string) => {
    retryUntilIntercomLoaded(() => {
      // Temporarily unhide the launcher so showNewMessage() works on mobile
      window.Intercom("update", { hide_default_launcher: false });
      if (content) {
        window.Intercom("showNewMessage", content);
      } else {
        window.Intercom("showNewMessage");
      }
    });
  }, []);

  const hideDefaultLauncher = useCallback((hide?: boolean) => {
    if (!window.Intercom) {
      return;
    }
    window.Intercom("update", { hide_default_launcher: hide });
  }, []);

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (!window.Intercom) {
        return;
      }

      window.Intercom("update", {
        user_id: userId ?? undefined,
        email: userData?.email,
        name: intercomIdentity?.name ?? undefined,
        user_hash: intercomIdentity?.user_hash ?? undefined,
        plan: customerDetails?.planName || "Free",
        path: url,
        hide_default_launcher: isMobile,
      });
    };

    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events, userData?.email, userId, intercomIdentity, customerDetails?.planName, isMobile]);

  return (
    <IntercomContext.Provider
      value={{
        isChatOpen,
        boot,
        shutdown,
        update,
        show,
        hide,
        showNewMessage,
        hideDefaultLauncher,
      }}
    >
      {children}
    </IntercomContext.Provider>
  );
}
