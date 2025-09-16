import { DataSourceType } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { finalizeFileUploadSchema } from "@/lib/schema";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// This route is used to confirm that a file has been uploaded to the data sources bucket.
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await req.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedBody = finalizeFileUploadSchema.safeParse(body);

    if (!validatedBody.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { key, fileName, startupId } = validatedBody.data;

    const newDataSource = await prisma.dataSource.create({
      data: {
        type: DataSourceType.FILE_UPLOAD,
        fileName,
        startupId,
        sourceUrl: key,
      },
    });

    return NextResponse.json({ dataSourceId: newDataSource.id });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
