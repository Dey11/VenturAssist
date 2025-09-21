import { NextResponse } from "next/server";

import { generateText, stepCountIs, streamText, tool } from "ai";
import { google } from "@ai-sdk/google";
import z from "zod";
import prisma from "@/lib/prisma";

const getStartupInfoDB = async (startupId: string) => {
  const startup = await prisma.startup.findFirst({
    where: { id: startupId },
    select: {
      id: true,
      name: true,
      description: true,
      websiteUrl: true,
      overallStatus: true,
      finalSummary: true,
      recommendation: true,
      confidenceScore: true,
      createdAt: true,
    },
  });
  //   console.log(startup)

  if (!startup) {
    return `No startup found with ID: ${startupId}`;
  }

  return JSON.stringify(startup, null, 2);
};

const getKeyMetricsDB = async (startupId: string) => {
  const metrics = await prisma.keyMetric.findMany({
    where: { startupId },
    select: {
      id: true,
      name: true,
      value: true,
      unit: true,
      reportedDate: true,
      insight: true,
    },
    orderBy: { reportedDate: "desc" },
  });

  //   console.log("Metrics", metrics)

  return JSON.stringify(metrics, null, 2);
};

const getMarketInfoDB = async (startupId: string) => {
  const marketInfo = await prisma.marketInfo.findFirst({
    where: { startupId },
    select: {
      id: true,
      tam: true,
      sam: true,
      som: true,
      analysis: true,
    },
  });

  //   console.log(marketInfo)

  if (!marketInfo) {
    return `No market information found for startup ID: ${startupId}`;
  }

  return JSON.stringify(marketInfo, null, 2);
};

const getTeamMembersDB = async (startupId: string) => {
  const teamMembers = await prisma.teamMember.findMany({
    where: { startupId },
    select: {
      id: true,
      name: true,
      role: true,
      linkedInUrl: true,
      bioSummary: true,
    },
  });

  //   console.log(teamMembers)

  return JSON.stringify(teamMembers, null, 2);
};

// Risk Analysis Tools
const getRiskIndicatorsDB = async (startupId: string) => {
  const riskIndicators = await prisma.riskIndicator.findMany({
    where: { startupId },
    select: {
      id: true,
      riskTitle: true,
      explanation: true,
      severity: true,
      createdAt: true,
    },
    orderBy: { severity: "desc" },
  });

  if (!riskIndicators.length) {
    return `No risk indicators found for startup ID: ${startupId}`;
  }

  return JSON.stringify(riskIndicators, null, 2);
};

const getRedLensAssessmentDB = async (startupId: string) => {
  const assessment = await prisma.redLensAssessment.findFirst({
    where: { startupId },
    select: {
      id: true,
      overallScore: true,
      summary: true,
      recommendation: true,
      confidenceScore: true,
      createdAt: true,
      moduleAssessments: {
        select: {
          id: true,
          module: true,
          score: true,
          findings: true,
          recommendations: true,
          confidence: true,
        },
      },
    },
  });

  if (!assessment) {
    return `No RedLens risk assessment found for startup ID: ${startupId}`;
  }

  return JSON.stringify(assessment, null, 2);
};

// Competitor Analysis Tools
const getCompetitorAnalysisDB = async (startupId: string) => {
  const analysis = await prisma.competitorAnalysis.findFirst({
    where: { startupId },
    select: {
      id: true,
      overallScore: true,
      marketPosition: true,
      competitiveAdvantage: true,
      threats: true,
      opportunities: true,
      recommendations: true,
      confidenceScore: true,
      createdAt: true,
      competitors: {
        select: {
          id: true,
          name: true,
          website: true,
          description: true,
          marketPosition: true,
          strengths: true,
          weaknesses: true,
          similarityScore: true,
          threatLevel: true,
          funding: true,
          employees: true,
          founded: true,
        },
      },
    },
  });

  if (!analysis) {
    return `No competitor analysis found for startup ID: ${startupId}`;
  }

  return JSON.stringify(analysis, null, 2);
};

