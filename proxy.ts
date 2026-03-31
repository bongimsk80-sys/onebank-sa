import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;

  const isAuthPage = nextUrl.pathname.startsWith("/login");
  const isProtectedPage =
    nextUrl.pathname.startsWith("/overview") ||
    nextUrl.pathname.startsWith("/transactions") ||
    nextUrl.pathname.startsWith("/payments") ||
    nextUrl.pathname.startsWith("/beneficiaries") ||
    nextUrl.pathname.startsWith("/analytics") ||
    nextUrl.pathname.startsWith("/settings") ||
    nextUrl.pathname.startsWith("/feedback");

  // Redirect logged-in users away from login page
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/overview", nextUrl));
  }

  // Redirect logged-out users to login page
  if (!isLoggedIn && isProtectedPage) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/overview",
    "/transactions",
    "/payments",
    "/beneficiaries/:path*",
    "/analytics",
    "/settings",
    "/settings/:path*",
    "/erp",
    "/users",
    "/feedback",
    "/login",
  ],
};