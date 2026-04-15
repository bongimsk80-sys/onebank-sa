import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getOrgId } from "@/lib/api-auth";
import { z } from "zod";
import { generateInviteToken } from "@/lib/tokens";
import { sendTeamInviteEmail } from "@/lib/email";

const BankEntrySchema = z.object({
  bank: z.string().min(1).max(100),
  accountNumber: z.string().min(1).max(50),
  accountType: z.string().min(1).max(50).optional(),
  color: z.string().min(1).max(20).optional(),
});

const InviteEntrySchema = z.object({
  email: z.string().email(),
  role: z.string().min(1).max(50),
});

const BodySchema = z.object({
  banks: z.array(BankEntrySchema).optional().default([]),
  invites: z.array(InviteEntrySchema).optional().default([]),
});

const BANK_COLORS: Record<string, string> = {
  "FNB":            "#006B3C",
  "Standard Bank":  "#0033A0",
  "Absa":           "#DC0032",
  "Nedbank":        "#007B40",
  "Capitec":        "#007DC5",
};

const BANK_TYPES: Record<string, string> = {
  "FNB":            "Current",
  "Standard Bank":  "Current",
  "Absa":           "Current",
  "Nedbank":        "Current",
  "Capitec":        "Savings",
};

export async function PATCH(request: Request) {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;

  const userId   = (session.user as any).id as string;
  const orgId    = getOrgId(session);
  const orgName  = (session.user as any).orgName as string | null;
  const userName = (session.user as any).name  as string;

  try {
    const body   = await request.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { banks, invites } = parsed.data;

    // ── 1. Create bank accounts ───────────────────────────────────────────────
    if (banks.length > 0) {
      await prisma.bankAccount.createMany({
        data: banks.map((b) => ({
          bank:          b.bank,
          accountNumber: b.accountNumber,
          accountType:   b.accountType ?? BANK_TYPES[b.bank] ?? "Current",
          balance:       0,
          currency:      "ZAR",
          color:         b.color ?? BANK_COLORS[b.bank] ?? "#1B4332",
          isActive:      true,
          ...(orgId ? { organisationId: orgId } : {}),
        })),
        skipDuplicates: true,
      });
    }

    // ── 2. Send team invites ──────────────────────────────────────────────────
    const inviteResults: { email: string; status: "sent" | "exists" }[] = [];

    for (const inv of invites) {
      const existing = await prisma.user.findUnique({
        where: { email: inv.email },
      });
      if (existing) {
        inviteResults.push({ email: inv.email, status: "exists" });
        continue;
      }

      const inviteToken = generateInviteToken();
      await prisma.user.create({
        data: {
          name:        inv.email.split("@")[0],
          email:       inv.email,
          password:    "",
          role:        inv.role,
          isActive:    false,
          isVerified:  false,
          inviteToken,
          ...(orgId ? { organisationId: orgId } : {}),
        },
      });

      const inviteUrl = `${process.env.NEXTAUTH_URL ?? ""}/invite?token=${inviteToken}`;
      await sendTeamInviteEmail(
        inv.email,
        userName,
        orgName ?? "OneBank SA",
        inv.role,
        inviteUrl
      );

      inviteResults.push({ email: inv.email, status: "sent" });
    }

    // ── 3. Mark user as having completed onboarding ───────────────────────────
    await prisma.user.update({
      where: { id: userId },
      data:  { hasCompletedOnboarding: true },
    });

    return NextResponse.json({
      success: true,
      accountsCreated: banks.length,
      inviteResults,
    });
  } catch (error) {
    console.error("complete-onboarding error:", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
