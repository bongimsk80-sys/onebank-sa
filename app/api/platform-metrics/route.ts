import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Token-gated — no NextAuth required.
// Caller must send:  Authorization: Bearer <PLATFORM_METRICS_TOKEN>
function validateToken(req: NextRequest): boolean {
  const token = process.env.PLATFORM_METRICS_TOKEN;
  if (!token) return false; // env var must be set
  const header = req.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  // Constant-time comparison to prevent timing attacks
  if (provided.length !== token.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) {
    diff |= provided.charCodeAt(i) ^ token.charCodeAt(i);
  }
  return diff === 0;
}

export async function GET(req: NextRequest) {
  if (!validateToken(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // ── All-time totals (cross-org, no filter) ──────────────────────────────
    const [
      totalOrgs,
      totalUsers,
      totalAccounts,
      totalBeneficiaries,
      allTransactions,
      allPayments,
      lgWaitlistCount,
    ] = await Promise.all([
      prisma.organisation.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.bankAccount.findMany({ select: { bank: true, balance: true } }),
      prisma.beneficiary.count(),
      prisma.transaction.findMany({ select: { amount: true, date: true, bank: true } }),
      prisma.payment.findMany({ select: { amount: true, status: true, date: true, bank: true } }),
      prisma.activityLog.count({ where: { action: "LG_WAITLIST_JOIN" } }),
    ]);

    // ── Derived totals ──────────────────────────────────────────────────────
    const gmv           = allTransactions.reduce((s, t) => s + Math.abs(t.amount), 0);
    const totalPaymentValue = allPayments.reduce((s, p) => s + p.amount, 0);
    const approvedOrSettled = allPayments.filter(
      (p) => p.status === "approved" || p.status === "settled"
    ).length;
    const approvalRate  = allPayments.length > 0
      ? (approvedOrSettled / allPayments.length) * 100
      : 0;
    const avgPaymentSize = allPayments.length > 0 ? totalPaymentValue / allPayments.length : 0;
    const distinctBanks  = new Set(totalAccounts.map((a) => a.bank)).size;
    const totalBalance   = totalAccounts.reduce((s, a) => s + a.balance, 0);

    // ── Monthly org registrations (last 12 months) ──────────────────────────
    const orgs = await prisma.organisation.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const monthlyOrgs: Record<string, number> = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyOrgs[key] = 0;
    }
    orgs.forEach((o) => {
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (key in monthlyOrgs) monthlyOrgs[key]++;
    });

    // ── Monthly GMV (last 12 months) ───────────────────────────────────────
    const monthlyGmv: Record<string, number> = {};
    for (const key of Object.keys(monthlyOrgs)) monthlyGmv[key] = 0;
    allTransactions.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (key in monthlyGmv) monthlyGmv[key] += Math.abs(t.amount);
    });

    // ── Monthly payments (last 12 months) ─────────────────────────────────
    const monthlyPayments: Record<string, number> = {};
    for (const key of Object.keys(monthlyOrgs)) monthlyPayments[key] = 0;
    allPayments.forEach((p) => {
      const d = new Date(p.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (key in monthlyPayments) monthlyPayments[key]++;
    });

    // Combine into monthly trend array
    const monthlyTrend = Object.keys(monthlyOrgs).map((key) => {
      const [year, month] = key.split("-");
      const label = new Date(Number(year), Number(month) - 1, 1)
        .toLocaleDateString("en-ZA", { month: "short", year: "2-digit" });
      return {
        month:    label,
        orgs:     monthlyOrgs[key],
        gmv:      monthlyGmv[key],
        payments: monthlyPayments[key],
      };
    });

    // ── MoM growth (last 2 complete months) ────────────────────────────────
    const trendKeys   = Object.keys(monthlyOrgs);
    const prevOrgCount = monthlyOrgs[trendKeys[trendKeys.length - 2]] ?? 0;
    const currOrgCount = monthlyOrgs[trendKeys[trendKeys.length - 1]] ?? 0;
    const orgGrowthPct = prevOrgCount > 0
      ? ((currOrgCount - prevOrgCount) / prevOrgCount) * 100
      : 0;

    const prevGmv = monthlyGmv[trendKeys[trendKeys.length - 2]] ?? 0;
    const currGmv = monthlyGmv[trendKeys[trendKeys.length - 1]] ?? 0;
    const gmvGrowthPct = prevGmv > 0 ? ((currGmv - prevGmv) / prevGmv) * 100 : 0;

    // ── Payment status breakdown ───────────────────────────────────────────
    const statusMap: Record<string, number> = {};
    allPayments.forEach((p) => {
      statusMap[p.status] = (statusMap[p.status] ?? 0) + 1;
    });

    // ── Bank distribution by transaction volume ────────────────────────────
    const bankMap: Record<string, { transactions: number; gmv: number }> = {};
    allTransactions.forEach((t) => {
      if (!bankMap[t.bank]) bankMap[t.bank] = { transactions: 0, gmv: 0 };
      bankMap[t.bank].transactions++;
      bankMap[t.bank].gmv += Math.abs(t.amount);
    });
    const bankDistribution = Object.entries(bankMap)
      .map(([bank, d]) => ({ bank, ...d }))
      .sort((a, b) => b.gmv - a.gmv);

    return NextResponse.json({
      summary: {
        totalOrgs,
        totalUsers,
        totalAccountsConnected: totalAccounts.length,
        distinctBanks,
        totalBalance,
        totalBeneficiaries,
        gmv,
        totalPayments:   allPayments.length,
        totalTransactions: allTransactions.length,
        approvalRate,
        avgPaymentSize,
        lgWaitlistCount,
        orgGrowthPct,
        gmvGrowthPct,
      },
      monthlyTrend,
      statusBreakdown: Object.entries(statusMap).map(([status, count]) => ({ status, count })),
      bankDistribution,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[platform-metrics] Error:", err);
    return NextResponse.json({ error: "Failed to fetch platform metrics" }, { status: 500 });
  }
}
