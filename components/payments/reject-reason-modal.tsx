"use client";

import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

const quickReasons = [
  "Insufficient funds",
  "Incorrect beneficiary details",
  "Duplicate payment",
  "Exceeds transfer limit",
  "Suspicious activity",
  "Other",
];

interface RejectReasonModalProps {
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  loading: boolean;
}

export default function RejectReasonModal({
  onConfirm,
  onCancel,
  loading,
}: RejectReasonModalProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [error, setError] = useState("");

  function handleConfirm() {
    const reason = selectedReason === "Other" ? customReason : selectedReason;
    if (!reason.trim()) {
      setError("Please select or enter a rejection reason.");
      return;
    }
    onConfirm(reason);
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FFF1F2] flex items-center justify-center">
              <AlertTriangle size={16} className="text-[#C0392B]" />
            </div>
            <h2 className="text-base font-bold text-[#1A202C]">
              Reject Payment
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-[#F4F6F8] flex items-center justify-center hover:bg-[#E2E8F0] transition-colors"
          >
            <X size={16} className="text-[#718096]" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-[#718096]">
            Please provide a reason for rejecting this payment. This will be
            recorded and visible to the initiator.
          </p>

          {/* Error */}
          {error && (
            <div className="px-4 py-3 rounded-xl bg-[#FFF1F2] border border-[#FFC5C5] text-sm text-[#C0392B]">
              {error}
            </div>
          )}

          {/* Quick Reasons */}
          <div>
            <p className="text-xs font-semibold text-[#718096] uppercase tracking-wide mb-2">
              Select a reason
            </p>
            <div className="space-y-2">
              {quickReasons.map((reason) => (
                <button
                  key={reason}
                  onClick={() => {
                    setSelectedReason(reason);
                    setError("");
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                    selectedReason === reason
                      ? "bg-[#FFF1F2] border-[#FFC5C5] text-[#C0392B]"
                      : "bg-[#F4F6F8] border-transparent text-[#1A202C] hover:border-[#E2E8F0]"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Reason */}
          {selectedReason === "Other" && (
            <div>
              <p className="text-xs font-semibold text-[#718096] uppercase tracking-wide mb-2">
                Please specify
              </p>
              <textarea
                value={customReason}
                onChange={(e) => {
                  setCustomReason(e.target.value);
                  setError("");
                }}
                placeholder="Enter rejection reason..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F4F6F8] text-sm text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-[#C0392B] resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E2E8F0] flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-11 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#718096] hover:bg-[#F4F6F8] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 h-11 rounded-xl bg-[#C0392B] text-white text-sm font-semibold hover:bg-[#A93226] transition-colors disabled:opacity-60"
          >
            {loading ? "Rejecting..." : "Confirm Rejection"}
          </button>
        </div>
      </div>
    </div>
  );
}