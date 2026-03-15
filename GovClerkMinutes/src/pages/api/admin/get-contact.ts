import { getAuth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import withErrorReporting from "@/error/withErrorReporting";
import { assertString } from "@/utils/assert";
import hubspot from "@/crm/hubspot";

export const config = {
  runtime: "edge",
};

async function handler(req: NextRequest) {
  const { userId: adminUserId, sessionClaims } = getAuth(req);
  if (!adminUserId || !sessionClaims?.metadata?.role || sessionClaims.metadata.role !== "admin") {
    return new Response(null, { status: 401 });
  }

  const body = await req.json();
  const whatsappId = assertString(body.whatsappId?.replace(/^\+/, ""));

  const contact = await hubspot.getContact({
    filter: {
      propertyName: "phone",
      value: `+${whatsappId}`,
    },
    returnedProperties: ["firstname", "email", "phone"],
  });

  if (contact == null) {
    return new Response(JSON.stringify({ error: "Contact not found" }), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  return new Response(
    JSON.stringify({ ...contact.properties, name: contact.properties.firstname }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

export default withErrorReporting(handler);
