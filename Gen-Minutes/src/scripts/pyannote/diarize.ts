import * as fs from "fs";
import * as path from "path";
import axios from "axios";

import { PostHog } from "posthog-node";
import { connect, Connection } from "@planetscale/database";
import chalk from "chalk";
import { S3Client, HeadObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { HeadObjectCommandOutput } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const log = {
  step: (message: string) => console.log(`${chalk.cyan.bold(message)}`),
  info: (message: string) => console.log(`${message}`),
  success: (message: string) => console.log(`${chalk.green("✓")} ${message}`),
  warn: (message: string) => console.log(`${chalk.yellow("⚠")} ${message}`),
  error: (message: string) => console.error(`${chalk.red("✗")} ${message}`),
  result: (message: string) => console.log(`${message}`),
  data: (key: string, value: any) => console.log(`${key}=${value}`),
};

interface DiarizationSegment {
  speaker: string;
  start: number;
  end: number;
}

interface PyannoteJobResponse {
  jobId: string;
  status: "pending" | "running" | "succeeded" | "failed" | "canceled";
  output?: {
    diarization: DiarizationSegment[];
  };
}

interface ProcessedSegment {
  speaker: string;
  start: string;
  stop: string;
}

interface DiarizationOutput {
  segments: ProcessedSegment[];
  speakers: {
    count: number;
    labels: string[];
    embeddings: Record<string, number[]>;
  };
}

interface DiarizationMetrics {
  startTime: number;
  endTime: number;
  durationMs: number;
  segmentCount: number;
  speakerCount: number;
  transcriptId: string;
}

const PYANNOTE_API_KEY = process.env.PYANNOTE_API_KEY;
const POSTHOG_API_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const BASE_OUTPUT_DIR = path.resolve(__dirname, "../../pyannote-results");

if (!fs.existsSync(BASE_OUTPUT_DIR)) {
  fs.mkdirSync(BASE_OUTPUT_DIR, { recursive: true });
}

let posthogClient: PostHog | null = null;
if (POSTHOG_API_KEY) {
  posthogClient = new PostHog(POSTHOG_API_KEY, {
    host: POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
  });
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Please provide a transcript ID");
  process.exit(1);
}

const transcriptId = args[0];

interface S3Details {
  key: string;
  bucket: string;
  region: string;
}

function getUploadKey(transcriptId: number): string {
  const testPrefix = "";
  return `${testPrefix}uploads/upload_${transcriptId}`;
}

function configureS3Client(region: string): S3Client {
  console.log(`Configuring S3 client with region: ${region}`);
  return new S3Client({
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
    maxAttempts: 3,
  });
}

function createDbConnection(): Connection {
  return connect({
    host: process.env.PLANETSCALE_DB_HOST || "",
    username: process.env.PLANETSCALE_DB_USERNAME || "",
    password: process.env.PLANETSCALE_DB_PASSWORD || "",
  });
}

async function getOriginalDiarization(transcriptId: number): Promise<DiarizationOutput> {
  const conn = createDbConnection();

  try {
    const result = await conn.execute(
      "SELECT start, stop, speaker, transcript, segment_index FROM mg_segments WHERE transcript_id = ? ORDER BY CAST(start AS TIME);",
      [transcriptId]
    );

    if (!result.rows || result.rows.length === 0) {
      throw new Error(`No segments found for transcript ID ${transcriptId}`);
    }

    const segments: ProcessedSegment[] = [];
    const speakerSet = new Set<string>();

    for (const row of result.rows) {
      const speaker = row.speaker as string;
      const start = row.start as string;
      const stop = row.stop as string;

      speakerSet.add(speaker);

      segments.push({
        speaker,
        start,
        stop,
      });
    }

    const speakerLabels = Array.from(speakerSet);
    const embeddings: Record<string, number[]> = {};

    speakerLabels.forEach((speaker) => {
      embeddings[speaker] = Array(10).fill(0);
    });

    return {
      segments,
      speakers: {
        count: speakerLabels.length,
        labels: speakerLabels,
        embeddings,
      },
    };
  } catch (error: any) {
    log.error(`Failed to retrieve original diarization: ${error.message}`);
    throw error;
  }
}

function saveOriginalDiarization(results: DiarizationOutput, outputDir: string): string {
  const outputPath = path.join(outputDir, "original_diarization.json");
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  return outputPath;
}

async function getS3DetailsFromDatabase(): Promise<S3Details> {
  const maxRetries = 3;
  let retryCount = 0;
  let lastError;

  while (retryCount < maxRetries) {
    try {
      if (retryCount > 0) {
        log.warn(`Retry ${retryCount}/${maxRetries}`);
      }

      const conn = createDbConnection();
      const result = await conn.execute(
        "SELECT s3AudioKey, aws_region FROM transcripts WHERE id = ?",
        [transcriptId]
      );

      if (!result.rows || result.rows.length === 0) {
        throw new Error(`No transcript found with ID ${transcriptId}`);
      }

      const row = result.rows[0];
      const awsRegion = row.aws_region || "us-east-2";

      let s3AudioKey = row.s3AudioKey;
      if (!s3AudioKey) {
        s3AudioKey = getUploadKey(parseInt(transcriptId, 10));
      }

      if (!s3AudioKey) {
        throw new Error(`No S3 audio key found. Available columns: ${Object.keys(row).join(", ")}`);
      }

      let bucket: string;
      if (awsRegion === "us-east-2") {
        bucket = "transcriptsummaryaudioupload";
      } else if (awsRegion === "eu-central-1") {
        bucket = "GovClerkMinutesfrankfurt";
      } else {
        bucket = "transcriptsummaryaudioupload";
      }

      return {
        key: s3AudioKey,
        bucket: bucket,
        region: awsRegion,
      };
    } catch (error: any) {
      lastError = error;

      const isRetriableError =
        error.message?.includes("connect ETIMEDOUT") ||
        error.message?.includes("ECONNREFUSED") ||
        error.message?.includes("Connection lost");

      if (isRetriableError && retryCount < maxRetries - 1) {
        retryCount++;
        const waitTime = Math.pow(2, retryCount) * 1000;
        log.warn(`Database connection failed. Retrying in ${waitTime / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      } else {
        log.error(`Database error: ${error.message}`);
        throw error;
      }
    }
  }

  log.error(`Failed to connect to database after ${maxRetries} attempts`);
  throw lastError;
}

async function verifyS3ObjectExists(
  s3Details: S3Details
): Promise<{ exists: boolean; contentType?: string; size?: number }> {
  try {
    const s3 = new S3Client({
      region: s3Details.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });

    const command = new HeadObjectCommand({
      Bucket: s3Details.bucket,
      Key: s3Details.key,
    });

    try {
      const response = (await s3.send(command)) as HeadObjectCommandOutput;

      log.success(`Found S3 audio file (${formatBytes(response.ContentLength || 0)})`);

      return {
        exists: true,
        contentType: response.ContentType,
        size: response.ContentLength,
      };
    } catch (headError: any) {
      if (headError.name === "NotFound" || headError.$metadata?.httpStatusCode === 404) {
        log.error(`S3 object not found: ${s3Details.key}`);
        return { exists: false };
      } else {
        log.error(`S3 access error: ${headError.message}`);
        throw new Error(`Cannot access S3 object: ${headError.message}`);
      }
    }
  } catch (error: any) {
    log.error(`S3 client error: ${error.message}`);
    throw error;
  }
}

function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + " " + sizes[i];
}

async function generatePresignedUrl(s3Details: S3Details): Promise<string> {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error("AWS credentials not found in environment");
  }

  const s3 = new S3Client({
    region: s3Details.region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  const command = new GetObjectCommand({
    Bucket: s3Details.bucket,
    Key: s3Details.key,
  });

  try {
    return await getSignedUrl(s3 as any, command as any, { expiresIn: 3600 });
  } catch (error: any) {
    log.error(`Failed to generate presigned URL: ${error.message}`);
    throw new Error(`Could not generate presigned URL: ${error.message}`);
  }
}

async function callPyannoteApi(audioUrl: string): Promise<PyannoteJobResponse> {
  try {
    console.log("Calling PyAnnote API with audio URL...");

    if (!PYANNOTE_API_KEY) {
      console.error("PYANNOTE_API_KEY environment variable is not set");
      throw new Error("PyAnnote API key is missing. Check environment variables.");
    }

    try {
      console.log("Verifying audio URL accessibility first...");
      const verifyResponse = await axios.head(audioUrl, { timeout: 10000 });
      console.log("Audio URL verification:", {
        accessible: true,
        status: verifyResponse.status,
        contentType: verifyResponse.headers["content-type"],
        contentLength: verifyResponse.headers["content-length"],
      });

      const contentType = verifyResponse.headers["content-type"];
      if (contentType && !contentType.includes("audio") && contentType.includes("xml")) {
        console.warn("WARNING: The URL is returning XML content instead of audio!");
        console.warn(
          "This indicates an S3 error response, likely a permissions issue or invalid object key."
        );

        try {
          const xmlResponse = await axios.get(audioUrl, { timeout: 10000 });
          console.log("S3 Error XML:", xmlResponse.data);
        } catch (xmlError: any) {
          console.warn("Failed to fetch error XML:", xmlError.message);
        }
      }
    } catch (urlCheckError: any) {
      console.warn(
        `Audio URL check failed: ${urlCheckError.message}. Proceeding with API call anyway.`
      );
    }

    const payload = {
      url: audioUrl,
    };

    console.log("PyAnnote API payload:", JSON.stringify(payload, null, 2));

    const response = await axios.post<PyannoteJobResponse>(
      "https://api.pyannote.ai/v1/diarize",
      payload,
      {
        headers: {
          Authorization: `Bearer ${PYANNOTE_API_KEY}`,
          "Content-Type": "application/json",
          "User-Agent": "Minutes-Generator-Diarization/1.0",
        },

        timeout: 30000,
      }
    );

    if (response.headers["x-ratelimit-remaining"]) {
      console.log(
        `Rate limit remaining: ${response.headers["x-ratelimit-remaining"]}/${response.headers["x-ratelimit-limit"] || "100"}`
      );
    }

    if (response.status !== 200) {
      throw new Error(
        `API request failed with status ${response.status}: ${JSON.stringify(response.data)}`
      );
    }

    return response.data;
  } catch (error: any) {
    if (error.code === "ETIMEDOUT" || error.code === "ECONNABORTED") {
      log.error("API request timeout");
      throw new Error("PyAnnote API request timed out");
    }

    if (error.response) {
      const status = error.response.status;

      if (status === 429) {
        const retryAfter = error.response.headers["retry-after"] || 60;
        log.error(`Rate limit exceeded (retry after ${retryAfter}s)`);
        throw new Error(`Rate limit exceeded. Retry after ${retryAfter}s`);
      }

      if (status === 400) {
        log.error(`Bad request: ${JSON.stringify(error.response.data)}`);

        if (
          error.response?.data?.errors?.some(
            (err: any) => err.field === "url" && err.message.includes("file_not_audio")
          )
        ) {
          log.error(`The S3 URL is not recognized as an audio file`);
        }

        throw new Error(
          `API rejected request: ${JSON.stringify(error.response?.data?.errors || "Bad Request")}`
        );
      }

      log.error(`API error (${status}): ${JSON.stringify(error.response.data)}`);
      throw new Error(`API error ${status}: ${error.response?.data?.message || "Unknown error"}`);
    }

    log.error(`Unexpected error: ${error.message}`);
    throw error;
  }
}

async function pollJobStatus(jobId: string): Promise<PyannoteJobResponse> {
  log.step(`Polling job status ${chalk.bold(jobId)}`);

  let attempts = 0;
  const maxAttempts = 120;
  let backoffMs = 5000;
  const maxBackoffMs = 60000;

  while (attempts < maxAttempts) {
    try {
      log.info(`Poll attempt ${attempts + 1}/${maxAttempts} (${backoffMs / 1000}s interval)`);

      const response = await axios.get<PyannoteJobResponse>(
        `https://api.pyannote.ai/v1/jobs/${jobId}`,
        {
          headers: { Authorization: `Bearer ${PYANNOTE_API_KEY}` },
          timeout: 10000,
        }
      );

      if (response.headers["x-ratelimit-remaining"]) {
        const remaining = parseInt(response.headers["x-ratelimit-remaining"]);
        const limit = response.headers["x-ratelimit-limit"] || "100";

        if (remaining < 10) {
          log.warn(`Rate limit low: ${remaining}/${limit}`);
          backoffMs = Math.min(backoffMs * 2, maxBackoffMs);
        }
      }

      const status = response.data.status;
      log.info(`Job status: ${chalk.bold(status)}`);

      if (status === "succeeded") {
        log.success("Job completed successfully!");
        return response.data;
      }

      if (status === "failed" || status === "canceled") {
        log.error(`Job ${status}`);
        throw new Error(`Job ${status}: ${JSON.stringify(response.data)}`);
      }

      if (status === "pending") {
        backoffMs = Math.min(backoffMs * 1.5, maxBackoffMs);
      } else if (status === "running") {
        backoffMs = Math.min(backoffMs * 1.2, maxBackoffMs);
      }

      log.info(`Waiting ${backoffMs / 1000}s before next poll...`);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
      attempts++;
    } catch (error: any) {
      if (error.response?.status === 429) {
        const retryAfter = parseInt(error.response.headers["retry-after"] || "60");
        log.warn(`Rate limit exceeded. Waiting ${retryAfter}s...`);
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        continue;
      }

      if (error.code === "ETIMEDOUT" || error.code === "ECONNABORTED") {
        log.warn("Request timeout. Increasing backoff...");
        backoffMs = Math.min(backoffMs * 2, maxBackoffMs);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        continue;
      }

      if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
        log.warn("Connection issues. Waiting 15s...");
        await new Promise((resolve) => setTimeout(resolve, 15000));
        continue;
      }

      if (attempts < maxAttempts - 5) {
        log.error(`Poll error: ${error.message}`);
        backoffMs = Math.min(backoffMs * 2, maxBackoffMs);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        attempts++;
        continue;
      }

      throw error;
    }
  }

  throw new Error(`Job polling timed out after ${maxAttempts} attempts`);
}

function processDiarizationResults(results: PyannoteJobResponse): DiarizationOutput {
  try {
    const segments = results.output?.diarization || [];

    const uniqueSpeakers = new Set<string>();
    segments.forEach((segment) => {
      uniqueSpeakers.add(segment.speaker);
    });

    const speakerLabels = Array.from(uniqueSpeakers);
    const speakerCount = speakerLabels.length;

    const embeddings: Record<string, number[]> = {};
    speakerLabels.forEach((speaker) => {
      embeddings[speaker.replace("SPEAKER_", "")] = Array(10).fill(0);
    });

    const formattedSegments: ProcessedSegment[] = segments.map((segment) => ({
      speaker: segment.speaker.replace("SPEAKER_", ""),
      start: segment.start.toString(),
      stop: segment.end.toString(),
    }));

    const output: DiarizationOutput = {
      segments: formattedSegments,
      speakers: {
        count: speakerCount,
        labels: speakerLabels.map((label) => label.replace("SPEAKER_", "")),
        embeddings,
      },
    };

    return output;
  } catch (error) {
    console.error("Error processing diarization results:", error);
    throw error;
  }
}

function createOutputDir(transcriptId: string): string {
  const outputDir = path.join(BASE_OUTPUT_DIR, `${transcriptId}_pyannote`);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  return outputDir;
}

function saveRawResults(response: PyannoteJobResponse, outputDir: string): string {
  const outputPath = path.join(outputDir, "pyannote_raw.json");
  fs.writeFileSync(outputPath, JSON.stringify(response, null, 2));
  return outputPath;
}

function savePyannoteResults(results: DiarizationOutput, outputDir: string): string {
  const outputPath = path.join(outputDir, "pyannote_processed.json");
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  return outputPath;
}

async function trackDiarizationEvent(metrics: DiarizationMetrics): Promise<void> {
  if (!posthogClient) return;

  try {
    posthogClient.capture({
      distinctId: `transcript:${metrics.transcriptId}`,
      event: "pyannote_diarization_completed",
      properties: {
        transcript_id: metrics.transcriptId,
        duration_ms: metrics.durationMs,
        segment_count: metrics.segmentCount,
        speaker_count: metrics.speakerCount,
        source: "pyannote-diarize-script",
      },
    });

    await posthogClient.shutdown();
  } catch (error) {}
}

async function main(): Promise<void> {
  const startTime = Date.now();
  let s3Details: S3Details = { key: "", bucket: "", region: "" };

  try {
    log.step(`Diarizing transcript ${transcriptId} with PyAnnote for comparison`);

    const outputDir = createOutputDir(transcriptId);

    log.step("Fetching original diarization from mg_segments");
    let originalDiarizationResults: DiarizationOutput | null = null;
    try {
      originalDiarizationResults = await getOriginalDiarization(Number(transcriptId));
      const originalOutputPath = saveOriginalDiarization(originalDiarizationResults, outputDir);
      log.success(
        `Original diarization: ${originalDiarizationResults.segments.length} segments, ${originalDiarizationResults.speakers.count} speakers`
      );
      log.result(`Saved to ${originalOutputPath}`);
    } catch (error: any) {
      log.warn(`Could not fetch original diarization: ${error.message}`);
      log.info("Will continue with PyAnnote diarization only");
    }

    s3Details = await getS3DetailsFromDatabase();

    const objectCheck = await verifyS3ObjectExists(s3Details);
    if (!objectCheck.exists) {
      throw new Error(`S3 object not found at ${s3Details.bucket}/${s3Details.key}`);
    }

    if (objectCheck.contentType && !objectCheck.contentType.includes("audio")) {
      log.warn(`Non-audio content type: ${objectCheck.contentType}`);
    }

    const presignedUrl = await generatePresignedUrl(s3Details);

    log.step("Processing with PyAnnote diarization API");
    const apiResponse = await callPyannoteApi(presignedUrl);

    const jobId = apiResponse.jobId;
    const jobResults = await pollJobStatus(jobId);

    const rawOutputPath = saveRawResults(jobResults, outputDir);
    const processedResults = processDiarizationResults(jobResults);
    const pyannoteOutputPath = savePyannoteResults(processedResults, outputDir);

    log.success(
      `PyAnnote diarization complete: ${processedResults.segments.length} segments, ${processedResults.speakers.count} speakers`
    );

    if (originalDiarizationResults) {
      log.step("Comparing diarization results");

      const comparisonData = {
        original: {
          speakerCount: originalDiarizationResults.speakers.count,
          segmentCount: originalDiarizationResults.segments.length,
          speakers: originalDiarizationResults.speakers.labels,
        },
        pyannote: {
          speakerCount: processedResults.speakers.count,
          segmentCount: processedResults.segments.length,
          speakers: processedResults.speakers.labels,
        },
        differences: {
          speakerCountDiff:
            originalDiarizationResults.speakers.count - processedResults.speakers.count,
          segmentCountDiff:
            originalDiarizationResults.segments.length - processedResults.segments.length,
        },
      };

      const comparisonPath = path.join(outputDir, "diarization_comparison.json");
      fs.writeFileSync(comparisonPath, JSON.stringify(comparisonData, null, 2));

      log.success("Diarization comparison complete");
      log.result(`Comparison saved to ${comparisonPath}`);

      const speakerDiff = comparisonData.differences.speakerCountDiff;
      const segmentDiff = comparisonData.differences.segmentCountDiff;

      log.info(
        `Speaker count difference: ${speakerDiff > 0 ? "+" : ""}${speakerDiff} (original vs PyAnnote)`
      );
      log.info(
        `Segment count difference: ${segmentDiff > 0 ? "+" : ""}${segmentDiff} (original vs PyAnnote)`
      );
    }

    const endTime = Date.now();
    const durationSec = ((endTime - startTime) / 1000).toFixed(2);

    log.success(`Completed comparison in ${durationSec}s`);
    log.result(`All results saved to ${outputDir}`);

    await trackDiarizationEvent({
      startTime,
      endTime,
      durationMs: endTime - startTime,
      segmentCount: processedResults.segments.length,
      speakerCount: processedResults.speakers.count,
      transcriptId,
    });

    log.data("PYANNOTE_FILE", pyannoteOutputPath);
    log.data(
      "ORIGINAL_FILE",
      originalDiarizationResults
        ? path.join(outputDir, "original_diarization.json")
        : "not_available"
    );
    log.data("OUTPUT_DIR", outputDir);
  } catch (error) {
    if (posthogClient) {
      try {
        posthogClient.capture({
          distinctId: `transcript:${transcriptId}`,
          event: "diarization_error",
          properties: {
            transcript_id: transcriptId,
            s3_key: s3Details.key,
            s3_bucket: s3Details.bucket,
            s3_region: s3Details.region,
            error_message: error instanceof Error ? error.message : String(error),
            source: "pyannote-diarize-script",
          },
        });
        await posthogClient.shutdown();
      } catch (e) {
        log.error(`Error tracking event: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    log.error(`${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

main();
