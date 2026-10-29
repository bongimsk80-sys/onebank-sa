import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateVerificationToken, verificationTokenExpiry } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";
import { checkAuthRateLimit } from "@/lib/rate-limit";
import { validateCsrf } from "@/lib/csrf";

// POST /api/auth/register — public route, no auth required
export async function POST(req: NextRequest) {
  // Rate-limit by IP to prevent account creation spam
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
    // ── 1. Parse & validate body ────────────────────────────────────────────
    const body = await req.json();
    const { orgName, firstName, lastName, email, password } = body ?? {};

    if (!orgName || !firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required: orgName, firstName, lastName, email, password" },
        { status: 400 }
      );
    }

    const trimmedEmail = (email as string).trim().toLowerCase();
    const trimmedOrg  = (orgName as string).trim();
    const fullName    = `${(firstName as string).trim()} ${(lastName as string).trim()}`;

    // ── 2. Check email uniqueness ────────────────────────────────────────────
    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // ── 3. Generate org slug ─────────────────────────────────────────────────
    const baseSlug = trimmedOrg
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")   // strip special chars
      .trim()
      .replace(/\s+/g, "-")            // spaces → hyphens
      .replace(/-+/g, "-");            // collapse consecutive hyphens

    // ── 4. Check slug uniqueness (append random suffix if taken) ────────────
    let slug = baseSlug;
    const existingOrg = await prisma.organisation.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (existingOrg) {
      const suffix = Math.random().toString(36).slice(2, 6);
      slug = `${baseSlug}-${suffix}`;
    }

    // ── 5. Hash password ─────────────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password as string, 12);

    // ── 6 & 7. Create Organisation + User in a transaction ──────────────────
    const { user, verificationToken } = await prisma.$transaction(async (tx) => {
      const org = await tx.organisation.create({
        data: {
          name:     trimmedOrg,
          slug,
          plan:     "beta",
          isActive: true,
        },
      });

      // ── 8. Generate verification token ──────────────────────────────────
      const verificationToken  = generateVerificationToken();
      const tokenExpiry        = verificationTokenExpiry();

      // ── 9. Save token on user ────────────────────────────────────────────
      const user = await tx.user.create({
        data: {
          name:                    fullName,
          email:                   trimmedEmail,
          password:                hashedPassword,
          role:                    "admin",
          isActive:                true,
          isVerified:              false,
          verificationToken,
          verificationTokenExpiry: tokenExpiry,
          organisationId:          org.id,
        },
      });

      return { user, verificationToken };
    });

    // ── 10. Send verification email (fire-and-forget — never block 201) ────────
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

    sendVerificationEmail(user.email, user.name, verificationUrl).catch((err) => {
      console.error("[register] Failed to send verification email:", err);
    });

    // ── 11. Respond ──────────────────────────────────────────────────────────
    return NextResponse.json(
      { success: true, message: "Check your email to verify your account" },
      { status: 201 }
    );
  } catch (err) {
    console.error("[register] Unexpected error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
