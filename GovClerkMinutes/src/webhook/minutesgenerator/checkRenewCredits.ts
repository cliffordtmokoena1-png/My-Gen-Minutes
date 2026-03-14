import { assertString } from "@/utils/assert";
import { isPriceIdAnnual } from "@/utils/price";
import { getStripe } from "@/utils/stripe";
import { connect } from "@planetscale/database";
import Stripe from "stripe";

type CustomerIdToRenewalAmount = {
  [customerId: string]: number;
};

async function getAnnualPlanCustomerData(): Promise<CustomerIdToRenewalAmount> {
  const stripe = getStripe();

  const customerData: CustomerIdToRenewalAmount = {};
  let startingAfter: string | undefined;

  do {
    const page = await stripe.subscriptions.list({
      limit: 100,
      status: "active",
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    for (const sub of page.data) {
      for (const item of sub.items.data) {
        if (!isPriceIdAnnual(item.price.id)) {
          continue;
        }

        let product = item.price.product;
        if (typeof product === "string") {
          product = await stripe.products.retrieve(product);
        }

        const renewalAmount = parseInt((product as Stripe.Product).metadata["tokens"] || "0");
        if (renewalAmount === 0) {
          console.error(`Skipping subscription ${sub.id} with no renewal amount`);
          continue;
        }

        let customerId = sub.customer;
        if (typeof customerId !== "string") {
          customerId = customerId.id;
        }
        assertString(customerId);

        customerData[customerId] = renewalAmount;
      }
    }

    startingAfter = page.has_more ? page.data[page.data.length - 1].id : undefined;
  } while (startingAfter);

  return customerData;
}

export async function checkRenewToken(): Promise<void> {
  const customerData = await getAnnualPlanCustomerData();

  const conn = connect({
    host: process.env.PLANETSCALE_DB_HOST,
    username: process.env.PLANETSCALE_DB_USERNAME,
    password: process.env.PLANETSCALE_DB_PASSWORD,
  });

  const ids = Object.keys(customerData);
  const placeholders = ids.map(() => "?").join(",");

  if (ids.length === 0) {
    console.warn("No annual plan customers found");
    return;
  }

  ids.sort();

  await conn.transaction(async (tx) => {
    // Lock the customer rows we’re about to work with.
    // Any concurrent run will block here until we commit, preventing two writers
    // from deciding the same customers are "due" at the same time.
    await tx.execute(
      `
      SELECT mc.user_id, mc.stripe_customer_id
      FROM gc_customers mc
      WHERE mc.stripe_customer_id IN (${placeholders})
      ORDER BY mc.stripe_customer_id
      FOR UPDATE
      `,
      ids
    );

    // Find users who need a top-up
    const due = await tx
      .execute(
        `
          SELECT mc.user_id, mc.stripe_customer_id, MAX(p.created_at) AS last_payment_date
          FROM gc_customers mc
          LEFT JOIN payments p
          ON p.user_id = mc.user_id
          AND p.action = 'add'
          AND p.mode = 'subscription'
          WHERE mc.stripe_customer_id IN (${placeholders})
          GROUP BY mc.user_id, mc.stripe_customer_id
          HAVING MAX(p.created_at) IS NULL
          OR MAX(p.created_at) <= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 MONTH)
          `,
        [...ids]
      )
      .then((r) => r.rows);

    if (due.length === 0) {
      return;
    }

    // eslint-disable-next-line no-console
    console.log(`Found ${due.length} ${ids} customers due for a top-up`);

    // Bulk insert for customers due for a top up
    const valueRows: string[] = [];
    const params: any[] = [];

    for (const row of due) {
      const token = customerData[row.stripe_customer_id];

      if (token == null) {
        console.warn(`No renewal amount for customer ${row.stripe_customer_id}`);
        continue;
      }

      const lastCreated = row.last_payment_date;

      valueRows.push(
        `(?, ?, 'add', 'subscription', ${lastCreated ? "DATE_ADD(?, INTERVAL 1 MONTH)" : "NOW()"})`
      );
      params.push(row.user_id, token);
      if (lastCreated) {
        params.push(lastCreated);
      }
    }

    await tx.execute(
      `
      INSERT INTO payments (user_id, credit, action, mode, created_at)
      VALUES ${valueRows.join(",")}
      `,
      [...params]
    );
  });
}
