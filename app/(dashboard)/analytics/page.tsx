"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import ExportButton from "@/components/shared/export-button";
import {
  exportAnalyticsPDF,
  exportAnalyticsExcel,
  exportByBankPDF,
  exportByBankExcel,
  exportByStatusPDF,
  exportByStatusExcel,
  exportByCategoryPDF,
  exportByCategoryExcel,
  exportCashFlowPDF,
  exportCashFlowExcel,
} from "@/lib/export";

function formatZAR(amount: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

const viewFilters = ["By Bank", "By Status", "By Category", "Cash Flow"];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 shadow-lg">
        <p className="text-xs font-bold text-[#1A202C]">{payload[0].name}</p>
        <p className="text-xs text-[#718096]">
          {payload[0].value > 100
            ? formatZAR(payload[0].value)
            : payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [activeView, setActiveView] = useState("By Bank");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pieChartRef = useRef<HTMLDivElement>(null);
  const barChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/analytics");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
        <div className="h-10 bg-[#E2E8F0] rounded-xl" />
        <div className="h-64 bg-[#E2E8F0] rounded-xl" />
        <div className="h-48 bg-[#E2E8F0] rounded-xl" />
      </div>
    );
  }

  const pieData =
    activeView === "By Bank" ? data?.bankBalances :
    activeView === "By Status" ? data?.statusBreakdown :
    data?.categoryBreakdown;

  const total = pieData?.reduce((sum: number, d: any) => sum + d.value, 0) ?? 0;

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Total Balance", value: formatZAR(data?.summary?.totalBalance ?? 0), color: "#1B4332" },
          { label: "Total Payments", value: data?.summary?.totalPayments ?? 0, color: "#D4A017" },
          { label: "Total Credits", value: formatZAR(data?.summary?.totalCredits ?? 0), color: "#27AE60" },
          { label: "Total Debits", value: formatZAR(data?.summary?.totalDebits ?? 0), color: "#C0392B" },
        ].map(({ label, value, color }) => (
          <Card
            key={label}
            className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-sm"
          >
            <p className="text-xs text-[#718096] mb-1">{label}</p>
            <p className="text-base font-bold" style={{ color }}>
              {value}
            </p>
          </Card>
        ))}
      </div>

      {/* Export */}
<div className="flex justify-end">
  <ExportButton
    onExportPDF={async () => {
      const chartRef = activeView === "Cash Flow" ? barChartRef : pieChartRef;
      if (activeView === "By Bank") await exportByBankPDF(data?.bankBalances ?? [], chartRef.current);
      else if (activeView === "By Status") await exportByStatusPDF(data?.statusBreakdown ?? [], chartRef.current);
      else if (activeView === "By Category") await exportByCategoryPDF(data?.categoryBreakdown ?? [], chartRef.current);
      else if (activeView === "Cash Flow") await exportCashFlowPDF(data?.monthlyFlow ?? [], chartRef.current);
    }}
    onExportExcel={() => {
      if (activeView === "By Bank") exportByBankExcel(data?.bankBalances ?? []);
      else if (activeView === "By Status") exportByStatusExcel(data?.statusBreakdown ?? []);
      else if (activeView === "By Category") exportByCategoryExcel(data?.categoryBreakdown ?? []);
      else if (activeView === "Cash Flow") exportCashFlowExcel(data?.monthlyFlow ?? []);
    }}
    label={`Export ${activeView}`}
  />
</div>

      {/* View Filter */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {viewFilters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveView(f)}
            className={`py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeView === f
                ? "bg-[#1B4332] text-white"
                : "bg-white text-[#718096] border border-[#E2E8F0]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Pie Chart */}
      {activeView !== "Cash Flow" && (
        <Card ref={pieChartRef} className="p-5 rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
          <h3 className="text-sm font-bold text-[#1A202C] mb-4">
            {activeView === "By Bank" ? "Balance by Bank" :
             activeView === "By Status" ? "Payments by Status" :
             "Payments by Category"}
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData?.map((entry: any, index: number) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="text-center mb-4">
            <p className="text-xs text-[#718096]">Total</p>
            <p className="text-lg font-bold text-[#1A202C]">
              {total > 100 ? formatZAR(total) : total}
            </p>
          </div>

          <div className="space-y-2">
            {pieData?.map((item: any, i: number) => (
              <div key={`${item.name}-${i}`} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-[#1A202C]">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-[#1A202C]">
                    {item.value > 100 ? formatZAR(item.value) : item.value}
                  </span>
                  {total > 0 && (
                    <span className="text-xs text-[#A0AEC0] ml-2">
                      {((item.value / total) * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Cash Flow Bar Chart */}
      {activeView === "Cash Flow" && (
        <Card ref={barChartRef} className="p-5 rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
          <h3 className="text-sm font-bold text-[#1A202C] mb-1">
            Cash Flow — Last 6 Months
          </h3>
          <p className="text-xs text-[#718096] mb-4">Credits vs Debits (ZAR)</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data?.monthlyFlow} barCategoryGap="30%" barGap={4}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#718096" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#A0AEC0" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#718096" }} />
              <Bar dataKey="credits" name="Credits" fill="#1B4332" radius={[4, 4, 0, 0]} />
              <Bar dataKey="debits" name="Debits" fill="#D4A017" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <Card className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F0FDF4]">
              <p className="text-xs text-[#718096]">Total Credits</p>
              <p className="text-base font-bold text-[#27AE60]">
                {formatZAR(data?.monthlyFlow?.reduce((s: number, d: any) => s + d.credits, 0) ?? 0)}
              </p>
            </Card>
            <Card className="p-3 rounded-xl border border-[#E2E8F0] bg-[#FFF7ED]">
              <p className="text-xs text-[#718096]">Total Debits</p>
              <p className="text-base font-bold text-[#E67E22]">
                {formatZAR(data?.monthlyFlow?.reduce((s: number, d: any) => s + d.debits, 0) ?? 0)}
              </p>
            </Card>
          </div>
        </Card>
      )}

      {/* Bank Table */}
      {activeView === "By Bank" && (
        <Card className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm divide-y divide-[#E2E8F0]">
          <div className="px-4 py-3 flex items-center justify-between">
            <p className="text-xs font-bold text-[#718096] uppercase tracking-wide">Bank</p>
            <p className="text-xs font-bold text-[#718096] uppercase tracking-wide">Balance</p>
          </div>
          {data?.bankBalances?.map((bank: any, i: number) => (
            <div key={`${bank.name}-${i}`} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: bank.color }}
                >
                  {bank.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1A202C]">{bank.name}</p>
                  <p className="text-xs text-[#A0AEC0]">{bank.payments} payments</p>
                </div>
              </div>
              <p className="text-sm font-bold text-[#1A202C]">
                {formatZAR(bank.value)}
              </p>
            </div>
          ))}
        </Card>
      )}

    </div>
  );
}