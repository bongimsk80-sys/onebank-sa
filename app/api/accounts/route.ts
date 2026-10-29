import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole, resolveOrgId, requireMfa } from "@/lib/api-auth";
import { z } from "zod";

// ── Plan-based account limits ───────────────────────────────────────────────
const PLAN_LIMITS: Record<string, number> = {
  beta:       10,
  starter:     5,
  growth:     25,
  enterprise: Infinity,
};

function limitForPlan(plan: string): number {
  return PLAN_LIMITS[plan] ?? 10; // safe default
}

const CreateAccountSchema = z.object({
  bank:          z.string().min(1).max(100),
  accountNumber: z.string().min(1).max(50),
  accountType:   z.string().min(1).max(50),
  balance:       z.number().min(0).max(1_000_000_000).optional(),
  color:         z.string().min(1).max(20),
});

export async function GET() {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;
  const orgId = await resolveOrgId(session);
  if (!orgId) return NextResponse.json({ error: "No organisation associated with your account." }, { status: 403 });

  try {
    const [accounts, org] = await Promise.all([
      prisma.bankAccount.findMany({
        where:   { organisationId: orgId },
        orderBy: { bank: "asc" },
      }),
      orgId
        ? prisma.organisation.findUnique({ where: { id: orgId }, select: { plan: true } })
        : null,
    ]);

    const plan  = org?.plan ?? "beta";
    const limit = limitForPlan(plan);
    const count = accounts.length;

    return NextResponse.json({ accounts, count, limit, plan });
  } catch {
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await requireRole(["admin"]);
  if (session instanceof NextResponse) return session;
  const mfa = await requireMfa(session);
  if (mfa) return mfa;
  const orgId = await resolveOrgId(session);
  if (!orgId) return NextResponse.json({ error: "No organisation associated with your account." }, { status: 403 });

  try {
    const body   = await request.json();
    const result = CreateAccountSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    // ── Plan limit check ──────────────────────────────────────────────────
    if (orgId) {
      const [count, org] = await Promise.all([
        prisma.bankAccount.count({ where: { organisationId: orgId } }),
        prisma.organisation.findUnique({ where: { id: orgId }, select: { plan: true } }),
      ]);

      const limit = limitForPlan(org?.plan ?? "beta");
      if (count >= limit) {
        return NextResponse.json(
          {
            error:     `Account limit reached`,
            detail:    `Your ${org?.plan ?? "beta"} plan allows up to ${limit} bank accounts. Please contact us to upgrade.`,
            limitHit:  true,
            count,
            limit,
          },
          { status: 403 }
        );
      }
    }

    const data = result.data;

    try {
      const account = await prisma.bankAccount.create({
        data: {
          bank:          data.bank,
          accountNumber: data.accountNumber,
          accountType:   data.accountType,
          balance:       data.balance ?? 0,
          currency:      "ZAR",
          color:         data.color,
          isActive:      true,
          organisationId: orgId,
        },
      });
      return NextResponse.json({ account }, { status: 201 });
    } catch (err: any) {
      // Unique constraint: same account number already exists at this bank for this org
      if (err?.code === "P2002") {
        return NextResponse.json(
          { error: "This account number is already connected to your organisation." },
          { status: 409 }
        );
      }
      throw err;
    }
  } catch {
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
