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
}

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
    orderBy: { reportedDate: 'desc' },
  });

//   console.log("Metrics", metrics)
  
  return JSON.stringify(metrics, null, 2);
}

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
}

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
}


export async function POST(request: Request) {
    const { messages, startupId } = await request.json();
    
    // console.log("Received request:", { messages, startupId });
    
    // Fix message format and correct typos
    const correctedMessages = messages.map((msg: any) => ({
        ...msg,
        role: msg.role === "assitant" ? "assistant" : msg.role
    }));
    

    const tools = {
        getStartupInfo: tool({
            description: "Get basic startup information including name, description, website, status, and analysis summary.",
            inputSchema: z.object({}),
            execute: async () => {
                return getStartupInfoDB(startupId);
            },
        }),
        
        getKeyMetrics: tool({
            description: "Get key metrics and financial data for the startup including revenue, growth, and other KPIs.",
            inputSchema: z.object({}),
            execute: async () => {
                return getKeyMetricsDB(startupId);
            },
        }),
        
        getMarketInfo: tool({
            description: "Get market analysis information including TAM (Total Addressable Market), SAM, and SOM data.",
            inputSchema: z.object({}),
            execute: async () => {
                return getMarketInfoDB(startupId);
            },
        }),
        
        getTeamMembers: tool({
            description: "Get information about the startup's team members including names, roles, and backgrounds.",
            inputSchema: z.object({}),
            execute: async () => {
                return getTeamMembersDB(startupId);
            },
        }),
    };

    // console.log("Calling generateText with tools...");
    
    try {
        const result = await generateText({
            model: google("gemini-2.0-flash"),
            system: `You are a helpful startup analysis assistant. You can access detailed information about startups using the available tools. You are currently working with startup ID: ${startupId}. Use the tools to fetch relevant data when users ask questions about the startup.`,
            messages: correctedMessages,
            tools,
            stopWhen : stepCountIs(15)
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
        return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
    }
}