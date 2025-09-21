import { generateObject, generateText } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import {
  CompetitorAnalysisJobData,
  CompetitorAnalysisJobResult,
  CompetitorResult,
} from "../types";

const model = google("gemini-2.5-flash");

// Schema for competitor analysis result
const competitorAnalysisSchema = z.object({
  overallScore: z
    .number()
    .min(0)
    .max(1)
    .describe(
      "Overall competitive positioning score (0-1, where 1 is excellent positioning)",
    ),
  marketPosition: z
    .string()
    .describe("Description of the startup's current market position"),
  competitiveAdvantage: z
    .string()
    .describe("Key competitive advantages identified"),
  threats: z
    .array(z.string())
    .max(5)
    .describe("Array of 3-5 competitive threats"),
  opportunities: z
    .array(z.string())
    .max(5)
    .describe("Array of 3-5 market opportunities"),
  recommendations: z
    .array(z.string())
    .max(5)
    .describe("Array of 3-5 strategic recommendations"),
  confidenceScore: z
    .number()
    .min(0)
    .max(1)
    .describe("Confidence in the analysis (0-1)"),
  competitors: z
    .array(
      z.object({
        name: z.string().describe("Competitor company name"),
        website: z.string().optional().describe("Competitor website URL"),
        description: z
          .string()
          .optional()
          .describe("Brief description of the competitor"),
        marketPosition: z
          .string()
          .optional()
          .describe("Their position in the market"),
        strengths: z
          .array(z.string())
          .max(3)
          .describe("Array of 2-3 competitor strengths"),
        weaknesses: z
          .array(z.string())
          .max(3)
          .describe("Array of 2-3 competitor weaknesses"),
        similarityScore: z
          .number()
          .min(0)
          .max(1)
          .describe("How similar they are to our startup (0-1)"),
        threatLevel: z
          .enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
          .describe("Threat level assessment"),
        funding: z
          .string()
          .optional()
          .describe("Recent funding information if available"),
        employees: z
          .string()
          .optional()
          .describe("Company size information if available"),
        founded: z.string().optional().describe("Founded date if available"),
      }),
    )
    .max(5)
    .describe("Array of 3-5 identified competitors"),
});

// Helper function to perform web search for competitor discovery
async function discoverCompetitors(
  startupData: CompetitorAnalysisJobData["startupData"],
): Promise<string> {
  try {
    const { text, sources } = await generateText({
      model: google("gemini-2.5-flash"),
      tools: {
        google_search: google.tools.googleSearch({}),
      },
      prompt: `Find the top 5 competitors for "${startupData.name}" - a startup that ${startupData.description || "operates in the technology sector"}. 
      
      Focus on:
      - Direct competitors offering similar products/services
      - Companies in the same market segment
      - Recent startups with similar business models
      - Established companies that could be competitive threats
      
      Provide company names, brief descriptions, and their competitive positioning.`,
    });

    // Extract source information for context
    const sourceInfo =
      sources
        ?.map((source) => {
          if (source.sourceType === "url" && "url" in source) {
            return source.url;
          }
          return source.id || "Unknown source";
        })
        .join(", ") || "";

    return `${text}${sourceInfo ? `\n\nSources: ${sourceInfo}` : ""}`;
  } catch (error) {
    console.warn("Competitor discovery search failed:", error);
    return "Competitor discovery search unavailable - proceeding with available data only.";
  }
}

// Helper function to analyze competitor websites using Exa API
async function analyzeCompetitorWebsite(websiteUrl: string): Promise<string> {
  try {
    const { text, sources } = await generateText({
      model: google("gemini-2.5-flash"),
      tools: {
        google_search: google.tools.googleSearch({}),
      },
      prompt: `Analyze the website ${websiteUrl} and provide:
      - Company description and business model
      - Key products/services offered
      - Market positioning and value proposition
      - Recent news or funding information
      - Company size and founding information
      
      Focus on competitive intelligence that would be relevant for a startup analysis.`,
    });

    return text;
  } catch (error) {
    console.warn(`Failed to analyze competitor website ${websiteUrl}:`, error);
    return `Website analysis unavailable for ${websiteUrl}`;
  }
}

// Perform comprehensive competitor analysis

export async function performCompetitorAnalysis(
  jobData: CompetitorAnalysisJobData,
): Promise<CompetitorAnalysisJobResult> {
  try {
    console.log(
      `Starting competitor analysis for startup: ${jobData.startupData.name}`,
    );

    // Discover competitors using web search
    const competitorDiscovery = await discoverCompetitors(jobData.startupData);

    // Analyze competitor websites if we have website URLs
    let competitorAnalysis = "";
    if (jobData.startupData.websiteUrl) {
      competitorAnalysis = await analyzeCompetitorWebsite(
        jobData.startupData.websiteUrl,
      );
    }

    const prompt = `
You are a competitive intelligence expert with 15+ years of experience analyzing startup ecosystems and competitive landscapes.

Analyze the following startup and provide a comprehensive competitor analysis:

STARTUP DATA:
Name: ${jobData.startupData.name}
Description: ${jobData.startupData.description || "No description provided"}
Website: ${jobData.startupData.websiteUrl || "No website provided"}
Key Metrics: ${JSON.stringify(jobData.startupData.keyMetrics, null, 2)}
Team Members: ${JSON.stringify(jobData.startupData.teamMembers, null, 2)}
Market Info: ${JSON.stringify(jobData.startupData.marketInfo, null, 2)}
Summary: ${jobData.startupData.finalSummary || "No summary provided"}

COMPETITOR DISCOVERY (from web search):
${competitorDiscovery}

COMPETITOR ANALYSIS (from website analysis):
${competitorAnalysis}

Focus on:
- Identifying the top 3-5 most relevant competitors
- Assessing competitive positioning and market share
- Analyzing competitive advantages and disadvantages
- Identifying market opportunities and threats
- Providing strategic recommendations for competitive positioning
- Evaluating threat levels and similarity scores

Provide a comprehensive analysis that would be valuable for VCs evaluating this startup's competitive position.
`;

    const { object: analysisResult } = await generateObject({
      model,
      schema: competitorAnalysisSchema,
      prompt,
      temperature: 0.1,
    });

    console.log("Competitor analysis completed successfully");

    return {
      overallScore: analysisResult.overallScore,
      marketPosition: analysisResult.marketPosition,
      competitiveAdvantage: analysisResult.competitiveAdvantage,
      threats: analysisResult.threats,
      opportunities: analysisResult.opportunities,
      recommendations: analysisResult.recommendations,
      confidenceScore: analysisResult.confidenceScore,
      competitors: analysisResult.competitors,
      completedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error performing competitor analysis:", error);
    throw new Error(
      `Competitor analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
