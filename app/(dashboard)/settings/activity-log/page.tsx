"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Search,
  CheckCircle,
  XCircle,
  LogIn,
  CreditCard,
  Users,
  Building2,
  FileText,
  Shield,
  Link,
  BarChart2,
  SlidersHorizontal,
  X,
} from "lucide-react";

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const entityIcons: Record<string, React.ReactNode> = {
  auth: <LogIn size={14} />,
  payment: <CreditCard size={14} />,
  user: <Users size={14} />,
  beneficiary: <Users size={14} />,
  bank: <Building2 size={14} />,
  workflow: <Shield size={14} />,
  erp: <Link size={14} />,
  report: <BarChart2 size={14} />,
};

const entityColors: Record<string, { bg: string; text: string }> = {
  auth: { bg: "#EFF6FF", text: "#2980B9" },
  payment: { bg: "#F0FDF4", text: "#27AE60" },
  user: { bg: "#F5F3FF", text: "#7C3AED" },
  beneficiary: { bg: "#FFF7ED", text: "#E67E22" },
  bank: { bg: "#F0FDF4", text: "#1B4332" },
  workflow: { bg: "#FFF7ED", text: "#D4A017" },
  erp: { bg: "#EFF6FF", text: "#2980B9" },
  report: { bg: "#F5F3FF", text: "#7C3AED" },
};

const entityTypes = [
  { id: "all", label: "All" },
  { id: "auth", label: "Auth" },
  { id: "payment", label: "Payments" },
  { id: "user", label: "Users" },
  { id: "beneficiary", label: "Beneficiaries" },
  { id: "bank", label: "Bank" },
  { id: "workflow", label: "Workflows" },
  { id: "erp", label: "ERP" },
  { id: "report", label: "Reports" },
];

export default function ActivityLogPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [statusFilter, entityFilter]);

  async function fetchLogs() {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (entityFilter !== "all") params.set("entityType", entityFilter);

      const res = await fetch(`/api/activity-log?${params.toString()}`);
      const data = await res.json();
      setLogs(data.logs ?? []);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  }

  const successCount = logs.filter((l) => l.status === "success").length;
  const failedCount = logs.filter((l) => l.status === "failed").length;

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-[#718096] hover:text-[#1B4332] transition-colors font-medium"
      >
        <ArrowLeft size={16} />
        Back to Settings
      </button>

      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-[#1A202C]">Activity Log</h2>
        <p className="text-xs text-[#718096] mt-0.5">
          Complete audit trail of all system activity
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Events", value: logs.length, color: "#1B4332" },
          { label: "Successful", value: successCount, color: "#27AE60" },
          { label: "Failed", value: failedCount, color: "#C0392B" },
        ].map(({ label, value, color }) => (
          <Card
            key={label}
            className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-sm text-center"
          >
            <p className="text-xl font-bold" style={{ color }}>
              {String(value).padStart(2, "0")}
            </p>
            <p className="text-[10px] text-[#718096] mt-0.5">{label}</p>
          </Card>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0AEC0]"
          />
          <Input
            placeholder="Search actions, users or descriptions..."
            className="pl-9 bg-white border-[#E2E8F0] rounded-xl text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchLogs()}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
            showFilters || statusFilter !== "all" || entityFilter !== "all"
              ? "bg-[#1B4332] text-white border-[#1B4332]"
              : "bg-white text-[#718096] border-[#E2E8F0]"
          }`}
        >
          <SlidersHorizontal size={13} />
          Filter
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[#1A202C] uppercase tracking-wide">
              Filters
            </p>
            <button onClick={() => setShowFilters(false)}>
              <X size={14} className="text-[#A0AEC0]" />
            </button>
          </div>

          {/* Status Filter */}
          <div>
            <p className="text-xs font-semibold text-[#718096] mb-2 uppercase tracking-wide">
              Status
            </p>
            <div className="flex gap-2">
              {["all", "success", "failed"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                    statusFilter === s
                      ? s === "failed"
                        ? "bg-[#C0392B] text-white"
                        : s === "success"
                        ? "bg-[#27AE60] text-white"
                        : "bg-[#1B4332] text-white"
                      : "bg-[#F4F6F8] text-[#718096]"
                  }`}
                >
                  {s === "all" ? "All" : s}
                </button>
              ))}
            </div>
          </div>

          {/* Entity Type Filter */}
          <div>
            <p className="text-xs font-semibold text-[#718096] mb-2 uppercase tracking-wide">
              Category
            </p>
            <div className="flex flex-wrap gap-2">
              {entityTypes.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setEntityFilter(id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    entityFilter === id
                      ? "bg-[#1B4332] text-white"
                      : "bg-[#F4F6F8] text-[#718096]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              setStatusFilter("all");
              setEntityFilter("all");
            }}
            className="text-xs text-[#C0392B] font-semibold hover:underline"
          >
            Clear all filters
          </button>
        </Card>
      )}

      {/* Logs List */}
      <Card className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm divide-y divide-[#E2E8F0]">
        {loading ? (
          <div className="py-12 text-center text-sm text-[#A0AEC0]">
            Loading activity log...
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#A0AEC0]">
            No activity found
          </div>
        ) : (
          logs.map((log) => {
            const entityColor = entityColors[log.entityType ?? "auth"] ?? entityColors.auth;
            const icon = entityIcons[log.entityType ?? "auth"] ?? entityIcons.auth;
            return (
              <div key={log.id} className="flex items-start gap-3 px-4 py-3">
                {/* Icon */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: entityColor.bg, color: entityColor.text }}
                >
                  {icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-bold text-[#1A202C]">
                      {log.action}
                    </p>
                    {/* Status */}
                    <span
                      className={`flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                        log.status === "success"
                          ? "bg-[#F0FDF4] text-[#27AE60]"
                          : "bg-[#FFF1F2] text-[#C0392B]"
                      }`}
                    >
                      {log.status === "success" ? (
                        <CheckCircle size={10} />
                      ) : (
                        <XCircle size={10} />
                      )}
                      {log.status}
                    </span>
                    {/* Entity type */}
                    {log.entityType && (
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md capitalize"
                        style={{ backgroundColor: entityColor.bg, color: entityColor.text }}
                      >
                        {log.entityType}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#718096] mt-0.5 leading-relaxed">
                    {log.description}
                  </p>
                  <div className="flex flex-col gap-0.5 mt-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      {log.userName && (
                        <span className="text-[10px] text-[#A0AEC0] flex items-center gap-1">
                          👤 {log.userName}
                        </span>
                      )}
                      {log.ipAddress && (
                        <span className="text-[10px] text-[#A0AEC0] flex items-center gap-1">
                          🌐 {log.ipAddress}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-[#718096]">
                        🕐 {formatDateTime(log.createdAt)}
                      </span>
                      <span className="text-[10px] text-[#A0AEC0]">
                        ({timeAgo(log.createdAt)})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}