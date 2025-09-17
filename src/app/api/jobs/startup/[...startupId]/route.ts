import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// this route is used for long polling in the frontend to get the status of all jobs for a startup -> show some status bar
export default async function GET(
  request: Request,
  { params }: { params: { startupId: string } },
) {
  try {
    const session = await auth.api.getSession({
      headers: await request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { startupId } = params;

    const jobs = await prisma.job.findMany({
      where: { startupId },
      select: {
        id: true,
        type: true,
        status: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(jobs, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
