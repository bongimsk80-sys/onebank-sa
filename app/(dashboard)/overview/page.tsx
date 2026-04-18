"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSessionStore } from "@/store/session-store";
import {
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  CheckCircle,
  Upload,
  Landmark,
  Clock,
  CheckSquare,
  XCircle,
  TrendingUp,
  Calendar,
} from "lucide-react";
import BetaBanner from "@/components/shared/beta-banner";

function formatZAR(amount: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
  }).format(amount);
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning 👋";
  if (hour < 17) return "Good afternoon 👋";
  return "Good evening 👋";
}

const pendingIcons: Record<string, React.ReactNode> = {
  refresh: <RefreshCw size={16} />,
  check: <CheckCircle size={16} />,
  upload: <Upload size={16} />,
  bank: <Landmark size={16} />,
};

export default function OverviewPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { name, orgName } = useSessionStore();
  const [visibleWidgets, setVisibleWidgets] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("onebank_overview_widgets");
      if (saved) {
        const parsed = JSON.parse(saved);
        const visible = parsed
          .filter((w: { id: string; visible: boolean }) => w.visible)
          .map((w: { id: string; visible: boolean }) => w.id);
        setVisibleWidgets(visible);
      } else {
        setVisibleWidgets([
          "totalBalance",
          "bankAccounts",
          "paymentsSummary",
          "recentTransactions",
          "pendingApprovals",
        ]);
      }
    } catch {
      setVisibleWidgets([
        "totalBalance",
        "bankAccounts",
        "paymentsSummary",
        "recentTransactions",
        "pendingApprovals",
      ]);
    }
  }, []);

  function isVisible(id: string) {
    if (visibleWidgets.length === 0) return true;
    return visibleWidgets.includes(id);
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const [accountsRes, transactionsRes, paymentsRes] = await Promise.all([
          fetch("/api/accounts"),
          fetch("/api/transactions"),
          fetch("/api/payments"),
        ]);
        if (!accountsRes.ok) throw new Error(`Accounts: HTTP ${accountsRes.status}`);
        if (!transactionsRes.ok) throw new Error(`Transactions: HTTP ${transactionsRes.status}`);
        if (!paymentsRes.ok) throw new Error(`Payments: HTTP ${paymentsRes.status}`);
        const accountsData = await accountsRes.json();
        const transactionsData = await transactionsRes.json();
        const paymentsData = await paymentsRes.json();
        setAccounts(accountsData.accounts ?? []);
        setTransactions(transactionsData.transactions ?? []);
        setPayments(paymentsData.payments ?? []);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalBalance = accounts.reduce(
    (sum: number, acc: any) => sum + acc.balance,
    0
  );

  const paymentsSummary = {
    pending: payments.filter((p: any) => p.status === "pending").length,
    approved: payments.filter((p: any) => p.status === "approved").length,
    settled: payments.filter((p: any) => p.status === "settled").length,
    rejected: payments.filter((p: any) => p.status === "rejected").length,
    scheduled: payments.filter((p: any) => p.status === "scheduled").length,
  };

  const pendingItems = [
    {
      label: "Reviewer pending",
      count: payments.filter((p: any) => p.status === "pending").length,
      icon: "refresh",
    },
    {
      label: "Approver pending",
      count: payments.filter((p: any) => p.status === "approved").length,
      icon: "check",
    },
    {
      label: "Executor pending",
      count: payments.filter((p: any) => p.status === "inprogress").length,
      icon: "upload",
    },
    {
      label: "Bank rejected",
      count: payments.filter((p: any) => p.status === "rejected").length,
      icon: "bank",
    },
  ];

  const recentTransactions = transactions.slice(0, 5);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 bg-[#E2E8F0] rounded-xl w-48" />
        <div className="h-36 bg-[#E2E8F0] rounded-2xl" />
        <div className="h-48 bg-[#E2E8F0] rounded-xl" />
        <div className="h-48 bg-[#E2E8F0] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* H4: Simulation mode banner */}
      <BetaBanner message="Beta — Simulation Mode: All data is for demonstration. No real bank connections or fund transfers are active." />

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#1A202C]">
          {getGreeting()}, {(name?.split(" ")[0]) || "there"}
        </h2>
        <p className="text-sm text-[#718096]">
          {orgName ? (
            <>
              <span className="font-semibold text-[#1B4332]">{orgName}</span>
              {" · "}
            </>
          ) : null}
          Cash performance overview
        </p>
      </div>

      {/* Total Balance Card */}
      {isVisible("totalBalance") && (
      <Card className="bg-[#1B4332] text-white p-6 rounded-2xl border-0 shadow-lg">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs uppercase tracking-widest text-[#A0C4B1]">
            Total Balance
          </p>
          <Badge className="bg-[#D4A017] text-[#1B4332] text-[10px] font-bold border-0 px-2">
            ● BETA
          </Badge>
        </div>
        <p className="text-3xl font-bold mt-1">{formatZAR(totalBalance)}</p>
        <p className="text-xs text-[#A0C4B1] mt-1">
          Across {accounts.length} bank accounts
        </p>
      </Card>
      )}

      {/* Bank Accounts */}
      {isVisible("bankAccounts") && (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#1A202C]">Bank Accounts</h3>
          <button className="text-xs text-[#1B4332] font-semibold flex items-center gap-1">
            See all <ArrowUpRight size={12} />
          </button>
        </div>
        <div className="space-y-2">
          {accounts.map((account: any) => (
            <Card
              key={account.id}
              className="p-4 rounded-xl border shadow-sm"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border)",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: account.color }}
                  >
                    {account.bank.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1A202C]">
                      {account.bank}
                    </p>
                    <p className="text-xs text-[#718096]">
                      {account.accountType}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-bold text-[#1A202C]">
                  {formatZAR(account.balance)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>      )}
      {/* Payments Summary */}
      {isVisible("paymentsSummary") && (
      <div>
        <h3 className="text-sm font-bold text-[#1A202C] mb-3">
          Payments Summary
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "Pending",
              value: paymentsSummary.pending,
              icon: <Clock size={20} />,
              bg: "#EFF6FF",
              color: "#2980B9",
            },
            {
              label: "Approved",
              value: paymentsSummary.approved,
              icon: <CheckSquare size={20} />,
              bg: "#F0FDF4",
              color: "#27AE60",
            },
            {
              label: "Settled",
              value: paymentsSummary.settled,
              icon: <TrendingUp size={20} />,
              bg: "#FFF7ED",
              color: "#E67E22",
            },
            {
              label: "Rejected",
              value: paymentsSummary.rejected,
              icon: <XCircle size={20} />,
              bg: "#FFF1F2",
              color: "#C0392B",
            },
            {
              label: "Scheduled",
              value: paymentsSummary.scheduled,
              icon: <Calendar size={20} />,
              bg: "#F5F3FF",
              color: "#7C3AED",
            },
          ].map(({ label, value, icon, bg, color }, index, arr) => {
            const isOrphan = index === arr.length - 1 && arr.length % 2 !== 0;
            return (
              <Card
                key={label}
                className={`p-4 rounded-xl border shadow-sm${isOrphan ? " col-span-2 max-w-[calc(50%-6px)]" : ""}`}
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border)",
                }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center mb-2"
                  style={{ backgroundColor: bg, color }}
                >
                  {icon}
                </div>
                <p className="text-2xl font-bold text-[#1A202C]">
                  {String(value).padStart(2, "0")}
                </p>
                <p className="text-xs text-[#718096] mt-0.5">{label}</p>
              </Card>
            );
          })}
        </div>
      </div>
      )}

      {/* Payments Pending */}
      {isVisible("pendingApprovals") && (
      <div>
        <h3 className="text-sm font-bold text-[#1A202C] mb-3">
          Payments Pending
        </h3>
        <Card
          className="rounded-xl border shadow-sm divide-y"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          {pendingItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-3 text-[#1B4332]">
                {pendingIcons[item.icon]}
                <span className="text-sm text-[#1A202C]">{item.label}</span>
              </div>
              <span className="text-sm font-bold text-[#1A202C]">
                {String(item.count).padStart(2, "0")}
              </span>
            </div>
          ))}
        </Card>
      </div>      )}
      {/* Recent Transactions */}
      {isVisible("recentTransactions") && (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#1A202C]">
            Recent Transactions
          </h3>
          <button className="text-xs text-[#1B4332] font-semibold flex items-center gap-1">
            See all <ArrowUpRight size={12} />
          </button>
        </div>
        <Card
          className="rounded-xl border shadow-sm divide-y"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          {recentTransactions.map((tx: any) => (
            <div
              key={tx.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#F4F6F8] flex items-center justify-center">
                  {tx.amount > 0 ? (
                    <ArrowDownRight size={16} className="text-[#27AE60]" />
                  ) : (
                    <ArrowUpRight size={16} className="text-[#C0392B]" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1A202C]">
                    {tx.name}
                  </p>
                  <p className="text-xs text-[#718096]">
                    {tx.type} · {tx.bank}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`text-sm font-bold ${
                    tx.amount > 0 ? "text-[#27AE60]" : "text-[#C0392B]"
                  }`}
                >
                  {tx.amount > 0 ? "+" : ""}
                  {formatZAR(tx.amount)}
                </p>
                <p className="text-xs text-[#718096]">
                  {new Date(tx.date).toLocaleDateString("en-ZA", {
                    day: "2-digit",
                    month: "short",
                  })}
                </p>
              </div>
            </div>
          ))}
        </Card>
      </div>      )}    </div>
  );
}