import { auth } from "@/lib/auth";
import { updateStartupSchema } from "@/lib/schema";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
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

    const startup = await prisma.startup.findFirst({
      where: {
        id: startupId,
        userId: session.user.id,
      },
      include: {
        risks: {
          select: {
            id: true,
            riskTitle: true,
            explanation: true,
            severity: true,
          },
        },
        benchmarks: {
          select: {
            id: true,
            metricName: true,
            startupValue: true,
            competitorAverage: true,
            insight: true,
          },
        },
        keyMetrics: {
          select: {
            id: true,
            name: true,
            value: true,
            unit: true,
            insight: true,
          },
        },
      },
    });

    if (!startup) {
      return NextResponse.json(
        { error: "Startup not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(startup, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const body = await req.json();
    const validatedBody = updateStartupSchema.safeParse(body);

    if (!validatedBody.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
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

    const updatedStartup = await prisma.startup.update({
      where: {
        id: startupId,
      },
      data: validatedBody.data,
      select: {
        id: true,
        name: true,
        description: true,
        websiteUrl: true,
        overallStatus: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedStartup, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    await prisma.startup.delete({
      where: {
        id: startupId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
