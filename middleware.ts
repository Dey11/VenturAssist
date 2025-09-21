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
        // Create a redirect URL that preserves the original path
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }
    } catch (error) {
      console.error("Authentication error in middleware:", error);
      // Create a redirect URL that preserves the original path
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
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
