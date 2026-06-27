import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname.startsWith("/signin") || pathname.startsWith("/signup");
  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/management");

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  if (!isLoggedIn && isProtected) {
    return NextResponse.redirect(new URL("/signin", req.nextUrl));
  }

  if (
    isLoggedIn &&
    pathname.startsWith("/management") &&
    req.auth?.user?.role !== "MANAGEMENT"
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/management/:path*", "/signin", "/signup"],
};
