import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { generateInviteToken } from "@/lib/tokens";
import { sendTeamInviteEmail } from "@/lib/email";

// POST /api/users/invite — admin only
export async function POST(req: NextRequest) {
  const session = await requireRole(["admin"]);
  if (session instanceof NextResponse) return session;

  try {
    const body = await req.json();
    const { email, role, firstName, lastName } = body ?? {};

    // ── Validate fields ────────────────────────────────────────────────────
    if (!email || !role || !firstName || !lastName) {
      return NextResponse.json(
        { error: "email, role, firstName and lastName are required." },
        { status: 400 }
      );
    }

    const trimmedEmail = (email as string).trim().toLowerCase();

    // ── Guard: email already registered ────────────────────────────────────
    const existing = await prisma.user.findUnique({
      where: { email: trimmedEmail },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email is already registered." },
        { status: 409 }
      );
    }

    // ── Resolve inviting admin's organisationId from the DB ────────────────
    const adminId = (session.user as any).id as string;
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { name: true, organisationId: true, organisation: { select: { name: true } } },
    });

    const organisationId = admin?.organisationId ?? null;
    const orgName        = admin?.organisation?.name ?? "OneBank SA";
    const inviterName    = admin?.name ?? "Your admin";

    // ── Create placeholder user record ─────────────────────────────────────
    const inviteToken = generateInviteToken();
    const fullName    = `${(firstName as string).trim()} ${(lastName as string).trim()}`;

    await prisma.user.create({
      data: {
        name:           fullName,
        email:          trimmedEmail,
        password:       "", // no password until invite is accepted
        role:           role as string,
        isActive:       false,
        isVerified:     false,
        inviteToken,
        organisationId,
      },
    });

    // ── Send invite email ──────────────────────────────────────────────────
    const inviteUrl = `https://onebank-sa-iota.vercel.app/invite?token=${inviteToken}`;
    await sendTeamInviteEmail(trimmedEmail, inviterName, orgName, role as string, inviteUrl);

    // ── Notify ─────────────────────────────────────────────────────────────
    await prisma.notification.create({
      data: {
        title:   "Team Invitation Sent",
        message: `Invite sent to ${trimmedEmail} as ${role}.`,
        type:    "info",
        link:    "/users",
        ...(organisationId ? { organisationId } : {}),
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("[invite] Unexpected error:", err);
    return NextResponse.json(
      { error: "Failed to send invitation. Please try again." },
      { status: 500 }
    );
  }
}
