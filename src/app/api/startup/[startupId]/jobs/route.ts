import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { JobType, JobStatus } from "@/generated/prisma/client";

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
    if (!startupId) {
      return NextResponse.json(
        { error: "Startup ID is required" },
        { status: 400 },
      );
    }

    // Get all jobs for this startup
    const jobs = await prisma.job.findMany({
      where: {
        startupId,
        startup: {
          userId: session.user.id,
        },
      },
      include: {
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
      orderBy: { createdAt: "desc" },
    });

    // Calculate overall progress
    const ingestionJob = jobs.find(
      (job) => job.type === JobType.EXTRACT_DATA_FROM_SOURCE,
    );
    const redLensJob = jobs.find(
      (job) => job.type === JobType.REDLENS_RISK_ASSESSMENT,
    );
    const competitorJob = jobs.find(
      (job) => job.type === JobType.COMPETITOR_ANALYSIS,
    );

    let overallProgress = 0;
    let overallStatus: JobStatus = JobStatus.NOT_STARTED;
    let currentStep = "Initializing...";

    if (ingestionJob && redLensJob && competitorJob) {
      // All three jobs exist
      const ingestionComplete = ingestionJob.status === JobStatus.COMPLETED;
      const redLensComplete = redLensJob.status === JobStatus.COMPLETED;
      const competitorComplete = competitorJob.status === JobStatus.COMPLETED;

      if (ingestionComplete && redLensComplete && competitorComplete) {
        overallProgress = 100;
        overallStatus = JobStatus.COMPLETED;
        currentStep = "Analysis complete!";
      } else if (ingestionComplete && !redLensComplete && !competitorComplete) {
        overallProgress = 33;
        overallStatus = JobStatus.IN_PROGRESS;
        currentStep = "Running risk assessment and competitor analysis...";
      } else if (ingestionComplete && (redLensComplete || competitorComplete)) {
        overallProgress = 66;
        overallStatus = JobStatus.IN_PROGRESS;
        currentStep = "Completing final analysis...";
      } else {
        overallProgress = Math.min(
          33,
          ingestionJob.status === JobStatus.IN_PROGRESS ? 16 : 0,
        );
        overallStatus = ingestionJob.status;
        currentStep = "Processing uploaded files...";
      }
    } else if (ingestionJob && redLensJob) {
      // Only ingestion and RedLens jobs exist (competitor job not created yet)
      const ingestionComplete = ingestionJob.status === JobStatus.COMPLETED;
      const redLensComplete = redLensJob.status === JobStatus.COMPLETED;

      if (ingestionComplete && redLensComplete) {
        // Don't mark as completed yet - wait for competitor job to be created
        overallProgress = 66;
        overallStatus = JobStatus.IN_PROGRESS;
        currentStep =
          "Risk assessment complete, starting competitor analysis...";
        console.log(
          "Ingestion and RedLens completed but no competitor job yet - waiting for competitor job creation",
        );
      } else if (ingestionComplete && !redLensComplete) {
        overallProgress = 50;
        overallStatus = redLensJob.status;
        currentStep = "Running risk assessment...";
      } else {
        overallProgress = Math.min(
          50,
          ingestionJob.status === JobStatus.IN_PROGRESS ? 25 : 0,
        );
        overallStatus = ingestionJob.status;
        currentStep = "Processing uploaded files...";
      }
    } else if (ingestionJob) {
      // Only ingestion job exists
      if (ingestionJob.status === JobStatus.COMPLETED) {
        overallProgress = 33;
        overallStatus = JobStatus.IN_PROGRESS; // Keep as IN_PROGRESS until other jobs complete
        currentStep = "Data processing complete, starting analysis...";
        console.log(
          "Ingestion completed but no analysis jobs yet - waiting for job creation",
        );
      } else {
        overallProgress =
          ingestionJob.status === JobStatus.IN_PROGRESS ? 16 : 0;
        overallStatus = ingestionJob.status;
        currentStep = "Processing uploaded files...";
      }
    } else if (redLensJob || competitorJob) {
      // Only analysis jobs exist (shouldn't happen normally)
      const redLensComplete = redLensJob?.status === JobStatus.COMPLETED;
      const competitorComplete = competitorJob?.status === JobStatus.COMPLETED;

      if (redLensComplete && competitorComplete) {
        overallProgress = 100;
        overallStatus = JobStatus.COMPLETED;
        currentStep = "Analysis complete!";
      } else {
        overallProgress = 50;
        overallStatus = JobStatus.IN_PROGRESS;
        currentStep = "Running analysis...";
      }
    }

    const response = {
      jobs,
      overallProgress,
      overallStatus,
      currentStep,
      hasIngestionJob: !!ingestionJob,
      hasRedLensJob: !!redLensJob,
      hasCompetitorJob: !!competitorJob,
      ingestionJobStatus: ingestionJob?.status || null,
      redLensJobStatus: redLensJob?.status || null,
      competitorJobStatus: competitorJob?.status || null,
    };

    console.log("Jobs API Response:", {
      ...response,
      debug: {
        overallStatusCalculated: overallStatus,
        overallProgressCalculated: overallProgress,
        currentStepCalculated: currentStep,
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error getting startup jobs:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
