import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getIngestionJobStatus } from "@/server/bullmq/queues/ingestion-queue";

// Get job status and details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await req.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;

    // Get job from database
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        startup: {
          userId: session.user.id,
        },
      },
      include: {
        startup: {
          select: {
            id: true,
            name: true,
            overallStatus: true,
          },
        },
        dataSources: {
          select: {
            id: true,
            type: true,
            fileName: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found or access denied" },
        { status: 404 },
      );
    }

    // Get queue job status if available
    let queueJobStatus = null;
    try {
      queueJobStatus = await getIngestionJobStatus(jobId);
    } catch (error) {
      console.warn("Could not get queue job status:", error);
    }

    // Calculate progress
    const totalDataSources = job.dataSources.length;
    const completedDataSources = job.dataSources.filter(
      (ds) => ds.status === "COMPLETED",
    ).length;
    const failedDataSources = job.dataSources.filter(
      (ds) => ds.status === "FAILED",
    ).length;
    const inProgressDataSources = job.dataSources.filter(
      (ds) => ds.status === "IN_PROGRESS",
    ).length;

    const progress =
      totalDataSources > 0
        ? (completedDataSources / totalDataSources) * 100
        : 0;

    return NextResponse.json({
      job: {
        id: job.id,
        type: job.type,
        status: job.status,
        payload: job.payload,
        result: job.result,
        logs: job.logs,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      },
      startup: job.startup,
      dataSources: job.dataSources,
      progress: {
        percentage: Math.round(progress),
        completed: completedDataSources,
        failed: failedDataSources,
        inProgress: inProgressDataSources,
        total: totalDataSources,
      },
      queueStatus: queueJobStatus,
    });
  } catch (error) {
    console.error("Error getting job status:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
