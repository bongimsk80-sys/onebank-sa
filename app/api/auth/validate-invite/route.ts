import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/auth/validate-invite?token=xxx — public route
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json({ valid: false, error: "Token is missing." });
    }

    const user = await prisma.user.findFirst({
      where: { inviteToken: token },
      select: {
        email:        true,
        role:         true,
        isVerified:   true,
        organisation: { select: { name: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ valid: false, error: "This invite link is invalid or has already been used." });
    }

    if (user.isVerified) {
      return NextResponse.json({ valid: false, error: "This invite has already been accepted. Please sign in." });
    }

    return NextResponse.json({
      valid:   true,
      email:   user.email,
      role:    user.role,
      orgName: user.organisation?.name ?? "OneBank SA",
    });
  } catch (err) {
    console.error("[validate-invite] Unexpected error:", err);
    return NextResponse.json({ valid: false, error: "Something went wrong." });
  }
}
