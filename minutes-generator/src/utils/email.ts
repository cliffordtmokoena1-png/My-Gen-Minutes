import { getClerkKeys } from "./clerk";
import type { Site } from "./site";

export default async function getPrimaryEmail(userId: string, site?: Site): Promise<string | null> {
  const emailIdResponse = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${getClerkKeys(site).secretKey}`,
    },
  }).then((r) => r.json());

  const primaryEmailId = emailIdResponse.primary_email_address_id;
  if (!primaryEmailId) {
    console.error("Failed to retrieve primary email ID");
    return null;
  }

  const emailResponse = await fetch(`https://api.clerk.com/v1/email_addresses/${primaryEmailId}`, {
    headers: {
      Authorization: `Bearer ${getClerkKeys(site).secretKey}`,
    },
  }).then((r) => r.json());

  const email = emailResponse.email_address;

  if (!email) {
    console.error("Failed to retrieve email address");
    return null;
  }

  return email;
}
