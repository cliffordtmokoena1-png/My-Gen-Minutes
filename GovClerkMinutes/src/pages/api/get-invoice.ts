import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import withErrorReporting from "@/error/withErrorReporting";
import { getStripe } from "@/utils/stripe";
import { assertString } from "@/utils/assert";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req);
  if (userId == null) {
    res.status(401).json({});
    return;
  }

  const body = req.body;
  const invoiceId = assertString(body.invoiceId);

  const stripe = getStripe();
  const invoice = await stripe.invoices.retrieve(invoiceId);

  const pdfUrl = invoice.invoice_pdf;
  if (!pdfUrl) {
    return res.status(404).json({ error: "Invoice PDF not found" });
  }

  const response = await fetch(pdfUrl);
  if (!response.ok) {
    return res.status(500).end();
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${invoice.number}.pdf"`);

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return res.status(200).send(buffer);
}

export default withErrorReporting(handler);
