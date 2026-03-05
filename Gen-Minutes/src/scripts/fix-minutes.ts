#!/usr/bin/env node

import * as fs from "fs/promises";
import * as path from "path";
import axios from "axios";

// Get the folder path from command line arguments
const folderPath = process.argv[2];

if (!folderPath) {
  console.error("Please provide a folder path as an argument");
  process.exit(1);
}

// Get the API key from environment variables
const apiKey = process.env.OPENROUTER_API_KEY;

if (!apiKey) {
  console.error("OPENROUTER_API_KEY environment variable is not set");
  process.exit(1);
}

console.log(`Processing folder: ${folderPath}`);

interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

async function processFolder(folderPath: string): Promise<void> {
  try {
    // Check if the path exists
    try {
      await fs.access(folderPath);
    } catch (e) {
      console.error(`The folder path does not exist: ${folderPath}`);
      console.error("Make sure to properly escape spaces in the path or use quotes.");
      process.exit(1);
    }

    // Log the absolute path we're processing
    const absolutePath = path.resolve(folderPath);
    console.log(`Absolute path: ${absolutePath}`);

    // Read all files in the folder
    const files = await fs.readdir(folderPath);
    console.log(`Found ${files.length} files in folder`);
    console.log(`Files in folder: ${files.join(", ")}`);

    // Find the .txt and .md files
    const txtFile = files.find((file) => file.endsWith(".txt"));
    const mdFile = files.find((file) => file.endsWith(".md") && !file.endsWith("-fixed.md"));

    if (!txtFile || !mdFile) {
      console.error("Could not find both .txt and .md files in the specified folder");
      console.error(`Text file found: ${txtFile ? "Yes" : "No"}`);
      console.error(`Markdown file found: ${mdFile ? "Yes" : "No"}`);
      process.exit(1);
    }

    // Read file contents
    const txtContent = await fs.readFile(path.join(folderPath, txtFile), "utf8");
    const mdContent = await fs.readFile(path.join(folderPath, mdFile), "utf8");

    console.log(`Processing transcript: ${txtFile}`);
    console.log(`Processing minutes: ${mdFile}`);

    // Call OpenRouter API
    const response = await callOpenRouterAPI(txtContent, mdContent);

    // Create output filename
    const outputFilename = mdFile.replace(".md", "-fixed.md");

    // Write the response to the output file
    await fs.writeFile(path.join(folderPath, outputFilename), response);

    console.log(`Successfully created: ${outputFilename}`);
  } catch (error) {
    console.error("Error processing folder:", (error as Error).message);
    if ((error as Error).stack) {
      console.error((error as Error).stack);
    }
    process.exit(1);
  }
}

async function callOpenRouterAPI(
  transcriptContent: string,
  minutesContent: string
): Promise<string> {
  try {
    const url = "https://openrouter.ai/api/v1/chat/completions";

    const prompt = `
I need you to update a meeting minutes document based on a transcript.

Transcript:
${transcriptContent}

Current Minutes:
${minutesContent}

Instructions:
1. Do NOT change the structure or formatting of the minutes document.
2. Remove any content from the minutes that is NOT mentioned in the transcript.
3. Replace actual names with corresponding speaker labels from the transcript (e.g., {{A}}, {{B}}, etc.).
4. Preserve ALL markdown formatting.
5. Return ONLY the updated minutes content without any additional explanation.
`;

    const response = await axios.post<OpenRouterResponse>(
      url,
      {
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://GovClerkMinutes.com",
          "X-Title": "GovClerkMinutes",
        },
      }
    );

    if (response.data && response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error("Invalid response from OpenRouter API");
    }
  } catch (error) {
    console.error(
      "Error calling OpenRouter API:",
      axios.isAxiosError(error) && error.response ? error.response.data : (error as Error).message
    );
    throw error;
  }
}

// Run the script
processFolder(folderPath);
