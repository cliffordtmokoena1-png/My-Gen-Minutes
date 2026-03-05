import { assertNumber, assertString } from "@/utils/assert";
import { connect } from "@planetscale/database";
import dotenv from "dotenv";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

dotenv.config({ path: ".env" });

async function refundTranscript(userId: string, transcriptId: number): Promise<void> {
  const conn = connect({
    host: process.env.PLANETSCALE_DB_HOST,
    username: process.env.PLANETSCALE_DB_USERNAME,
    password: process.env.PLANETSCALE_DB_PASSWORD,
  });

  const transcriptResult = await conn.execute(
    "SELECT credits_required FROM transcripts WHERE id = ? AND userId = ?;",
    [transcriptId, userId]
  );

  if (!transcriptResult.rows || transcriptResult.rows.length === 0) {
    console.error(`No transcript found with ID ${transcriptId} for user ${userId}`);
    return;
  }

  const creditsRequired = assertNumber(transcriptResult.rows[0].credits_required);

  if (!creditsRequired) {
    console.log(`No credits to refund for transcript ${transcriptId}`);
    return;
  }

  const paymentResult = await conn.execute(
    "INSERT INTO payments (user_id, credit, action, transcript_id) VALUES (?, ?, 'refund', ?);",
    [userId, creditsRequired, transcriptId]
  );

  console.log(
    `Refunded ${creditsRequired} credits to user ${userId} for transcript ${transcriptId}!`
  );
  console.log(`Payment ID: ${paymentResult.insertId}`);
}

yargs(hideBin(process.argv))
  .command(
    "$0 <user_id> <transcript_id>",
    "Refund credits for a transcript",
    (yargs) => {
      return yargs
        .positional("user_id", {
          describe: "The user ID to refund credits to",
          type: "string",
        })
        .positional("transcript_id", {
          describe: "The transcript ID to refund credits for",
          type: "number",
        });
    },
    async (argv) => {
      await refundTranscript(assertString(argv.user_id), assertNumber(argv.transcript_id));
    }
  )
  .help()
  .alias("help", "h")
  .strict()
  .parse();
