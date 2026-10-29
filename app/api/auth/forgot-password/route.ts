import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateResetToken, resetTokenExpiry } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkAuthRateLimit } from "@/lib/rate-limit";
import { validateCsrf } from "@/lib/csrf";

// POST /api/auth/forgot-password — public route, no auth required
// Always returns { success: true } to prevent email enumeration
export async function POST(req: NextRequest) {
  const csrfError = validateCsrf(req);
  if (csrfError) return NextResponse.json({ success: true }); // silent — no enumeration

  // Rate-limit by IP to prevent reset spam / email bombing
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkAuthRateLimit(ip))) {
    return NextResponse.json({ success: true }); // don't reveal throttling on this endpoint
  }

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
      const resetToken = generateResetToken();

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry: resetTokenExpiry(), // 1 hour from now
        },
      });

      const baseUrl  = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
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
