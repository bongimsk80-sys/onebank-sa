"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSessionStore, rolePermissions } from "@/store/session-store";
import AddPaymentForm from "@/components/payments/add-payment-form";
import PaymentDetail from "@/components/payments/payment-detail";
import ExportButton from "@/components/shared/export-button";
import { exportPaymentsPDF, exportPaymentsExcel } from "@/lib/export";
import {
  Clock,
  CheckSquare,
  XCircle,
  TrendingUp,
  Loader,
  Plus,
  ChevronRight,
  Calendar,
} from "lucide-react";

function formatZAR(amount: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-ZA", { day: "2-digit", month: "short" });
}

const statusConfig: Record<string, {
  bg: string;
  text: string;
  label: string;
  icon: React.ReactNode;
}> = {
  pending: { bg: "#EFF6FF", text: "#2980B9", label: "Pending", icon: <Clock size={14} /> },
  approved: { bg: "#F0FDF4", text: "#27AE60", label: "Approved", icon: <CheckSquare size={14} /> },
  rejected: { bg: "#FFF1F2", text: "#C0392B", label: "Rejected", icon: <XCircle size={14} /> },
  settled: { bg: "#FFF7ED", text: "#E67E22", label: "Settled", icon: <TrendingUp size={14} /> },
  inprogress: { bg: "#F5F3FF", text: "#7C3AED", label: "In Progress", icon: <Loader size={14} /> },
  scheduled: { bg: "#EFF6FF", text: "#2980B9", label: "Scheduled", icon: <Calendar size={14} /> },
};

const typeLabels: Record<string, string> = {
  "same-bank": "Same Bank",
  local: "Local EFT",
  international: "International",
};

const typeBg: Record<string, string> = {
  "same-bank": "#F0FDF4",
  local: "#EFF6FF",
  international: "#FFF7ED",
};

const typeText: Record<string, string> = {
  "same-bank": "#27AE60",
  local: "#2980B9",
  international: "#E67E22",
};

const filters = ["All", "Pending", "Approved", "Settled", "Rejected", "In Progress", "Scheduled"];

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const { role } = useSessionStore();
  // Use || (not ??) so empty-string role also falls back to "viewer"
  const permissions = rolePermissions[(role || "viewer") as keyof typeof rolePermissions] ?? rolePermissions.viewer;

  useEffect(() => {
    async function fetchPayments() {
      try {
        const params = new URLSearchParams();
        if (activeFilter !== "All") {
          const status = activeFilter === "In Progress"
            ? "inprogress"
            : activeFilter.toLowerCase();
          params.set("status", status);
        }
        const res = await fetch(`/api/payments?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setPayments(data.payments ?? []);
      } catch (error) {
        console.error("Failed to fetch payments:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPayments();
  }, [activeFilter, refreshKey]);

  const summary = {
    pending: payments.filter((p) => p.status === "pending").length,
    approved: payments.filter((p) => p.status === "approved").length,
    settled: payments.filter((p) => p.status === "settled").length,
    rejected: payments.filter((p) => p.status === "rejected").length,
    scheduled: payments.filter((p) => p.status === "scheduled").length,
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Summary Grid */}
      <div className="grid grid-cols-2 gap-2 items-start">
        {[
          { label: "Pending", value: summary.pending, color: "#2980B9" },
          { label: "Approved", value: summary.approved, color: "#27AE60" },
          { label: "Settled", value: summary.settled, color: "#E67E22" },
          { label: "Rejected", value: summary.rejected, color: "#C0392B" },
          { label: "Scheduled", value: summary.scheduled, color: "#2980B9" },
        ].map(({ label, value, color }) => (
          <Card
            key={label}
            className="p-3 rounded-xl border border-[#E2E8F0] bg-white shadow-sm text-center"
          >
            <p className="text-xl font-bold" style={{ color }}>
              {String(value).padStart(2, "0")}
            </p>
            <p className="text-[10px] text-[#718096] mt-0.5">{label}</p>
          </Card>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="grid grid-cols-3 gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => {
              setActiveFilter(f);
              setLoading(true);
            }}
            className={`py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === f
                ? "bg-[#1B4332] text-white"
                : "bg-white text-[#718096] border border-[#E2E8F0]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Payments List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-[#718096]">
            {loading ? "Loading..." : `${payments.length} payment${payments.length !== 1 ? "s" : ""}`}
          </p>
          <ExportButton
            onExportPDF={() => exportPaymentsPDF(payments)}
            onExportExcel={() => exportPaymentsExcel(payments)}
          />
        </div>

        <Card className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm divide-y divide-[#E2E8F0]">
          {loading ? (
            <div className="py-12 text-center text-sm text-[#A0AEC0]">
              Loading payments...
            </div>
          ) : payments.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#A0AEC0]">
              No payments found
            </div>
          ) : (
            payments.map((payment) => {
              const status = statusConfig[payment.status] ?? statusConfig.pending;
              return (
                <div
                  key={payment.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-[#F4F6F8] transition-colors cursor-pointer"
onClick={() => setSelectedPayment(payment)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: status.bg, color: status.text }}
                    >
                      {status.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[#1A202C] truncate">
                          {payment.beneficiary}
                        </p>
                        {payment.priority && (
                          <Badge className="bg-[#FFF1F2] text-[#C0392B] border-0 text-[9px] px-1.5 py-0 h-4">
                            Priority
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                          style={{
                            backgroundColor: typeBg[payment.type] ?? "#F4F6F8",
                            color: typeText[payment.type] ?? "#718096",
                          }}
                        >
                          {typeLabels[payment.type] ?? payment.type}
                        </span>
                        <span className="text-[10px] text-[#A0AEC0]">{payment.bank}</span>
                        <span className="text-[10px] text-[#A0AEC0]">{formatDate(payment.date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2 flex items-center gap-1 max-w-[130px]">
                    <div>
                      <p className="text-sm font-bold text-[#1A202C]">
                        {formatZAR(payment.amount)}
                      </p>
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-1 justify-end"
                        style={{ backgroundColor: status.bg, color: status.text }}
                      >
                        {status.icon}
                        {status.label}
                      </span>
                    </div>
                    <ChevronRight size={14} className="text-[#A0AEC0]" />
                  </div>
                </div>
              );
            })
          )}
        </Card>
      </div>

      {/* Add Payment Form + Floating Button */}
{selectedPayment && (
        <PaymentDetail
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onStatusChange={() => {
            setRefreshKey((k) => k + 1);
            setSelectedPayment(null);
          }}
        />
      )}

      {permissions.canInitiatePayments && (
        <>
          {showForm && (
            <AddPaymentForm
              onClose={() => setShowForm(false)}
              onSuccess={() => {
                setLoading(true);
                setActiveFilter("All");
                setRefreshKey((k) => k + 1);
              }}
            />
          )}
                <button
                  onClick={() => setShowForm(true)}
                  className="fixed bottom-24 right-6 lg:bottom-8 lg:right-8 w-14 h-14 bg-[#D4A017] rounded-full shadow-lg flex items-center justify-center hover:bg-[#A07810] transition-colors z-50"
                >
                  <Plus size={24} className="text-white" />
                </button>
              </>
            )}
          </div>
        );
      }