import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// POST /api/auth/accept-invite — public route
export async function POST(req: NextRequest) {
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
      select: { id: true, isVerified: true },
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

    const fullName       = `${(firstName as string).trim()} ${(lastName as string).trim()}`;
    const hashedPassword = await bcrypt.hash(password as string, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name:                   fullName,
        password:               hashedPassword,
        isVerified:             true,
        isActive:               true,
        inviteToken:            null,
        // Invited users join an existing org — they skip onboarding entirely.
        hasCompletedOnboarding: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[accept-invite] Unexpected error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
