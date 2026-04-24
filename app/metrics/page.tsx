"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

function formatZAR(amount: number) {
  if (amount >= 1000000) return `R${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `R${(amount / 1000).toFixed(0)}K`;
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
  });
}

const bankColors: Record<string, string> = {
  FNB: "#006B3C",
  "Standard Bank": "#0033A0",
  Absa: "#DC0032",
  Nedbank: "#007B40",
  Capitec: "#007DC5",
};

const statusColors: Record<string, string> = {
  pending: "#2980B9",
  approved: "#27AE60",
  settled: "#D4A017",
  rejected: "#C0392B",
  scheduled: "#7C3AED",
  inprogress: "#E67E22",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-lg">
        <p className="text-xs font-bold text-gray-800">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-xs" style={{ color: p.color }}>
            {p.name}: {typeof p.value === "number" && p.value > 1000
              ? formatZAR(p.value)
              : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function MetricsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, [range]);

  async function fetchMetrics() {
    try {
      const res = await fetch(`/api/metrics?range=${range}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1117] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-[#1B4332] border-t-[#D4A017] animate-spin mx-auto mb-4" />
          <p className="text-white text-sm">Loading metrics...</p>
        </div>
      </div>
    );
  }

  const { summary, bankBreakdown, dailyVolumeData, statusBreakdown, hourlyDistribution, topDays } = data ?? {};

  return (
    <div className="min-h-screen bg-[#0F1117] text-white">

      {/* Header */}
      <div className="border-b border-[#1A2D3D] bg-[#0D1B13]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 min-w-[40px] rounded-full bg-[#D4A017] flex items-center justify-center font-bold text-[#1B4332] text-sm flex-shrink-0">
                OB
              </div>
              <div>
                <p className="font-bold text-lg text-white">OneBank TMS</p>
                <p className="text-xs text-[#A0AEC0]">Platform Analytics Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#27AE60] animate-pulse" />
                <span className="text-xs text-[#A0AEC0]">Live</span>
              </div>
              {lastUpdated && (
                <span className="hidden sm:inline text-xs text-[#718096]">
                  Updated {lastUpdated.toLocaleTimeString("en-ZA")}
                </span>
              )}
              {/* Range Selector */}
              <div className="flex gap-1">
                {[7, 30, 90].map((d) => (
                  <button
                    key={d}
                    onClick={() => setRange(d)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      range === d
                        ? "bg-[#1B4332] text-white"
                        : "bg-[#1A2D3D] text-[#A0AEC0] hover:bg-[#1B4332]"
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Hero Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Value Processed",
              value: formatZAR(summary?.allTimeTransactionValue ?? 0),
              sub: "All time",
              color: "#D4A017",
              bg: "#1A2D13",
            },
            {
              label: "Total Transactions",
              value: (summary?.allTimeTransactions ?? 0).toLocaleString(),
              sub: "All time",
              color: "#27AE60",
              bg: "#0D2B1F",
            },
            {
              label: "Total Payments",
              value: (summary?.allTimePayments ?? 0).toLocaleString(),
              sub: `Approval rate: ${(summary?.approvalRate ?? 0).toFixed(1)}%`,
              color: "#2980B9",
              bg: "#0D1F2B",
            },
            {
              label: "Avg Payment Size",
              value: formatZAR(summary?.avgPaymentSize ?? 0),
              sub: `${summary?.totalUsers ?? 0} active users`,
              color: "#7C3AED",
              bg: "#1A0D2B",
            },
          ].map(({ label, value, sub, color, bg }) => (
            <Card
              key={label}
              className="p-5 rounded-2xl border border-[#2D3748]"
              style={{ backgroundColor: bg }}
            >
              <p className="text-xs text-[#718096] mb-2">{label}</p>
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
              <p className="text-xs text-[#718096] mt-1">{sub}</p>
            </Card>
          ))}
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            {
              label: "Accounts Connected",
              value: summary?.totalAccountsConnected ?? 0,
              sub:   `across ${summary?.totalDistinctBanks ?? 0} bank${(summary?.totalDistinctBanks ?? 0) !== 1 ? "s" : ""}`,
            },
            { label: "Active Users",          value: summary?.totalUsers ?? 0,                          sub: null },
            { label: "Beneficiaries",          value: summary?.totalBeneficiaries ?? 0,                  sub: null },
            { label: `${range}d Transactions`, value: data?.period?.transactions ?? 0,                   sub: null },
            { label: `${range}d Payments`,     value: data?.period?.payments ?? 0,                       sub: null },
            { label: `${range}d Value`,        value: formatZAR(data?.period?.transactionValue ?? 0),    sub: null },
          ].map(({ label, value, sub }) => (
            <Card
              key={label}
              className="p-4 rounded-xl border border-[#2D3748] text-center"
              style={{ backgroundColor: "#1A1D27" }}
            >
              <p className="text-lg font-bold text-white">{value}</p>
              <p className="text-[10px] text-[#718096] mt-0.5">{label}</p>
              {sub && (
                <p className="text-[10px] text-[#4A9D6F] mt-0.5 font-medium">{sub}</p>
              )}
            </Card>
          ))}
        </div>

        {/* Daily Volume Chart */}
        <Card className="p-6 rounded-2xl border border-[#2D3748]" style={{ backgroundColor: "#1A1D27" }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white">
                Daily Transaction Volume
              </h3>
              <p className="text-xs text-[#718096]">Last {range} days</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dailyVolumeData}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#718096" }}
                tickFormatter={formatDate}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#718096" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => formatZAR(v)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#718096" }} />
              <Bar dataKey="value" name="Value (ZAR)" fill="#22C55E" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Bank Breakdown */}
          <Card className="p-6 rounded-2xl border border-[#2D3748]" style={{ backgroundColor: "#1A1D27" }}>
            <h3 className="text-base font-bold text-white mb-1">Volume by Bank</h3>
            <p className="text-xs text-[#718096] mb-5">Transaction count and value</p>
            <div className="space-y-3">
              {bankBreakdown?.map((bank: any) => {
                const total = bankBreakdown.reduce((s: number, b: any) => s + b.value, 0);
                const percent = total > 0 ? (bank.value / total * 100) : 0;
                const color = bankColors[bank.bank] ?? "#1B4332";
                return (
                  <div key={bank.bank}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-bold"
                          style={{ backgroundColor: color }}
                        >
                          {bank.bank.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-white">{bank.bank}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">{formatZAR(bank.value)}</p>
                        <p className="text-[10px] text-[#718096]">{bank.count} txns</p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-[#2D3748] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${percent}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Payment Status Breakdown */}
          <Card className="p-6 rounded-2xl border border-[#2D3748]" style={{ backgroundColor: "#1A1D27" }}>
            <h3 className="text-base font-bold text-white mb-1">Payment Status</h3>
            <p className="text-xs text-[#718096] mb-5">All-time breakdown</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="status"
                >
                  {statusBreakdown?.map((entry: any, index: number) => (
                    <Cell key={index} fill={statusColors[entry.status] ?? "#718096"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {statusBreakdown?.map((s: any) => (
                <div key={s.status} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: statusColors[s.status] ?? "#718096" }}
                  />
                  <span className="text-xs text-[#A0AEC0] capitalize">{s.status}</span>
                  <span className="text-xs font-bold text-white ml-auto">{s.count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Hourly Distribution */}
        <Card className="p-6 rounded-2xl border border-[#2D3748]" style={{ backgroundColor: "#1A1D27" }}>
          <h3 className="text-base font-bold text-white mb-1">Activity by Hour</h3>
          <p className="text-xs text-[#718096] mb-5">Peak usage periods (all time)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourlyDistribution} barCategoryGap="20%">
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: "#718096" }}
                axisLine={false}
                tickLine={false}
                interval={2}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "#718096" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Transactions" fill="#D4A017" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Days */}
        <Card className="p-6 rounded-2xl border border-[#2D3748]" style={{ backgroundColor: "#1A1D27" }}>
          <h3 className="text-base font-bold text-white mb-5">
            Top Performing Days
          </h3>
          <div className="space-y-3">
            {topDays?.map((day: any, index: number) => (
              <div
                key={day.date}
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ backgroundColor: "#0F1117" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold"
                    style={{
                      backgroundColor: index === 0 ? "#D4A017" : index === 1 ? "#718096" : "#4A5568",
                      color: "white",
                    }}
                  >
                    #{index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {new Date(day.date).toLocaleDateString("en-ZA", {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-[#718096]">
                      {day.transactions} transactions
                    </p>
                  </div>
                </div>
                <p className="text-sm font-bold text-[#D4A017]">
                  {formatZAR(day.value)}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center py-6 border-t border-[#2D3748]">
          <p className="text-xs text-[#718096]">
            OneBank TMS © 2026 — Platform Analytics Dashboard
          </p>
          <p className="text-xs text-[#4A5568] mt-1">
            Data refreshes every 60 seconds • All values in South African Rand (ZAR)
          </p>
        </div>
      </div>
    </div>
  );
}
