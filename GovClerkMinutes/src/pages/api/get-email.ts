import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import getPrimaryEmail from "@/utils/email";
import withErrorReporting from "@/error/withErrorReporting";
import { getSiteFromRequest } from "@/utils/site";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req);
  if (userId == null) {
    res.status(401).json({});
    return;
  }

  const site = getSiteFromRequest(req.headers);
  const email = await getPrimaryEmail(userId, site);

  if (email == null) {
    return res.status(400).json({ error: "Bad request" });
  }

  return res.status(200).json({ email });
}

export default withErrorReporting(handler);
