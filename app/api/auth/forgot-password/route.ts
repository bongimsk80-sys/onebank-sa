import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";

// POST /api/auth/forgot-password — public route, no auth required
// Always returns { success: true } to prevent email enumeration
export async function POST(req: NextRequest) {
  try {
    const body  = await req.json();
    const email = (body?.email ?? "").trim().toLowerCase();

    if (!email) {
      // Still return success shape — don't reveal why
      return NextResponse.json({ success: true });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    // If no user: return success silently — never confirm the email exists
    if (user) {
      const resetToken  = generateResetToken();
      const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry: resetExpiry,
        },
      });

      const baseUrl  = process.env.NEXTAUTH_URL ?? "https://onebank-sa-iota.vercel.app";
      const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
      await sendPasswordResetEmail(user.email, user.name, resetUrl);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[forgot-password] Unexpected error:", err);
    // Return success even on error — don't leak internal state
    return NextResponse.json({ success: true });
  }
}
