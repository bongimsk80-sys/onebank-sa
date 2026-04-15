import { auth } from "@/auth";
import { NextResponse } from "next/server";

// Public auth-flow pages — never require a session
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/invite",
];

// Dashboard pages that require a valid session
const PROTECTED_PATHS = [
  "/overview",
  "/transactions",
  "/payments",
  "/beneficiaries",
  "/analytics",
  "/erp",
  "/users",
  "/settings",
  "/feedback",
  "/onboarding",
];

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const pathname = nextUrl.pathname;
  const isLoggedIn = !!session;

  const isPublicAuthPage = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isProtectedPage = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

  // Redirect already-logged-in users away from auth pages (except /invite — allow
  // logged-in admins to preview the invite acceptance flow)
  if (isLoggedIn && isPublicAuthPage && !pathname.startsWith("/invite")) {
    return NextResponse.redirect(new URL("/overview", nextUrl));
  }

  // Redirect unauthenticated users away from protected pages
  if (!isLoggedIn && isProtectedPage) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Protected dashboard routes
    "/overview",
    "/transactions",
    "/payments",
    "/beneficiaries/:path*",
    "/analytics",
    "/erp",
    "/users",
    "/settings/:path*",
    "/feedback",
    "/onboarding",
    // Public auth-flow routes (so logged-in users are redirected away)
    "/login",
    "/register",
    "/verify-email",
    "/forgot-password",
    "/reset-password",
  ],
};
