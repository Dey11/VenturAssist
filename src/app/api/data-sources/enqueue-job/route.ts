import { auth } from "@/lib/auth";
import { enqueueJobSchema } from "@/lib/schema";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { JobStatus, JobType } from "@/generated/prisma/client";
import { addIngestionJob } from "@/server/bullmq/queues/ingestion-queue";

// This route is used to enqueue a job to extract data from all data sources.
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await req.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedBody = enqueueJobSchema.safeParse(body);

    if (!validatedBody.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { startupId } = validatedBody.data;

    const newJob = await prisma.$transaction(async (tx) => {
      const allDataSources = await tx.dataSource.findMany({
        where: { startupId, status: JobStatus.NOT_STARTED },
      });

      if (allDataSources.length === 0) {
        throw new Error("No data sources found to process");
      }

      const job = await tx.job.create({
        data: {
          startupId,
          type: JobType.EXTRACT_DATA_FROM_SOURCE,
          payload: {
            dataSources: allDataSources.map((dataSource) => dataSource.id),
          },
        },
      });

      await tx.dataSource.updateMany({
        where: { startupId, status: JobStatus.NOT_STARTED },
        data: { status: JobStatus.PENDING }, // enqueued the job
      });

      return job;
    });

    // Enqueue the job in BullMQ after database transaction
    try {
      const queueJob = await addIngestionJob({
        jobId: newJob.id,
        startupId,
        dataSourceIds: (newJob.payload as any)?.dataSources as string[],
      });

      return NextResponse.json(
        {
          message: "Job enqueued successfully",
          jobId: newJob.id,
          queueJobId: queueJob.id,
        },
        { status: 201 },
      );
    } catch (queueError) {
      console.error("Failed to enqueue job in BullMQ:", queueError);

      // Rollback the database changes if queue enqueue fails
      await prisma.$transaction(async (tx) => {
        await tx.job.delete({ where: { id: newJob.id } });
        await tx.dataSource.updateMany({
          where: { startupId, status: JobStatus.PENDING },
          data: { status: JobStatus.NOT_STARTED },
        });
      });

      return NextResponse.json(
        { error: "Failed to enqueue job for processing" },
        { status: 500 },
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
