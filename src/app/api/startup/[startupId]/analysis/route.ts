import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { getAnalysisResults } from "@/server/bullmq/services/analysis-storage";
import prisma from "@/lib/prisma";

// Get analysis results for a startup
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ startupId: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await req.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { startupId } = await params;

    const startup = await prisma.startup.findFirst({
      where: {
        id: startupId,
        userId: session.user.id,
      },
    });

    if (!startup) {
      return NextResponse.json(
        { error: "Startup not found or access denied" },
        { status: 404 },
      );
    }

    const analysisResults = await getAnalysisResults(startupId);

    return NextResponse.json(analysisResults);
  } catch (error) {
    console.error("Error getting analysis results:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
