import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (process.env.AGENTS_DISABLED === "true") {
    if (
      pathname.startsWith("/api/agent/") ||
      pathname.startsWith("/agents/demo")
    ) {
      return NextResponse.json(
        { error: "Agents temporarily disabled" },
        { status: 503 },
      );
    }
  }

  const needsAdmin =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const needsAuth =
    needsAdmin ||
    pathname.startsWith("/student") ||
    pathname.startsWith("/api/student");

  if (!needsAuth) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (needsAdmin && token.role !== "ADMIN") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/student/:path*",
    "/api/student/:path*",
    "/api/agent/:path*",
    "/agents/demo",
  ],
};
