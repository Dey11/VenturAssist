import { generateObject, generateText } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { RedLensModule } from "@/generated/prisma/client";
import { RedLensModuleAssessmentResult } from "../types";

const model = google("gemini-2.5-flash");

/**
 * Helper function to perform web search for additional context
 */
async function performWebSearch(query: string): Promise<string> {
  try {
    const { text, sources } = await generateText({
      model: google("gemini-2.5-flash"),
      tools: {
        google_search: google.tools.googleSearch({}),
      },
      prompt: `Search for: ${query}. Provide a concise summary of the most relevant and recent information.`,
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
    console.warn("Web search failed:", error);
    return "Web search unavailable - proceeding with available data only.";
  }
}

// Schema for individual module assessment
const moduleAssessmentSchema = z.object({
  score: z
    .number()
    .min(0)
    .max(1)
    .describe("Risk score from 0-1 (0 = low risk, 1 = high risk)"),
  findings: z
    .array(z.string())
    .max(3)
    .describe("Array of 2-3 specific findings/risks identified"),
  recommendations: z
    .array(z.string())
    .max(3)
    .describe("Array of 2-3 recommendations from this module"),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Confidence in this assessment (0-1)"),
});

// Schema for overall RedLens assessment
const redLensAssessmentSchema = z.object({
  overallScore: z
    .number()
    .min(0)
    .max(1)
    .describe("Overall risk score from 0-1"),
  summary: z.string().describe("Executive summary of all risk findings"),
  recommendation: z
    .string()
    .describe("Final recommendation based on risk assessment"),
  confidenceScore: z
    .number()
    .min(0)
    .max(1)
    .describe("Confidence in the overall assessment (0-1)"),
  moduleAssessments: z.object({
    forensicAccountant: moduleAssessmentSchema,
    marketStrategist: moduleAssessmentSchema,
    talentScout: moduleAssessmentSchema,
    devilsAdvocate: moduleAssessmentSchema,
  }),
});

/**
 * Forensic Accountant Module
 * Analyzes financial metrics, business model sustainability, and financial red flags
 */
async function analyzeAsForensicAccountant(
  analysisData: any,
): Promise<RedLensModuleAssessmentResult> {
  // Get market context for financial analysis
  const marketContext = await performWebSearch(
    `startup financial metrics benchmarks ${analysisData.marketInfo?.tam || "technology sector"} 2024`,
  );

  const prompt = `
You are a forensic accountant with 20+ years of experience analyzing startup financials and identifying red flags.

Analyze the following startup data from a financial perspective:

Key Metrics: ${JSON.stringify(analysisData.keyMetrics, null, 2)}
Market Info: ${JSON.stringify(analysisData.marketInfo, null, 2)}
Description: ${analysisData.description || "No description provided"}
Summary: ${analysisData.finalSummary || "No summary provided"}

Market Context (from web search):
${marketContext}

Focus on:
- Financial sustainability and burn rate analysis
- Revenue model viability and scalability
- Financial red flags and inconsistencies
- Cash flow projections and runway estimates
- Unit economics and profitability potential
- Financial reporting quality and transparency
- Industry benchmarks and market comparisons

Provide a risk assessment with 2-3 specific findings and 2-3 actionable recommendations that a VC would want to know. Be concise and direct.
`;

  const { object } = await generateObject({
    model,
    schema: moduleAssessmentSchema,
    prompt,
    temperature: 0.1,
  });

  return {
    module: RedLensModule.FORENSIC_ACCOUNTANT,
    ...object,
  };
}

/**
 * Market Strategist Module
 * Analyzes market opportunity, competitive positioning, and market risks
 */
async function analyzeAsMarketStrategist(
  analysisData: any,
): Promise<RedLensModuleAssessmentResult> {
  // Get competitive and market intelligence
  const competitiveContext = await performWebSearch(
    `competitive landscape ${analysisData.description?.split(" ").slice(0, 5).join(" ") || "startup"} market analysis 2024`,
  );

  const prompt = `
You are a market strategist with deep expertise in market analysis and competitive intelligence.

Analyze the following startup data from a market strategy perspective:

Key Metrics: ${JSON.stringify(analysisData.keyMetrics, null, 2)}
Market Info: ${JSON.stringify(analysisData.marketInfo, null, 2)}
Description: ${analysisData.description || "No description provided"}
Summary: ${analysisData.finalSummary || "No summary provided"}

Competitive Context (from web search):
${competitiveContext}

Focus on:
- Market size validation and TAM/SAM/SOM analysis
- Competitive landscape and differentiation
- Market timing and adoption risks
- Customer acquisition strategy and costs
- Market saturation and growth potential
- Regulatory and market access barriers
- Current market trends and competitive positioning

Provide a risk assessment with 2-3 specific findings and 2-3 actionable recommendations that a VC would want to know. Be concise and direct.
`;

  const { object } = await generateObject({
    model,
    schema: moduleAssessmentSchema,
    prompt,
    temperature: 0.1,
  });

  return {
    module: RedLensModule.MARKET_STRATEGIST,
    ...object,
  };
}

/**
 * Talent Scout Module
 * Analyzes team composition, experience, and execution capability
 */
async function analyzeAsTalentScout(
  analysisData: any,
): Promise<RedLensModuleAssessmentResult> {
  // Get industry talent context
  const talentContext = await performWebSearch(
    `startup talent acquisition ${analysisData.description?.split(" ").slice(0, 3).join(" ") || "technology"} industry hiring trends 2024`,
  );

  const prompt = `
You are a talent scout and HR expert with extensive experience evaluating startup teams and leadership.

Analyze the following startup data from a talent and team perspective:

Team Members: ${JSON.stringify(analysisData.teamMembers, null, 2)}
Key Metrics: ${JSON.stringify(analysisData.keyMetrics, null, 2)}
Description: ${analysisData.description || "No description provided"}
Summary: ${analysisData.finalSummary || "No summary provided"}

Industry Talent Context (from web search):
${talentContext}

Focus on:
- Team composition and skill gaps
- Leadership experience and track record
- Technical expertise and domain knowledge
- Team dynamics and execution capability
- Hiring strategy and talent acquisition
- Key person risk and succession planning
- Industry talent trends and competitive hiring landscape

Provide a risk assessment with 2-3 specific findings and 2-3 actionable recommendations that a VC would want to know. Be concise and direct.
`;

  const { object } = await generateObject({
    model,
    schema: moduleAssessmentSchema,
    prompt,
    temperature: 0.1,
  });

  return {
    module: RedLensModule.TALENT_SCOUT,
    ...object,
  };
}

/**
 * Devil's Advocate Module
 * Takes a contrarian view and identifies potential failure points
 */
async function analyzeAsDevilsAdvocate(
  analysisData: any,
): Promise<RedLensModuleAssessmentResult> {
  // Get recent industry failures and risk factors
  const riskContext = await performWebSearch(
    `startup failures ${analysisData.description?.split(" ").slice(0, 3).join(" ") || "technology"} industry risks 2024`,
  );

  const prompt = `
You are a devil's advocate with a reputation for identifying potential failure points and challenging optimistic assumptions.

Analyze the following startup data from a contrarian, risk-focused perspective:

Key Metrics: ${JSON.stringify(analysisData.keyMetrics, null, 2)}
Team Members: ${JSON.stringify(analysisData.teamMembers, null, 2)}
Market Info: ${JSON.stringify(analysisData.marketInfo, null, 2)}
Description: ${analysisData.description || "No description provided"}
Summary: ${analysisData.finalSummary || "No summary provided"}

Industry Risk Context (from web search):
${riskContext}

Focus on:
- Overly optimistic assumptions and projections
- Hidden risks and potential failure modes
- Market timing and external factor risks
- Technology and execution risks
- Regulatory and compliance challenges
- Competitive threats and market changes
- Recent industry failures and common pitfalls

Challenge conventional wisdom and identify what could go wrong. Provide a risk assessment with 2-3 specific findings and 2-3 actionable recommendations that a VC would want to know. Be concise and direct.
`;

  const { object } = await generateObject({
    model,
    schema: moduleAssessmentSchema,
    prompt,
    temperature: 0.2, // Slightly higher temperature for more creative contrarian thinking
  });

  return {
    module: RedLensModule.DEVILS_ADVOCATE,
    ...object,
  };
}

/**
 * Main RedLens risk assessment function
 * Orchestrates all specialized modules and provides overall assessment
 */
export async function performRedLensAssessment(analysisData: any): Promise<{
  overallScore: number;
  summary: string;
  recommendation: string;
  confidenceScore: number;
  moduleAssessments: RedLensModuleAssessmentResult[];
}> {
  try {
    console.log("Starting RedLens risk assessment...");

    // Run all modules in parallel for efficiency
    const [
      forensicAccountantResult,
      marketStrategistResult,
      talentScoutResult,
      devilsAdvocateResult,
    ] = await Promise.all([
      analyzeAsForensicAccountant(analysisData),
      analyzeAsMarketStrategist(analysisData),
      analyzeAsTalentScout(analysisData),
      analyzeAsDevilsAdvocate(analysisData),
    ]);

    const moduleAssessments = [
      forensicAccountantResult,
      marketStrategistResult,
      talentScoutResult,
      devilsAdvocateResult,
    ];

    // Calculate overall score as weighted average
    const overallScore =
      moduleAssessments.reduce((sum, assessment) => sum + assessment.score, 0) /
      moduleAssessments.length;

    // Calculate overall confidence as average of module confidences
    const confidenceScore =
      moduleAssessments.reduce(
        (sum, assessment) => sum + assessment.confidence,
        0,
      ) / moduleAssessments.length;

    // Generate overall summary and recommendation
    const summaryPrompt = `
Based on the following specialized risk assessments, provide an executive summary and final recommendation:

Forensic Accountant Assessment:
- Score: ${forensicAccountantResult.score}
- Key Findings: ${forensicAccountantResult.findings.join(", ")}
- Recommendations: ${forensicAccountantResult.recommendations.join(", ")}

Market Strategist Assessment:
- Score: ${marketStrategistResult.score}
- Key Findings: ${marketStrategistResult.findings.join(", ")}
- Recommendations: ${marketStrategistResult.recommendations.join(", ")}

Talent Scout Assessment:
- Score: ${talentScoutResult.score}
- Key Findings: ${talentScoutResult.findings.join(", ")}
- Recommendations: ${talentScoutResult.recommendations.join(", ")}

Devil's Advocate Assessment:
- Score: ${devilsAdvocateResult.score}
- Key Findings: ${devilsAdvocateResult.findings.join(", ")}
- Recommendations: ${devilsAdvocateResult.recommendations.join(", ")}

Overall Risk Score: ${overallScore.toFixed(2)}

Provide a concise executive summary and clear investment recommendation.
`;

    const { object: summaryResult } = await generateObject({
      model,
      schema: z.object({
        summary: z.string().describe("Executive summary of all risk findings"),
        recommendation: z.string().describe("Final investment recommendation"),
      }),
      prompt: summaryPrompt,
      temperature: 0.1,
    });

    console.log(
      `RedLens assessment completed. Overall score: ${overallScore.toFixed(2)}`,
    );

    return {
      overallScore,
      summary: summaryResult.summary,
      recommendation: summaryResult.recommendation,
      confidenceScore,
      moduleAssessments,
    };
  } catch (error) {
    console.error("Error in RedLens assessment:", error);
    throw new Error(
      `RedLens assessment failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
