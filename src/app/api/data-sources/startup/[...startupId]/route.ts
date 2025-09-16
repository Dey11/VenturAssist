import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// This route is used to get all data sources for a startup.
export async function GET(
  req: NextRequest,
  { params }: { params: { startupId: string } },
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
        { status: 400 },
      );
    }

    const dataSources = await prisma.dataSource.findMany({
      where: { startupId },
    });

    return NextResponse.json(dataSources, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
