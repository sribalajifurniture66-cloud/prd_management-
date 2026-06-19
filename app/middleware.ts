import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Allow login page always
  if (request.nextUrl.pathname === "/") {
    return NextResponse.next();
  }

  // Check for auth cookie
  const authCookie = request.cookies.get("auth_token");

  // If no auth cookie, redirect to login
  if (!authCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