// Benchmarking Tools
const getBenchmarksDB = async (startupId: string) => {
  const benchmarks = await prisma.benchmark.findMany({
    where: { startupId },
    select: {
      id: true,
      metricName: true,
      startupValue: true,
      competitorAverage: true,
      insight: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!benchmarks.length) {
    return `No benchmark data found for startup ID: ${startupId}`;
  }

  return JSON.stringify(benchmarks, null, 2);
};

// Job and Data Source Tools
const getJobsDB = async (startupId: string) => {
  const jobs = await prisma.job.findMany({
    where: { startupId },
    select: {
      id: true,
      type: true,
      status: true,
      payload: true,
      result: true,
      logs: true,
      startedAt: true,
      completedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!jobs.length) {
    return `No jobs found for startup ID: ${startupId}`;
  }

  return JSON.stringify(jobs, null, 2);
};

const getDataSourcesDB = async (startupId: string) => {
  const dataSources = await prisma.dataSource.findMany({
    where: { startupId },
    select: {
      id: true,
      type: true,
      fileName: true,
      sourceUrl: true,
      content: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!dataSources.length) {
    return `No data sources found for startup ID: ${startupId}`;
  }

  return JSON.stringify(dataSources, null, 2);
};

// Chat History Tools
const getChatHistoryDB = async (startupId: string) => {
  const chatHistory = await prisma.chatMessage.findMany({
    where: { startupId },
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 20, // Limit to last 20 messages
  });

  if (!chatHistory.length) {
    return `No chat history found for startup ID: ${startupId}`;
  }

  return JSON.stringify(chatHistory, null, 2);
};

// Onboarding Tools
const getOnboardingResponsesDB = async (startupId: string) => {
  const responses = await prisma.onboardingResponse.findMany({
    where: { startupId },
    select: {
      id: true,
      questionKey: true,
      questionText: true,
      answerValue: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (!responses.length) {
    return `No onboarding responses found for startup ID: ${startupId}`;
  }

  return JSON.stringify(responses, null, 2);
};

export async function POST(request: Request) {
  const { messages, startupId } = await request.json();

  // console.log("Received request:", { messages, startupId });

  // Fix message format and correct typos
  const correctedMessages = messages.map((msg: any) => ({
    ...msg,
    role: msg.role === "assitant" ? "assistant" : msg.role,
  }));

  const tools = {
    getStartupInfo: tool({
      description:
        "Get basic startup information including name, description, website, status, and analysis summary.",
      inputSchema: z.object({}),
      execute: async () => {
        return getStartupInfoDB(startupId);
      },
    }),

    getKeyMetrics: tool({
      description:
        "Get key metrics and financial data for the startup including revenue, growth, and other KPIs.",
      inputSchema: z.object({}),
      execute: async () => {
        return getKeyMetricsDB(startupId);
      },
    }),

    getMarketInfo: tool({
      description:
        "Get market analysis information including TAM (Total Addressable Market), SAM, and SOM data.",
      inputSchema: z.object({}),
      execute: async () => {
        return getMarketInfoDB(startupId);
      },
    }),

    getTeamMembers: tool({
      description:
        "Get information about the startup's team members including names, roles, and backgrounds.",
      inputSchema: z.object({}),
      execute: async () => {
        return getTeamMembersDB(startupId);
      },
    }),

    // Risk Analysis Tools
    getRiskIndicators: tool({
      description:
        "Get risk indicators and red flags identified for the startup, including severity levels and explanations.",
      inputSchema: z.object({}),
      execute: async () => {
        return getRiskIndicatorsDB(startupId);
      },
    }),

    getRedLensAssessment: tool({
      description:
        "Get comprehensive RedLens risk assessment including overall score, summary, recommendations, and detailed module assessments from specialized risk analysis modules.",
      inputSchema: z.object({}),
      execute: async () => {
        return getRedLensAssessmentDB(startupId);
      },
    }),

    // Competitor Analysis Tools
    getCompetitorAnalysis: tool({
      description:
        "Get comprehensive competitor analysis including market position, competitive advantages, threats, opportunities, and detailed competitor information.",
      inputSchema: z.object({}),
      execute: async () => {
        return getCompetitorAnalysisDB(startupId);
      },
    }),

    // Benchmarking Tools
    getBenchmarks: tool({
      description:
        "Get benchmark comparisons showing how the startup performs against competitors across various metrics.",
      inputSchema: z.object({}),
      execute: async () => {
        return getBenchmarksDB(startupId);
      },
    }),

    // Job and Data Source Tools
    getJobs: tool({
      description:
        "Get information about processing jobs including status, results, and logs for data extraction and analysis tasks.",
      inputSchema: z.object({}),
      execute: async () => {
        return getJobsDB(startupId);
      },
    }),

    getDataSources: tool({
      description:
        "Get information about uploaded data sources including files, URLs, and text inputs used for analysis.",
      inputSchema: z.object({}),
      execute: async () => {
        return getDataSourcesDB(startupId);
      },
    }),

    // Chat History Tools
    getChatHistory: tool({
      description:
        "Get recent chat conversation history for context about previous discussions about this startup.",
      inputSchema: z.object({}),
      execute: async () => {
        return getChatHistoryDB(startupId);
      },
    }),

    // Onboarding Tools
    getOnboardingResponses: tool({
      description:
        "Get VC onboarding responses including sector preferences, stage preferences, and other configuration data.",
      inputSchema: z.object({}),
      execute: async () => {
        return getOnboardingResponsesDB(startupId);
      },
    }),
  };

  // console.log("Calling generateText with tools...");

  try {
    const result = await generateText({
      model: google("gemini-2.5-flash"),
      system: `You are a comprehensive startup analysis assistant with access to detailed information about startups. You can access:

**Basic Information**: Startup details, team members, key metrics, and market information
**Risk Analysis**: Risk indicators, RedLens assessments, and specialized risk module evaluations
**Competitor Analysis**: Competitive positioning, competitor details, threats, and opportunities
**Benchmarking**: Performance comparisons against industry peers
**Processing Status**: Job status, data sources, and analysis progress
**Historical Context**: Chat history and onboarding preferences

You are currently working with startup ID: ${startupId}. Use the appropriate tools to fetch relevant data when users ask questions about the startup. Provide comprehensive, data-driven insights based on all available information.`,
      messages: correctedMessages,
      tools,
      stopWhen: stepCountIs(20), // Increased limit for more complex queries
    });

    const reply = result.text ?? null;

    // console.log("Generated result:", {
    //     hasText: !!result.text,
    //     textLength: result.text?.length || 0,
    //     reply: reply?.substring(0, 100) + "..."
    // });

    return NextResponse.json({ reply }, { status: 200 });
  } catch (error) {
    console.error("Error in generateText:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 },
    );
  }
}
