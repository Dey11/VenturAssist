import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import {
  DataSourceAnalysisResult,
  KeyMetric,
  TeamMember,
  MarketInfo,
  RiskIndicator,
} from "../types";

// Initialize the AI model
const model = google("gemini-2.5-flash");

// Define Zod schema for the analysis result
const analysisResultSchema = z.object({
  summary: z.string().describe("A concise 2-3 sentence summary of the startup"),
  keyMetrics: z
    .array(
      z.object({
        name: z
          .string()
          .describe("Metric name (e.g., Monthly Recurring Revenue)"),
        value: z.string().describe("The value (e.g., $50k, 20%)"),
        unit: z
          .string()
          .optional()
          .describe("Unit if applicable (e.g., USD, %)"),
        reportedDate: z
          .string()
          .optional()
          .describe(
            "Date if mentioned (any date format or text, e.g., '2024', 'January 2024', 'Q1 2024', 'Recent')",
          ),
        insight: z
          .string()
          .optional()
          .describe("Brief insight about this metric"),
      }),
    )
    .optional()
    .default([]),
  teamMembers: z
    .array(
      z.object({
        name: z.string().describe("Full name"),
        role: z.string().optional().describe("Job title/role"),
        linkedInUrl: z
          .string()
          .optional()
          .describe("LinkedIn URL if mentioned"),
        bioSummary: z
          .string()
          .optional()
          .describe("Brief professional summary"),
      }),
    )
    .optional()
    .default([]),
  marketInfo: z
    .object({
      tam: z
        .string()
        .optional()
        .describe("Total Addressable Market if mentioned"),
      sam: z
        .string()
        .optional()
        .describe("Serviceable Available Market if mentioned"),
      som: z
        .string()
        .optional()
        .describe("Serviceable Obtainable Market if mentioned"),
      analysis: z
        .string()
        .optional()
        .describe("Analysis of market sizing claims"),
    })
    .optional(),
  risks: z
    .array(
      z.object({
        riskTitle: z
          .string()
          .describe("Risk title (e.g., Inconsistent Metrics)"),
        explanation: z.string().describe("Detailed explanation of the risk"),
        severity: z
          .enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
          .describe("Risk severity level"),
      }),
    )
    .optional()
    .default([]),
  insights: z
    .array(z.string())
    .describe("Key actionable insights about this startup"),
});

/**
 * Analyze a data source content and extract structured information
 */
export async function analyzeDataSource(
  content: string,
  fileName?: string,
  startupName?: string,
): Promise<DataSourceAnalysisResult> {
  try {
    const prompt = `
You are an expert startup analyst. Analyze the following content and extract structured information about a startup.

${startupName ? `Startup Name: ${startupName}` : ""}
${fileName ? `Document(s): ${fileName}` : ""}

Content to analyze:
${content}

Guidelines:
- This content may come from multiple documents (pitch decks, financial reports, team bios, etc.)
- Only include information that is explicitly mentioned in the content
- Be conservative with risk assessment - only flag genuine concerns
- For metrics, extract actual numbers when available from any of the documents
- For dates, use any valid date format (e.g., "2024", "January 2024", "Q1 2024", "2024-01-15") - they will be normalized
- For team members, focus on founders and key executives mentioned across all documents
- Market info should only include TAM/SAM/SOM if specifically mentioned
- Insights should be actionable and specific to this startup
- If information appears in multiple documents, prioritize the most recent or detailed version
- Cross-reference information across documents for consistency
`;

    const { object: analysisResult } = await generateObject({
      model,
      schema: analysisResultSchema,
      prompt,
      temperature: 0.1,
    });

    console.log("AI Analysis Result:", JSON.stringify(analysisResult, null, 2));

    // Validate and clean the result
    return {
      summary: analysisResult.summary || "No summary available",
      keyMetrics: analysisResult.keyMetrics || [],
      teamMembers: analysisResult.teamMembers || [],
      marketInfo: analysisResult.marketInfo || undefined,
      risks: analysisResult.risks || [],
      insights: analysisResult.insights || [],
    };
  } catch (error) {
    console.error("Error analyzing data source:", error);

    // Return a fallback result
    return {
      summary: "Analysis failed - unable to process content",
      keyMetrics: [],
      teamMembers: [],
      marketInfo: undefined,
      risks: [
        {
          riskTitle: "Analysis Error",
          explanation:
            "Failed to analyze this data source due to processing error",
          severity: "MEDIUM" as const,
        },
      ],
      insights: ["Content analysis encountered an error"],
    };
  }
}

// Analyze multiple data sources and aggregate results
export async function analyzeMultipleDataSources(
  dataSources: Array<{
    content: string;
    fileName?: string;
    type: string;
  }>,
  startupName?: string,
): Promise<DataSourceAnalysisResult> {
  try {
    // Combine all content for comprehensive analysis
    const combinedContent = dataSources
      .map((ds, index) => {
        const header = ds.fileName
          ? `\n--- Document ${index + 1}: ${ds.fileName} ---\n`
          : `\n--- Document ${index + 1} ---\n`;
        return header + ds.content;
      })
      .join("\n");

    return await analyzeDataSource(combinedContent, undefined, startupName);
  } catch (error) {
    console.error("Error analyzing multiple data sources:", error);

    return {
      summary: "Analysis failed - unable to process multiple data sources",
      keyMetrics: [],
      teamMembers: [],
      marketInfo: undefined,
      risks: [
        {
          riskTitle: "Multi-Source Analysis Error",
          explanation:
            "Failed to analyze multiple data sources due to processing error",
          severity: "MEDIUM" as const,
        },
      ],
      insights: ["Multi-source content analysis encountered an error"],
    };
  }
}
