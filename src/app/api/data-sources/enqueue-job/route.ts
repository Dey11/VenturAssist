import { auth } from "@/lib/auth";
import { enqueueJobSchema } from "@/lib/schema";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { JobStatus, JobType } from "@/generated/prisma/client";

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

    return NextResponse.json(
      {
        message: "Job enqueued successfully",
        jobId: newJob.id,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
