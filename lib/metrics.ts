import { prisma } from "@/lib/prisma";

export async function recordDailySnapshot() {
  try {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    // Fetch all data for today
    const [transactions, payments, users, beneficiaries, accounts] = await Promise.all([
      prisma.transaction.findMany({
        where: { date: { gte: startOfDay } },
      }),
      prisma.payment.findMany({
        where: { date: { gte: startOfDay } },
      }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.beneficiary.count({ where: { status: "active" } }),
      prisma.bankAccount.findMany(),
    ]);

    // Bank breakdown
    const bankMap: Record<string, { count: number; value: number }> = {};
    transactions.forEach((t) => {
      if (!bankMap[t.bank]) bankMap[t.bank] = { count: 0, value: 0 };
      bankMap[t.bank].count++;
      bankMap[t.bank].value += Math.abs(t.amount);
    });
    const bankBreakdown = Object.entries(bankMap).map(([bank, data]) => ({
      bank,
      ...data,
    }));

    // Status breakdown
    const statusMap: Record<string, number> = {};
    payments.forEach((p) => {
      statusMap[p.status] = (statusMap[p.status] ?? 0) + 1;
    });
    const statusBreakdown = Object.entries(statusMap).map(([status, count]) => ({
      status,
      count,
    }));

    // Total values
    const totalTransactionValue = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalPaymentValue = payments.reduce((sum, p) => sum + p.amount, 0);
    const avgPaymentSize = payments.length > 0 ? totalPaymentValue / payments.length : 0;

    // Peak hour
    const hourMap: Record<number, number> = {};
    transactions.forEach((t) => {
      const hour = new Date(t.date).getHours();
      hourMap[hour] = (hourMap[hour] ?? 0) + 1;
    });
    const peakHour = Object.entries(hourMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    // Save snapshot
    await prisma.platformMetric.create({
      data: {
        metricType: "daily_snapshot",
        totalTransactions: transactions.length,
        totalTransactionValue,
        totalPayments: payments.length,
        totalPaymentValue,
        totalUsers: users,
        totalBeneficiaries: beneficiaries,
        bankBreakdown: JSON.stringify(bankBreakdown),
        statusBreakdown: JSON.stringify(statusBreakdown),
        avgPaymentSize,
        peakHour: peakHour ? Number(peakHour) : null,
        approvedPayments: statusMap["approved"] ?? 0,
        rejectedPayments: statusMap["rejected"] ?? 0,
        settledPayments: statusMap["settled"] ?? 0,
        pendingPayments: statusMap["pending"] ?? 0,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to record daily snapshot:", error);
    return { success: false };
  }
}

export async function recordRealTimeMetric(event: {
  type: "payment" | "transaction";
  amount: number;
  bank: string;
  status?: string;
}) {
  try {
    await prisma.platformMetric.create({
      data: {
        metricType: `realtime_${event.type}`,
        totalTransactions: event.type === "transaction" ? 1 : 0,
        totalTransactionValue: event.type === "transaction" ? Math.abs(event.amount) : 0,
        totalPayments: event.type === "payment" ? 1 : 0,
        totalPaymentValue: event.type === "payment" ? event.amount : 0,
        bankBreakdown: JSON.stringify([{ bank: event.bank, count: 1, value: Math.abs(event.amount) }]),
        statusBreakdown: event.status
          ? JSON.stringify([{ status: event.status, count: 1 }])
          : "[]",
        approvedPayments: event.status === "approved" ? 1 : 0,
        rejectedPayments: event.status === "rejected" ? 1 : 0,
        settledPayments: event.status === "settled" ? 1 : 0,
        pendingPayments: event.status === "pending" ? 1 : 0,
      },
    });
  } catch (error) {
    console.error("Failed to record real-time metric:", error);
  }
}
