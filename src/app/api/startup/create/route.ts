import { auth } from "@/lib/auth";
import { createStartupSchema } from "@/lib/schema";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
    try {
        const session = await auth.api.getSession({
            headers: await req.headers,
          });
      
          if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
          }

          const body = await req.json();
          const validatedBody = createStartupSchema.safeParse(body);

          if (!validatedBody.success) {
            return NextResponse.json(
              { error: "Invalid request body" },
              { status: 400 },
            );
          }

          const { name, description, websiteUrl } = validatedBody.data;

          const startup = await prisma.startup.create({
            data: {
              name,
              description,
              websiteUrl,
              userId: session.user.id,
            },
          });

          return NextResponse.json({
            id: startup.id,
            name: startup.name,
            overallStatus: startup.overallStatus,
          }, { status: 201 });
    }  catch (error) {
        return NextResponse.json(
          { error: "Internal Server Error" },
          { status: 500 },
        );
      }
}