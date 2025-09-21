import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is in the (main) group
  const isMainRoute =
    pathname.startsWith("/startups") ||
    pathname.startsWith("/add-startup") ||
    pathname.startsWith("/startup/") ||
    pathname.startsWith("/chat/");

  if (isMainRoute) {
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session) {
        // Redirect to login page if not authenticated
        return NextResponse.redirect(new URL("/login", request.url));
      }
    } catch (error) {
      console.error("Authentication error in middleware:", error);
      // Redirect to login page on authentication error
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  runtime: "nodejs",
  matcher: [
    "/startups/:path*",
    "/add-startup/:path*",
    "/startup/:path*",
    "/chat/:path*",
  ],
};
