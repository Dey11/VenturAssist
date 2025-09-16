import { DataSourceType } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { dataSourcesTextInputSchema } from "@/lib/schema";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// This route is used to create a new data source for a text input.
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await req.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedBody = dataSourcesTextInputSchema.safeParse(body);

    if (!validatedBody.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { startupId, content } = validatedBody.data;

    const newDataSource = await prisma.dataSource.create({
      data: {
        type: DataSourceType.TEXT_INPUT,
        content,
        startupId,
      },
    });

    return NextResponse.json(
      { dataSourceId: newDataSource.id },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
