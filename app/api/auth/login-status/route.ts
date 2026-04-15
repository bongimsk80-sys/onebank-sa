import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/auth/login-status
 * Called by the login page ONLY after a CredentialsSignin failure, to give
 * the user a meaningful error rather than the generic "invalid credentials".
 *
 * Returns { reason: "unverified" | "inactive" | "invalid" }
 * Never confirms whether an email is registered (returns "invalid" for
 * unknown emails so we don't leak account existence).
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json().catch(() => ({}));
    if (!email) return NextResponse.json({ reason: "invalid" });

    const user = await prisma.user.findUnique({
      where: { email: (email as string).trim().toLowerCase() },
      select: { isActive: true, isVerified: true, verificationToken: true },
    });

    if (!user) return NextResponse.json({ reason: "invalid" });
    if (!user.isActive) return NextResponse.json({ reason: "inactive" });

    // Unverified = registered via new flow (verificationToken not null) but
    // hasn't clicked the link yet.
    if (!user.isVerified && user.verificationToken !== null) {
      return NextResponse.json({ reason: "unverified" });
    }

    return NextResponse.json({ reason: "invalid" });
  } catch {
    return NextResponse.json({ reason: "invalid" });
  }
}
