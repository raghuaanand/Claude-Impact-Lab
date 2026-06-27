import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const SUPERVISOR_ROLES = ["SUPERVISOR", "POLICE"];

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;

  const isAuthPage = pathname.startsWith("/signin") || pathname.startsWith("/signup");
  const isDashboard = pathname.startsWith("/dashboard");
  const isManagement = pathname.startsWith("/management");
  const isAdmin = pathname.startsWith("/admin");
  const isProtected = isDashboard || isManagement || isAdmin;

  if (isAuthPage && isLoggedIn) {
    const dest =
      role === "FAMILY" ? "/report/status" : "/dashboard";
    return NextResponse.redirect(new URL(dest, req.nextUrl));
  }

  if (!isLoggedIn && isProtected) {
    return NextResponse.redirect(new URL("/signin", req.nextUrl));
  }

  if (isLoggedIn && isManagement && role && !SUPERVISOR_ROLES.includes(role)) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  if (isLoggedIn && isDashboard && role === "FAMILY") {
    return NextResponse.redirect(new URL("/report/status", req.nextUrl));
  }

  if (isLoggedIn && isAdmin && role !== "POLICE") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/management/:path*",
    "/admin/:path*",
    "/signin",
    "/signup",
  ],
};
