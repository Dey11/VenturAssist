import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await req.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const startups = await prisma.startup.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        description : true,
        overallStatus: true,
        updatedAt: true,
        teamMembers : true,
        risks : true,
        keyMetrics : true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json(startups, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
