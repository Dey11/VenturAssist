import { google } from "@ai-sdk/google";

const DEFAULT_GEMINI_MODEL = "gemini-3.7-flash";
const DEFAULT_GEMINI_SEARCH_MODEL = "gemini-2.5-flash";

function getConfiguredModel(environmentVariable: string, fallback: string) {
  return process.env[environmentVariable]?.trim() || fallback;
}

/** Primary model for extraction, structured analysis, synthesis, and chat. */
export const geminiModel = google(
  getConfiguredModel("GEMINI_MODEL", DEFAULT_GEMINI_MODEL),
);

/**
 * Model used only for Google Search grounding. It remains separately
 * configurable because model access and grounding quotas can differ.
 */
export const geminiSearchModel = google(
  getConfiguredModel("GEMINI_SEARCH_MODEL", DEFAULT_GEMINI_SEARCH_MODEL),
);

/** Creates a Google Search grounding tool for a single model request. */
export function createGoogleSearchTool() {
  return google.tools.googleSearch({});
}
