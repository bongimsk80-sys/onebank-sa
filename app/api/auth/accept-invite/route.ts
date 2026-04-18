import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isTokenExpired } from "@/lib/tokens";
import { checkAuthRateLimit } from "@/lib/rate-limit";
import { validateCsrf } from "@/lib/csrf";

// POST /api/auth/accept-invite — public route
export async function POST(req: NextRequest) {
  const csrfError = validateCsrf(req);
  if (csrfError) return csrfError;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkAuthRateLimit(ip))) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a minute." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { token, firstName, lastName, password } = body ?? {};

    if (!token || !firstName || !lastName || !password) {
      return NextResponse.json(
        { error: "token, firstName, lastName and password are required." },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    // Find user by invite token
    const user = await prisma.user.findFirst({
      where: { inviteToken: token },
      select: { id: true, isVerified: true, inviteTokenExpiry: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "This invite link is invalid or has already been used." },
        { status: 400 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { error: "This invite has already been accepted. Please sign in." },
        { status: 409 }
      );
    }

    // Check expiry
    if (isTokenExpired(user.inviteTokenExpiry)) {
      return NextResponse.json(
        { error: "This invite link has expired. Please ask your admin to resend the invitation." },
        { status: 400 }
      );
    }

    const fullName       = `${(firstName as string).trim()} ${(lastName as string).trim()}`;
    const hashedPassword = await bcrypt.hash(password as string, 12);

    // C3: Atomic single-use claim — only succeeds if the token is still present
    // AND isVerified is still false (guards against race conditions where two
    // simultaneous requests both pass the checks above).
    const { count } = await prisma.user.updateMany({
      where: {
        id:         user.id,
        inviteToken: token,      // token must still match
        isVerified:  false,      // must not have been claimed already
      },
      data: {
        name:                   fullName,
        password:               hashedPassword,
        isVerified:             true,
        isActive:               true,
        inviteToken:            null,
        inviteTokenExpiry:      null,
        // Invited users join an existing org — they skip onboarding entirely.
        hasCompletedOnboarding: true,
      },
    });

    if (count === 0) {
      // The token was consumed by a concurrent request in the race window
      return NextResponse.json(
        { error: "This invite link has already been used. Please sign in." },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[accept-invite] Unexpected error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
