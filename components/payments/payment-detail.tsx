"use client";

import RejectReasonModal from "@/components/payments/reject-reason-modal";
import { useState } from "react";
import { useSessionStore, rolePermissions } from "@/store/session-store";
import {
  X,
  Clock,
  CheckSquare,
  XCircle,
  TrendingUp,
  Loader,
  Zap,
  Building2,
  FileText,
  User,
  ChevronRight,
} from "lucide-react";

function formatZAR(amount: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusConfig: Record<string, {
  bg: string;
  text: string;
  label: string;
  icon: React.ReactNode;
}> = {
  pending: { bg: "#EFF6FF", text: "#2980B9", label: "Pending Review", icon: <Clock size={14} /> },
  approved: { bg: "#F0FDF4", text: "#27AE60", label: "Approved", icon: <CheckSquare size={14} /> },
  rejected: { bg: "#FFF1F2", text: "#C0392B", label: "Rejected", icon: <XCircle size={14} /> },
  settled: { bg: "#FFF7ED", text: "#E67E22", label: "Settled", icon: <TrendingUp size={14} /> },
  inprogress: { bg: "#F5F3FF", text: "#7C3AED", label: "In Progress", icon: <Loader size={14} /> },
};

const typeLabels: Record<string, string> = {
  "same-bank": "Same Bank Transfer",
  local: "Local EFT",
  international: "International SWIFT",
};

// Workflow steps
const workflowSteps = [
  { key: "pending", label: "Initiated", role: "Initiator" },
  { key: "reviewing", label: "Reviewed", role: "Reviewer" },
  { key: "approved", label: "Approved", role: "Approver" },
  { key: "inprogress", label: "Executing", role: "Executor" },
  { key: "settled", label: "Settled", role: "Bank" },
];

function getWorkflowStep(status: string) {
  if (status === "pending") return 0;
  if (status === "approved") return 2;
  if (status === "inprogress") return 3;
  if (status === "settled") return 4;
  if (status === "rejected") return -1;
  return 0;
}

interface PaymentDetailProps {
  payment: any;
  onClose: () => void;
  onStatusChange: () => void;
}

export default function PaymentDetail({
  payment,
  onClose,
  onStatusChange,
}: PaymentDetailProps) {
  const { role } = useSessionStore();
  const permissions = rolePermissions[(role || "viewer") as keyof typeof rolePermissions] ?? rolePermissions.viewer;
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(payment.status);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const status = statusConfig[currentStatus] ?? statusConfig.pending;
  const workflowStep = getWorkflowStep(currentStatus);

  async function updateStatus(newStatus: string, rejectionReason?: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        id: payment.id,
        status: newStatus,        ...(rejectionReason ? { rejectionReason } : {}),
      }),
    });

      if (!res.ok) throw new Error("Failed to update payment");
    setCurrentStatus(newStatus);
    setShowRejectModal(false);
    onStatusChange();
  } catch (error) {
    console.error("Failed to update payment:", error);
  } finally {
    setLoading(false);
  }
}

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-end lg:items-center justify-center p-0 lg:p-4">
      <div className="bg-white w-full lg:max-w-lg rounded-t-3xl lg:rounded-2xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-base font-bold text-[#1A202C]">Payment Details</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F4F6F8] flex items-center justify-center hover:bg-[#E2E8F0] transition-colors"
          >
            <X size={16} className="text-[#718096]" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[80vh] px-6 py-5 space-y-5">

          {/* Amount & Status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#718096]">Payment Amount</p>
              <p className="text-2xl font-bold text-[#1A202C]">
                {formatZAR(payment.amount)}
              </p>
            </div>
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: status.bg, color: status.text }}
            >
              {status.icon}
              {status.label}
            </div>
          </div>

          {/* Priority Badge */}
          {payment.priority && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FFF7ED] border border-[#FFE0B2]">
              <Zap size={14} className="text-[#D4A017]" />
              <span className="text-xs font-semibold text-[#D4A017]">
                Priority Payment
              </span>
            </div>
          )}

          {/* Workflow Progress */}
          {currentStatus !== "rejected" && (
            <div>
              <p className="text-xs font-semibold text-[#718096] uppercase tracking-wide mb-3">
                Approval Workflow
              </p>
              <div className="flex items-center justify-between">
                {workflowSteps.map((step, index) => (
                  <div key={step.key} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          index <= workflowStep
                            ? "bg-[#1B4332] text-white"
                            : "bg-[#F4F6F8] text-[#A0AEC0]"
                        }`}
                      >
                        {index <= workflowStep ? "✓" : index + 1}
                      </div>
                      <p className="text-[9px] text-[#A0AEC0] mt-1 text-center w-12">
                        {step.label}
                      </p>
                    </div>
                    {index < workflowSteps.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-1 transition-all ${
                          index < workflowStep
                            ? "bg-[#1B4332]"
                            : "bg-[#E2E8F0]"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rejected State */}
          {currentStatus === "rejected" && (
            <div className="px-4 py-3 rounded-xl bg-[#FFF1F2] border border-[#FFC5C5]">
              <p className="text-sm font-semibold text-[#C0392B]">
                Payment Rejected
              </p>
              <p className="text-xs text-[#C0392B] mt-0.5">
                This payment was rejected and will not be processed.
              </p>
            </div>
          )}

          {/* Payment Details */}
          <div>
            <p className="text-xs font-semibold text-[#718096] uppercase tracking-wide mb-3">
              Payment Information
            </p>
            <div className="space-y-3">
              {[
                { icon: <Building2 size={14} />, label: "Beneficiary", value: payment.beneficiary },
                { icon: <Building2 size={14} />, label: "Bank", value: payment.bank },
                { icon: <FileText size={14} />, label: "Type", value: typeLabels[payment.type] ?? payment.type },
                { icon: <FileText size={14} />, label: "Reference", value: payment.reference },
                { icon: <User size={14} />, label: "Initiated By", value: payment.initiatedBy },
                { icon: <Clock size={14} />, label: "Date", value: formatDateTime(payment.date) },
              ].map(({ icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-2 border-b border-[#F4F6F8]"
                >
                  <div className="flex items-center gap-2 text-[#718096]">
                    {icon}
                    <span className="text-xs">{label}</span>
                  </div>
                  <span className="text-xs font-semibold text-[#1A202C]">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          {payment.description && (
            <div>
              <p className="text-xs font-semibold text-[#718096] uppercase tracking-wide mb-2">
                Description
              </p>
              <p className="text-sm text-[#1A202C] bg-[#F4F6F8] rounded-xl p-3">
                {payment.description}
              </p>
            </div>
          )}
        </div>

        {/* Role-based Action Buttons */}
        <div className="px-6 py-4 border-t border-[#E2E8F0] space-y-2">

          {/* Reviewer Actions */}
          {permissions.canReviewPayments && currentStatus === "pending" && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={loading}
                className="flex-1 h-11 rounded-xl border border-[#FFC5C5] bg-[#FFF1F2] text-[#C0392B] text-sm font-semibold hover:bg-[#FFE0E0] transition-colors disabled:opacity-60"
              >
                Reject
              </button>
              <button
                onClick={() => updateStatus("approved")}
                disabled={loading}
                className="flex-1 h-11 rounded-xl bg-[#1B4332] text-white text-sm font-semibold hover:bg-[#2D6A4F] transition-colors disabled:opacity-60"
              >
                {loading ? "Processing..." : "Approve"}
              </button>
            </div>
          )}

          {/* Approver Actions */}
          {permissions.canApprovePayments && currentStatus === "approved" && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={loading}
                className="flex-1 h-11 rounded-xl border border-[#FFC5C5] bg-[#FFF1F2] text-[#C0392B] text-sm font-semibold hover:bg-[#FFE0E0] transition-colors disabled:opacity-60"
              >
                Reject
              </button>
              <button
                onClick={() => updateStatus("inprogress")}
                disabled={loading}
                className="flex-1 h-11 rounded-xl bg-[#1B4332] text-white text-sm font-semibold hover:bg-[#2D6A4F] transition-colors disabled:opacity-60"
              >
                {loading ? "Processing..." : "Send to Executor"}
              </button>
            </div>
          )}

          {/* Executor Actions */}
          {permissions.canExecutePayments && currentStatus === "inprogress" && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={loading}
                className="flex-1 h-11 rounded-xl border border-[#FFC5C5] bg-[#FFF1F2] text-[#C0392B] text-sm font-semibold hover:bg-[#FFE0E0] transition-colors disabled:opacity-60"
              >
                Reject
              </button>
              <button
                onClick={() => updateStatus("settled")}
                disabled={loading}
                className="flex-1 h-11 rounded-xl bg-[#D4A017] text-white text-sm font-semibold hover:bg-[#A07810] transition-colors disabled:opacity-60"
              >
                {loading ? "Processing..." : "Execute Payment"}
              </button>
            </div>
          )}

          {/* Settled State */}
          {currentStatus === "settled" && (
            <div className="flex items-center justify-center gap-2 py-3 bg-[#F0FDF4] rounded-xl">
              <CheckSquare size={16} className="text-[#27AE60]" />
              <span className="text-sm font-semibold text-[#27AE60]">
                Payment Successfully Settled
              </span>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full h-11 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#718096] hover:bg-[#F4F6F8] transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Reject modal — rendered outside the sheet so it stacks above it */}
      {showRejectModal && (
        <RejectReasonModal
          loading={loading}
          onCancel={() => setShowRejectModal(false)}
          onConfirm={(reason) => updateStatus("rejected", reason)}
        />
      )}
    </div>
  );
}