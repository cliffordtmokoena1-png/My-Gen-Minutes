import { sha256 } from "js-sha256";
import { v4 as uuidv4 } from "uuid";
import { capture } from "@/utils/posthog";
import { isDev } from "@/utils/dev";
import { updateMetaConversionData } from "./utils";

export type FbConversionUserData = {
  eventName:
    | "ViewContent"
    | "SubmitApplication"
    | "CompleteRegistration"
    | "InitiateCheckout"
    | "Purchase";
  userId?: string;
  email?: string;
  fbc?: string;
  fbp?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  firstName?: string;
  lastName?: string;
  eventSourceUrl?: string;
  ph?: string;
  st?: string;
  zp?: string;
  country?: string;
  ct?: string;
};

export type FbConversionEventCustomData = {
  currency?: string;
  value?: number;
};

export const META_CONVERSIONS_DATASET = 1419987195621259;

export function hash(s: string | null | undefined): string | undefined {
  if (s == null) {
    return undefined;
  }
  return sha256(s.toLowerCase().trim().replace(/\s/g, ""));
}
export async function sendConversionEvent(
  userData: FbConversionUserData,
  customData: FbConversionEventCustomData
) {
  const {
    eventName,
    userId,
    email,
    fbc,
    fbp,
    clientIpAddress,
    clientUserAgent,
    firstName,
    lastName,
    eventSourceUrl,
    ph,
    st,
    zp,
    country,
    ct,
  } = userData;

  if (!isDev()) {
    await fetch(
      `https://graph.facebook.com/v19.0/${META_CONVERSIONS_DATASET}/events?access_token=${process.env.META_CONVERSIONS_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: [
            {
              event_name: eventName,
              event_time: Math.floor(Date.now() / 1000),
              event_id: uuidv4(),
              action_source: "website",
              event_source_url: eventSourceUrl,
              user_data: {
                client_ip_address: clientIpAddress,
                client_user_agent: clientUserAgent,
                external_id: userId,
                em: hash(email),
                fn: hash(firstName),
                ln: hash(lastName),
                fbc,
                fbp,
                ph: hash(ph),
                st: hash(st),
                zp: hash(zp),
                country: hash(country),
                ct: hash(ct),
              },
              custom_data: customData,
            },
          ],
        }),
      }
    );
  }

  if (eventName === "CompleteRegistration" && userId != null) {
    // Use this to avoid duplicate events.
    await updateMetaConversionData({
      userId,
      sentCompleteRegistration: 1,
    });
  }

  if (userId != null) {
    await capture(
      "conversions_api_called",
      {
        ...userData,
        ...customData,
      },
      userId
    );
  }
}
