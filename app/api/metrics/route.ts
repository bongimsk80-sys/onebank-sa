import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordDailySnapshot } from "@/lib/metrics";
import { requireAuth } from "@/lib/api-auth";

export async function GET(request: Request) {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") ?? "30";
    const days = parseInt(range);

    const since = new Date();
    since.setDate(since.getDate() - days);

    // All-time totals
    const allTransactions = await prisma.transaction.findMany();
    const allPayments = await prisma.payment.findMany();
    const allUsers = await prisma.user.count({ where: { isActive: true } });
    const allBeneficiaries = await prisma.beneficiary.count();
    const allAccounts = await prisma.bankAccount.findMany();

    // Period totals
    const periodTransactions = await prisma.transaction.findMany({
      where: { date: { gte: since } },
    });
    const periodPayments = await prisma.payment.findMany({
      where: { date: { gte: since } },
    });

    // All-time value
    const allTimeValue = allTransactions.reduce(
      (sum, t) => sum + Math.abs(t.amount), 0
    );
    const allTimePaymentValue = allPayments.reduce(
      (sum, p) => sum + p.amount, 0
    );

    // Period value
    const periodValue = periodTransactions.reduce(
      (sum, t) => sum + Math.abs(t.amount), 0
    );

    // Bank breakdown (all time)
    const bankMap: Record<string, { count: number; value: number; balance: number }> = {};
    allTransactions.forEach((t) => {
      if (!bankMap[t.bank]) bankMap[t.bank] = { count: 0, value: 0, balance: 0 };
      bankMap[t.bank].count++;
      bankMap[t.bank].value += Math.abs(t.amount);
    });
    allAccounts.forEach((a) => {
      if (!bankMap[a.bank]) bankMap[a.bank] = { count: 0, value: 0, balance: 0 };
      bankMap[a.bank].balance += a.balance;
    });
    const bankBreakdown = Object.entries(bankMap).map(([bank, data]) => ({
      bank,
      ...data,
    }));

    // Daily volume trend (last N days)
    const dailyTrend: Record<string, { transactions: number; value: number; payments: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      dailyTrend[key] = { transactions: 0, value: 0, payments: 0 };
    }
    periodTransactions.forEach((t) => {
      const key = new Date(t.date).toISOString().split("T")[0];
      if (dailyTrend[key]) {
        dailyTrend[key].transactions++;
        dailyTrend[key].value += Math.abs(t.amount);
      }
    });
    periodPayments.forEach((p) => {
      const key = new Date(p.date).toISOString().split("T")[0];
      if (dailyTrend[key]) {
        dailyTrend[key].payments++;
      }
    });
    const dailyVolumeData = Object.entries(dailyTrend).map(([date, data]) => ({
      date,
      ...data,
    }));

    // Payment status breakdown
    const statusMap: Record<string, number> = {};
    allPayments.forEach((p) => {
      statusMap[p.status] = (statusMap[p.status] ?? 0) + 1;
    });

    // Hourly distribution
    const hourMap: Record<number, number> = {};
    allTransactions.forEach((t) => {
      const hour = new Date(t.date).getHours();
      hourMap[hour] = (hourMap[hour] ?? 0) + 1;
    });
    const hourlyDistribution = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: `${String(i).padStart(2, "0")}:00`,
      count: hourMap[i] ?? 0,
    }));

    // Top performing days
    const dayMap: Record<string, { transactions: number; value: number }> = {};
    allTransactions.forEach((t) => {
      const key = new Date(t.date).toISOString().split("T")[0];
      if (!dayMap[key]) dayMap[key] = { transactions: 0, value: 0 };
      dayMap[key].transactions++;
      dayMap[key].value += Math.abs(t.amount);
    });
    const topDays = Object.entries(dayMap)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return NextResponse.json({
      summary: {
        allTimeTransactions: allTransactions.length,
        allTimeTransactionValue: allTimeValue,
        allTimePayments: allPayments.length,
        allTimePaymentValue: allTimePaymentValue,
        totalUsers: allUsers,
        totalBeneficiaries: allBeneficiaries,
        totalBanksConnected: allAccounts.length,
        avgPaymentSize: allPayments.length > 0 ? allTimePaymentValue / allPayments.length : 0,
        approvalRate: allPayments.length > 0
          ? ((statusMap["approved"] ?? 0) + (statusMap["settled"] ?? 0)) / allPayments.length * 100
          : 0,
      },
      period: {
        days,
        transactions: periodTransactions.length,
        transactionValue: periodValue,
        payments: periodPayments.length,
      },
      bankBreakdown,
      dailyVolumeData,
      statusBreakdown: Object.entries(statusMap).map(([status, count]) => ({ status, count })),
      hourlyDistribution,
      topDays,
    });
  } catch (error) {
    console.error("Metrics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}

export async function POST() {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;

  try {
    const result = await recordDailySnapshot();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to record snapshot" },
      { status: 500 }
    );
  }
}
