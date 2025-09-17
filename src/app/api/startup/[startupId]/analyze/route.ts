import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// will need to looked into
export async function POST(
  req: NextRequest,
  { params }: { params: { startupId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await req.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { startupId } = params;
    if (!startupId) {
      return NextResponse.json(
        { error: "Startup ID is required" },
        { status: 400 }
      );
    }

    const existingStartup = await prisma.startup.findFirst({
      where: {
        id: startupId,
        userId: session.user.id,
      },
    });

    if (!existingStartup) {
      return NextResponse.json(
        { error: "Startup not found" },
        { status: 404 }
      );
    }

    const jobTypes = [
      "EXTRACT_DATA_FROM_SOURCE",
      "SCRAPE_COMPETITOR_DATA", 
      "BENCHMARK_AGAINST_PEERS",
      "GENERATE_RISK_ANALYSIS",
      "GENERATE_FINAL_SUMMARY"
    ];

    const jobs = await Promise.all(
      jobTypes.map(jobType =>
        prisma.job.create({
          data: {
            type: jobType as any,
            status: "PENDING",
            startupId: startupId,
            payload: {
              startupId: startupId,
              startupName: existingStartup.name,
            },
          },
        })
      )
    );

    await prisma.startup.update({
      where: {
        id: startupId,
      },
      data: {
        overallStatus: "PENDING",
      },
    });

    return NextResponse.json(
      {
        message: "Analysis pipeline started.",
        jobs_created: jobs.length,
      },
      { status: 202 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}