"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Building2,
  Tag,
  CreditCard,
  TrendingUp,
  Clock,
  CheckSquare,
  XCircle,
  ChevronRight,
  Edit2,
  CheckCircle,
  X,
  Trash2,
} from "lucide-react";

function formatZAR(amount: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const categoryIcons: Record<string, string> = {
  vendor: "🏢",
  supplier: "📦",
  employee: "👤",
  government: "🏛️",
  utility: "⚡",
};

const statusStyles: Record<string, { bg: string; text: string }> = {
  active: { bg: "#F0FDF4", text: "#27AE60" },
  pending: { bg: "#FFF7ED", text: "#E67E22" },
  disabled: { bg: "#F4F6F8", text: "#A0AEC0" },
};

const bankColors: Record<string, string> = {
  FNB: "#006B3C",
  "Standard Bank": "#0033A0",
  Absa: "#DC0032",
  Nedbank: "#007B40",
  Capitec: "#007DC5",
  HSBC: "#DB0011",
};

const paymentStatusConfig: Record<string, {
  bg: string; text: string; label: string; icon: React.ReactNode;
}> = {
  pending: { bg: "#EFF6FF", text: "#2980B9", label: "Pending", icon: <Clock size={12} /> },
  approved: { bg: "#F0FDF4", text: "#27AE60", label: "Approved", icon: <CheckSquare size={12} /> },
  rejected: { bg: "#FFF1F2", text: "#C0392B", label: "Rejected", icon: <XCircle size={12} /> },
  settled: { bg: "#FFF7ED", text: "#E67E22", label: "Settled", icon: <TrendingUp size={12} /> },
  scheduled: { bg: "#F5F3FF", text: "#7C3AED", label: "Scheduled", icon: <Clock size={12} /> },
};

const tags = [
  "Utilities", "Construction", "Tax", "International",
  "Payroll", "Rental", "Insurance", "Transport",
  "IT Services", "Marketing", "Legal", "Municipal",
];

export default function BeneficiaryDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [beneficiary, setBeneficiary] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTag, setEditingTag] = useState(false);
  const [selectedTag, setSelectedTag] = useState("");
  const [savingTag, setSavingTag] = useState(false);

  useEffect(() => {
    fetchBeneficiary();
  }, [id]);

  async function fetchBeneficiary() {
    try {
      const res = await fetch(`/api/beneficiaries/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBeneficiary(data.beneficiary);
      setPayments(data.payments ?? []);
      setSelectedTag(data.beneficiary?.tag ?? "");
    } catch (error) {
      console.error("Failed to fetch beneficiary:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveTag() {
    setSavingTag(true);
    try {
      await fetch(`/api/beneficiaries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: selectedTag }),
      });
      setBeneficiary({ ...beneficiary, tag: selectedTag });
      setEditingTag(false);
    } catch (error) {
      console.error("Failed to update tag:", error);
    } finally {
      setSavingTag(false);
    }
  }

  async function handleToggleStatus() {
    const newStatus = beneficiary.status === "active" ? "disabled" : "active";
    await fetch(`/api/beneficiaries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setBeneficiary({ ...beneficiary, status: newStatus });
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this beneficiary? This cannot be undone.")) return;
    try {
      await fetch("/api/beneficiaries", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: beneficiary.id }),
      });
      router.push("/beneficiaries");
    } catch (error) {
      console.error("Failed to delete beneficiary:", error);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 bg-[#E2E8F0] rounded-xl w-32" />
        <div className="h-48 bg-[#E2E8F0] rounded-xl" />
        <div className="h-32 bg-[#E2E8F0] rounded-xl" />
      </div>
    );
  }

  if (!beneficiary) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-sm text-[#A0AEC0]">Beneficiary not found</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm text-[#1B4332] font-semibold"
        >
          Go back
        </button>
      </div>
    );
  }

  const status = statusStyles[beneficiary.status] ?? statusStyles.active;
  const totalPaid = payments
    .filter((p) => p.status === "settled")
    .reduce((sum, p) => sum + p.amount, 0);
  const highestPayment = payments.length > 0
    ? Math.max(...payments.map((p) => p.amount))
    : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-[#718096] hover:text-[#1B4332] transition-colors font-medium"
      >
        <ArrowLeft size={16} />
        Back to Beneficiaries
      </button>

      {/* Profile Header Card */}
      <Card className="p-6 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-[#1B4332] flex items-center justify-center text-3xl flex-shrink-0">
              {categoryIcons[beneficiary.category] ?? "🏢"}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1A202C]">
                {beneficiary.name}
              </h2>
              <p className="text-sm text-[#718096] capitalize mt-0.5">
                {beneficiary.category}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-lg capitalize"
                  style={{ backgroundColor: status.bg, color: status.text }}
                >
                  {beneficiary.status}
                </span>
                <span className="text-xs text-[#A0AEC0] capitalize">
                  {beneficiary.type} transfer
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Toggle */}
            <button
              onClick={handleToggleStatus}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                beneficiary.status === "active"
                  ? "bg-[#FFF1F2] text-[#C0392B] hover:bg-[#FFE0E0]"
                  : "bg-[#F0FDF4] text-[#27AE60] hover:bg-[#BBF7D0]"
              }`}
            >
              {beneficiary.status === "active" ? (
                <><XCircle size={13} /> Disable</>
              ) : (
                <><CheckCircle size={13} /> Activate</>
              )}
            </button>

            {/* Delete Button */}
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#FFF1F2] text-[#C0392B] hover:bg-[#FFE0E0] transition-all"
            >
              <Trash2 size={13} />
              Delete
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#E2E8F0]">
          {[
            { label: "Total Payments", value: beneficiary.totalPayments },
            { label: "Highest Payment", value: formatZAR(highestPayment) },
            { label: "Total Paid", value: formatZAR(totalPaid) },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-base font-bold text-[#1A202C]">{value}</p>
              <p className="text-[10px] text-[#A0AEC0] mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Bank Account Details */}
      <Card className="p-5 rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
        <h3 className="text-sm font-bold text-[#1A202C] mb-4 flex items-center gap-2">
          <CreditCard size={16} className="text-[#1B4332]" />
          Bank Account Details
        </h3>
        <div className="space-y-3">
          {[
            { label: "Bank", value: beneficiary.bank },
            {
              label: "Account Number",
              value: beneficiary.accountNumber,
              mono: true,
            },
            { label: "Branch Code", value: beneficiary.branchCode },
            { label: "Account Type", value: beneficiary.type },
          ].map(({ label, value, mono }) => (
            <div
              key={label}
              className="flex items-center justify-between py-2 border-b border-[#F4F6F8]"
            >
              <span className="text-xs text-[#718096]">{label}</span>
              <span
                className={`text-xs font-semibold text-[#1A202C] ${
                  mono ? "font-mono" : ""
                }`}
              >
                {label === "Bank" ? (
                  <span
                    className="px-2 py-0.5 rounded-lg text-white text-[10px] font-bold"
                    style={{
                      backgroundColor: bankColors[value] ?? "#718096",
                    }}
                  >
                    {value}
                  </span>
                ) : (
                  value
                )}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Tag Management */}
      <Card className="p-5 rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#1A202C] flex items-center gap-2">
            <Tag size={16} className="text-[#1B4332]" />
            Category Tag
          </h3>
          {!editingTag && (
            <button
              onClick={() => setEditingTag(true)}
              className="flex items-center gap-1 text-xs text-[#1B4332] font-semibold hover:underline"
            >
              <Edit2 size={12} />
              Edit
            </button>
          )}
        </div>

        {!editingTag ? (
          <Badge className="bg-[#F4F6F8] text-[#718096] border-0 text-xs px-3 py-1">
            {beneficiary.tag}
          </Badge>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                    selectedTag === tag
                      ? "bg-[#1B4332] text-white border-[#1B4332]"
                      : "bg-[#F4F6F8] text-[#718096] border-transparent hover:border-[#E2E8F0]"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditingTag(false)}
                className="flex-1 py-2 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-[#718096]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTag}
                disabled={savingTag}
                className="flex-1 py-2 rounded-xl bg-[#1B4332] text-white text-xs font-semibold disabled:opacity-60"
              >
                {savingTag ? "Saving..." : "Save Tag"}
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Additional Info */}
      <Card className="p-5 rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
        <h3 className="text-sm font-bold text-[#1A202C] mb-4 flex items-center gap-2">
          <Building2 size={16} className="text-[#1B4332]" />
          Additional Information
        </h3>
        <div className="space-y-3">
          {[
            {
              label: "Last Payment",
              value: beneficiary.lastPaymentDate
                ? formatDate(beneficiary.lastPaymentDate)
                : "N/A",
            },
            {
              label: "Last Payment Amount",
              value: formatZAR(beneficiary.lastPayment),
            },
            {
              label: "Beneficiary Since",
              value: formatDate(beneficiary.createdAt),
            },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between py-2 border-b border-[#F4F6F8]"
            >
              <span className="text-xs text-[#718096]">{label}</span>
              <span className="text-xs font-semibold text-[#1A202C]">
                {value}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Payment History */}
      <div>
        <h3 className="text-sm font-bold text-[#1A202C] mb-3">
          Recent Payment History
        </h3>
        {payments.length === 0 ? (
          <Card className="p-8 rounded-xl border border-[#E2E8F0] bg-white shadow-sm text-center">
            <p className="text-sm text-[#A0AEC0]">No payments found</p>
          </Card>
        ) : (
          <Card className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm divide-y divide-[#E2E8F0]">
            {payments.map((payment) => {
              const pStatus = paymentStatusConfig[payment.status] ?? paymentStatusConfig.pending;
              return (
                <div
                  key={payment.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: pStatus.bg, color: pStatus.text }}
                    >
                      {pStatus.icon}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#1A202C]">
                        {payment.reference}
                      </p>
                      <p className="text-[10px] text-[#A0AEC0]">
                        {formatDate(payment.date)} · {payment.bank}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#1A202C]">
                      {formatZAR(payment.amount)}
                    </p>
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                      style={{
                        backgroundColor: pStatus.bg,
                        color: pStatus.text,
                      }}
                    >
                      {pStatus.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </Card>
        )}
      </div>

    </div>
  );
}