import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, resolveOrgId } from "@/lib/api-auth";
import { generateInviteToken, inviteTokenExpiry } from "@/lib/tokens";
import { sendTeamInviteEmail } from "@/lib/email";

// POST /api/users/resend-invite — admin only
// Regenerates the invite token and re-sends (or just returns the new link)
export async function POST(req: NextRequest) {
  const session = await requireRole(["admin"]);
  if (session instanceof NextResponse) return session;

  const { userId } = await req.json().catch(() => ({}));
  if (!userId) {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }

  const adminId = (session.user as any).id as string;
  const orgId   = await resolveOrgId(session);

  const admin = await prisma.user.findUnique({
    where: { id: adminId },
    select: { name: true, organisation: { select: { name: true } } },
  });

  // Scope target lookup to admin's org to prevent cross-org invite resend
  const target = await prisma.user.findFirst({
    where: { id: userId, ...(orgId ? { organisationId: orgId } : {}) },
    select: { email: true, role: true, isVerified: true, name: true },
  });

  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  if (target.isVerified) {
    return NextResponse.json(
      { error: "This user has already accepted their invitation." },
      { status: 409 }
    );
  }

  // Generate a fresh token (reset expiry to 7 days from now)
  const newToken = generateInviteToken();
  await prisma.user.update({
    where: { id: userId },
    data:  { inviteToken: newToken, inviteTokenExpiry: inviteTokenExpiry() },
  });

  const baseUrl    = process.env.NEXTAUTH_URL ?? "https://onebank-sa-iota.vercel.app";
  const inviteUrl  = `${baseUrl}/invite?token=${newToken}`;
  const orgName    = admin?.organisation?.name ?? "OneBank SA";
  const inviterName = admin?.name ?? "Your admin";

  // Attempt to send email (may be blocked if domain not verified, but try anyway)
  await sendTeamInviteEmail(target.email, inviterName, orgName, target.role, inviteUrl).catch(() => null);

  return NextResponse.json({ success: true, inviteUrl });
}
