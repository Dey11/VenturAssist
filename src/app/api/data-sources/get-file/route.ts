import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getFileSchema } from "@/lib/schema";
import { getSignedUrlForViewing } from "@/lib/object-storage";
import prisma from "@/lib/prisma";

// This route is used to get a presigned URL for viewing a file from a startup's data sources.
// not authenticated for now
export async function GET(req: NextRequest) {
  try {
    // const session = await auth.api.getSession({
    //   headers: await req.headers,
    // });

    // if (!session) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { searchParams } = new URL(req.url);
    const startupId = searchParams.get("startupId");
    const dataSourceId = searchParams.get("dataSourceId");
    // const userId = searchParams.get("userId");

    const validatedParams = getFileSchema.safeParse({
      startupId,
      dataSourceId,
    });

    if (!validatedParams.success) {
      return NextResponse.json(
        { error: "Invalid query parameters" },
        { status: 400 },
      );
    }

    const { startupId: validStartupId, dataSourceId: validDataSourceId } =
      validatedParams.data;

    const startup = await prisma.startup.findFirst({
      where: {
        id: validStartupId,
        // userId: session.user.id,
        // userId: userId!,
      },
    });

    if (!startup) {
      return NextResponse.json(
        { error: "Startup not found or access denied" },
        { status: 404 },
      );
    }

    const dataSource = await prisma.dataSource.findFirst({
      where: {
        id: validDataSourceId,
        startupId: validStartupId,
        type: "FILE_UPLOAD",
      },
    });

    if (!dataSource || !dataSource.sourceUrl) {
      return NextResponse.json(
        { error: "File not found or not a valid file upload" },
        { status: 404 },
      );
    }

    const presignedUrl = await getSignedUrlForViewing(dataSource.sourceUrl);

    return NextResponse.json({
      url: presignedUrl,
      fileName: dataSource.fileName,
      dataSourceId: dataSource.id,
    });
  } catch (error) {
    console.error("Error getting file presigned URL:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
