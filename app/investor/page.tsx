"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area,
} from "recharts";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000_000) return `R${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000)     return `R${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `R${(n / 1_000).toFixed(0)}K`;
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", minimumFractionDigits: 0 }).format(n);
}

function pct(n: number) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

const STATUS_COLORS: Record<string, string> = {
  pending:    "#2980B9",
  approved:   "#27AE60",
  settled:    "#D4A017",
  rejected:   "#C0392B",
  scheduled:  "#7C3AED",
  inprogress: "#E67E22",
};

const BANK_COLORS: Record<string, string> = {
  FNB:             "#006B3C",
  "Standard Bank": "#0033A0",
  Absa:            "#DC0032",
  Nedbank:         "#007B40",
  Capitec:         "#007DC5",
};

const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1A1D27] border border-[#2D3748] rounded-xl px-3 py-2 shadow-xl">
      <p className="text-xs font-bold text-white mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs" style={{ color: p.color ?? p.stroke }}>
          {p.name}: {typeof p.value === "number" && p.value > 999 ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

// ── Locked screen ─────────────────────────────────────────────────────────────

function Locked() {
  return (
    <div className="min-h-screen bg-[#0F1117] flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-[#1B4332] flex items-center justify-center mx-auto mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Restricted Access</h1>
        <p className="text-sm text-[#718096] leading-relaxed">
          This dashboard is for authorised investors and board members only.
          Please contact <a href="mailto:hello@onebank.co.za" className="text-[#D4A017] hover:underline">hello@onebank.co.za</a> to request access.
        </p>
      </div>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────

function InvestorDashboard({ token }: { token: string }) {
  const [data,        setData]        = useState<any>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/platform-metrics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { setError("unauthorized"); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
    } catch {
      setError("fetch_failed");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 120_000); // refresh every 2 min
    return () => clearInterval(t);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1117] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-[#1B4332] border-t-[#D4A017] animate-spin mx-auto mb-4" />
          <p className="text-white text-sm">Loading platform data…</p>
        </div>
      </div>
    );
  }

  if (error === "unauthorized") return <Locked />;

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0F1117] flex items-center justify-center">
        <p className="text-[#C0392B] text-sm">Failed to load data. Please try again.</p>
      </div>
    );
  }

  const { summary, monthlyTrend, statusBreakdown, bankDistribution } = data;

  const heroCards = [
    {
      label: "Gross Merchandise Value",
      value: fmt(summary.gmv),
      sub:   `${pct(summary.gmvGrowthPct)} vs last month`,
      grow:  summary.gmvGrowthPct >= 0,
      color: "#D4A017",
      bg:    "#1A1500",
    },
    {
      label: "Client Organisations",
      value: summary.totalOrgs.toLocaleString(),
      sub:   `${pct(summary.orgGrowthPct)} vs last month`,
      grow:  summary.orgGrowthPct >= 0,
      color: "#27AE60",
      bg:    "#0D2B1F",
    },
    {
      label: "Total Payments Processed",
      value: summary.totalPayments.toLocaleString(),
      sub:   `${summary.approvalRate.toFixed(1)}% approval rate`,
      grow:  true,
      color: "#2980B9",
      bg:    "#0D1F2B",
    },
    {
      label: "Platform Users",
      value: summary.totalUsers.toLocaleString(),
      sub:   `Across ${summary.totalOrgs} organisations`,
      grow:  true,
      color: "#7C3AED",
      bg:    "#1A0D2B",
    },
  ];

  const secondaryStats = [
    { label: "Total Balance on Platform",   value: fmt(summary.totalBalance)              },
    { label: "Avg Payment Size",            value: fmt(summary.avgPaymentSize)             },
    { label: "Bank Accounts Connected",     value: `${summary.totalAccountsConnected} · ${summary.distinctBanks} banks` },
    { label: "Registered Beneficiaries",    value: summary.totalBeneficiaries.toLocaleString() },
    { label: "Total Transactions Settled",  value: summary.totalTransactions.toLocaleString() },
    { label: "LG Waitlist Signups",         value: summary.lgWaitlistCount.toLocaleString() },
  ];

  return (
    <div className="min-h-screen bg-[#0F1117] text-white">

      {/* Header */}
      <div className="border-b border-[#1A2D3D] bg-[#0D1B13]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#D4A017] flex items-center justify-center font-bold text-[#1B4332] text-sm flex-shrink-0">
              OB
            </div>
            <div>
              <p className="font-bold text-lg text-white leading-tight">OneBank TMS</p>
              <p className="text-xs text-[#A0AEC0]">Investor Platform Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#27AE60] animate-pulse" />
              <span className="text-xs text-[#A0AEC0]">Live</span>
            </div>
            {lastUpdated && (
              <span className="hidden md:inline text-xs text-[#718096]">
                Updated {lastUpdated.toLocaleTimeString("en-ZA")}
              </span>
            )}
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-[#C0392B]/40 bg-[#C0392B]/10 text-[#FC8181]">
              CONFIDENTIAL
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Hero KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {heroCards.map(({ label, value, sub, grow, color, bg }) => (
            <div key={label} className="p-5 rounded-2xl border border-[#2D3748]" style={{ backgroundColor: bg }}>
              <p className="text-xs text-[#718096] mb-2">{label}</p>
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
              <p className={`text-xs mt-1.5 font-medium ${grow ? "text-[#27AE60]" : "text-[#C0392B]"}`}>
                {sub}
              </p>
            </div>
          ))}
        </div>

        {/* Secondary stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {secondaryStats.map(({ label, value }) => (
            <div key={label} className="p-4 rounded-xl border border-[#2D3748] text-center" style={{ backgroundColor: "#1A1D27" }}>
              <p className="text-base font-bold text-white">{value}</p>
              <p className="text-[10px] text-[#718096] mt-0.5 leading-tight">{label}</p>
            </div>
          ))}
        </div>

        {/* GMV + Org growth chart */}
        <div className="p-6 rounded-2xl border border-[#2D3748]" style={{ backgroundColor: "#1A1D27" }}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white">GMV & Organisation Growth</h3>
              <p className="text-xs text-[#718096] mt-0.5">Last 12 months — gross transaction value vs new client registrations</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#D4A017" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#D4A017" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="orgGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#27AE60" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#27AE60" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#718096" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="gmv"  orientation="left"  tick={{ fontSize: 10, fill: "#718096" }} axisLine={false} tickLine={false} tickFormatter={(v) => fmt(v)} />
              <YAxis yAxisId="orgs" orientation="right" tick={{ fontSize: 10, fill: "#718096" }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#718096" }} />
              <Area yAxisId="gmv"  type="monotone" dataKey="gmv"  name="GMV (ZAR)"  stroke="#D4A017" fill="url(#gmvGrad)" strokeWidth={2} dot={false} />
              <Area yAxisId="orgs" type="monotone" dataKey="orgs" name="New Orgs"   stroke="#27AE60" fill="url(#orgGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Payment volume + status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Monthly payments bar */}
          <div className="p-6 rounded-2xl border border-[#2D3748]" style={{ backgroundColor: "#1A1D27" }}>
            <h3 className="text-base font-bold text-white mb-1">Monthly Payment Volume</h3>
            <p className="text-xs text-[#718096] mb-5">Count of payments processed per month</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyTrend} barCategoryGap="35%">
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#718096" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#718096" }} axisLine={false} tickLine={false} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="payments" name="Payments" fill="#2980B9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Payment status donut */}
          <div className="p-6 rounded-2xl border border-[#2D3748]" style={{ backgroundColor: "#1A1D27" }}>
            <h3 className="text-base font-bold text-white mb-1">Payment Status Breakdown</h3>
            <p className="text-xs text-[#718096] mb-4">All-time across all organisations</p>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={statusBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="count" nameKey="status">
                  {statusBreakdown?.map((e: any, i: number) => (
                    <Cell key={i} fill={STATUS_COLORS[e.status] ?? "#718096"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
              {statusBreakdown?.map((s: any) => (
                <div key={s.status} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[s.status] ?? "#718096" }} />
                  <span className="text-xs text-[#A0AEC0] capitalize">{s.status}</span>
                  <span className="text-xs font-bold text-white ml-auto">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bank distribution */}
        <div className="p-6 rounded-2xl border border-[#2D3748]" style={{ backgroundColor: "#1A1D27" }}>
          <h3 className="text-base font-bold text-white mb-1">Volume Distribution by Bank</h3>
          <p className="text-xs text-[#718096] mb-6">GMV and transaction count routed through each bank — all organisations</p>
          <div className="space-y-4">
            {bankDistribution?.map((bank: any) => {
              const total   = bankDistribution.reduce((s: number, b: any) => s + b.gmv, 0);
              const percent = total > 0 ? (bank.gmv / total) * 100 : 0;
              const color   = BANK_COLORS[bank.bank] ?? "#1B4332";
              return (
                <div key={bank.bank}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: color }}>
                        {bank.bank.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-white">{bank.bank}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">{fmt(bank.gmv)}</p>
                      <p className="text-[10px] text-[#718096]">{bank.transactions} transactions · {percent.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-[#2D3748] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${percent}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
            {(!bankDistribution || bankDistribution.length === 0) && (
              <p className="text-xs text-[#718096] text-center py-4">No transaction data yet</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6 border-t border-[#2D3748]">
          <p className="text-xs text-[#718096]">
            OneBank TMS © 2026 — Investor Platform Dashboard
          </p>
          <p className="text-xs text-[#4A5568] mt-1">
            All figures in South African Rand (ZAR) · Refreshes every 2 minutes · Confidential — do not distribute
          </p>
          {data.generatedAt && (
            <p className="text-xs text-[#4A5568] mt-1">
              Data as at {new Date(data.generatedAt).toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" })} SAST
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Route entry (Suspense boundary for useSearchParams) ───────────────────────

function InvestorPageInner() {
  const params = useSearchParams();
  const token  = params.get("token") ?? "";
  if (!token) return <Locked />;
  return <InvestorDashboard token={token} />;
}

export default function InvestorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F1117] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-[#1B4332] border-t-[#D4A017] animate-spin" />
      </div>
    }>
      <InvestorPageInner />
    </Suspense>
  );
}
