import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [accounts, payments, transactions] = await Promise.all([
      prisma.bankAccount.findMany({ where: { isActive: true } }),
      prisma.payment.findMany(),
      prisma.transaction.findMany(),
    ]);

    // Bank balances
    const bankBalances = accounts.map((a) => ({
      name: a.bank,
      value: a.balance,
      color:
        a.bank === "FNB" ? "#006B3C"
        : a.bank === "Standard Bank" ? "#0033A0"
        : a.bank === "Absa" ? "#DC0032"
        : a.bank === "Nedbank" ? "#007B40"
        : "#007DC5",
      payments: payments.filter((p) => p.bank === a.bank).length,
    }));

    // Payment status breakdown
    const statusBreakdown = [
      { name: "Pending", value: payments.filter((p) => p.status === "pending").length, color: "#2980B9" },
      { name: "Approved", value: payments.filter((p) => p.status === "approved").length, color: "#27AE60" },
      { name: "Settled", value: payments.filter((p) => p.status === "settled").length, color: "#E67E22" },
      { name: "Rejected", value: payments.filter((p) => p.status === "rejected").length, color: "#C0392B" },
      { name: "Scheduled", value: payments.filter((p) => p.status === "scheduled").length, color: "#7C3AED" },
    ];

    // Monthly cash flow
    const monthlyFlow = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      const month = date.toLocaleDateString("en-ZA", { month: "short" });
      const year = date.getFullYear();
      const monthNum = date.getMonth();

      const monthTransactions = transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() === monthNum && d.getFullYear() === year;
      });

      // If no real data, use mock data for demo purposes
      const mockCredits = [320000, 280000, 450000, 380000, 410000, 520000];
      const mockDebits = [180000, 210000, 290000, 220000, 260000, 310000];

      const realCredits = monthTransactions
        .filter((t) => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);

      const realDebits = monthTransactions
        .filter((t) => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      return {
        month,
        credits: realCredits > 0 ? realCredits : mockCredits[i],
        debits: realDebits > 0 ? realDebits : mockDebits[i],
  };
});

    // Payment category breakdown
    const categoryBreakdown = [
      {
        name: "Utilities",
        value: payments
          .filter((p) =>
            ["Eskom Holdings", "Telkom SA", "MTN Business"].includes(p.beneficiary)
          )
          .reduce((sum, p) => sum + p.amount, 0),
        color: "#2980B9",
      },
      {
        name: "Suppliers",
        value: payments
          .filter((p) =>
            ["BuildRight Suppliers", "Sasol Limited"].includes(p.beneficiary)
          )
          .reduce((sum, p) => sum + p.amount, 0),
        color: "#1B4332",
      },
      {
        name: "Government",
        value: payments
          .filter((p) =>
            ["SARS", "City of Joburg"].includes(p.beneficiary)
          )
          .reduce((sum, p) => sum + p.amount, 0),
        color: "#D4A017",
      },
      {
        name: "International",
        value: payments
          .filter((p) => p.type === "international")
          .reduce((sum, p) => sum + p.amount, 0),
        color: "#7C3AED",
      },
    ];

    // Summary stats
    const totalPaymentsValue = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalCredits = transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const totalDebits = transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

    return NextResponse.json({
      bankBalances,
      statusBreakdown,
      monthlyFlow,
      categoryBreakdown,
      summary: {
        totalBalance,
        totalPaymentsValue,
        totalCredits,
        totalDebits,
        totalPayments: payments.length,
        totalTransactions: transactions.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}