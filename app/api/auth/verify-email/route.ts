import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";
import { isTokenExpired } from "@/lib/tokens";
import { checkAuthRateLimit } from "@/lib/rate-limit";

// GET /api/auth/verify-email?token=xxx — public route, no auth required
export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkAuthRateLimit(ip))) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a minute." },
      { status: 429 }
    );
  }

  try {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is missing." },
        { status: 400 }
      );
    }

    // Find user by token
    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
      include: { organisation: true },
      // include verificationTokenExpiry for expiry check below
    });

    if (!user) {
      return NextResponse.json(
        { error: "This verification link is invalid or has already been used." },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { error: "This email has already been verified. Please sign in." },
        { status: 409 }
      );
    }

    // Check expiry
    if (isTokenExpired(user.verificationTokenExpiry)) {
      return NextResponse.json(
        { error: "This verification link has expired. Please register again or contact support." },
        { status: 400 }
      );
    }

    // Mark verified and clear token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified:        true,
        verificationToken: null,
      },
    });

    // Send welcome email (non-blocking — don't fail verification if email errors)
    const orgName = user.organisation?.name ?? "your organisation";
    sendWelcomeEmail(user.email, user.name, orgName).catch((err) =>
      console.error("[verify-email] Welcome email failed:", err)
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[verify-email] Unexpected error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
