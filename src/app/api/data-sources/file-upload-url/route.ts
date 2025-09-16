import { NextRequest } from "next/server";
import { getSignedUrlForUploadingSchema } from "@/lib/schema";
import { getSignedUrlForUploading } from "@/lib/object-storage";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// This route is used to get a signed url for uploading a file to the data sources bucket.
// stores in "uploads/userId/startupId/fileName-timestamp.extension"
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await req.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedBody = getSignedUrlForUploadingSchema.safeParse(body);

    if (!validatedBody.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { fileName, fileType, fileSize, startupId } = validatedBody.data;

    const newFileName = `uploads/${session.user.id}/${startupId}/${fileName}`; // we dont account for dupe names rn
    const signedUrl = await getSignedUrlForUploading(
      newFileName,
      fileType,
      fileSize,
    );

    return NextResponse.json({ url: signedUrl, key: newFileName, fileName });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
