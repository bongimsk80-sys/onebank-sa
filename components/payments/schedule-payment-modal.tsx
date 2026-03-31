"use client";

import { useState } from "react";
import { X, Calendar, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SchedulePaymentModalProps {
  formData: any;
  onConfirm: (scheduledDate: string) => void;
  onCancel: () => void;
  loading: boolean;
}

export default function SchedulePaymentModal({
  formData,
  onConfirm,
  onCancel,
  loading,
}: SchedulePaymentModalProps) {
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [error, setError] = useState("");

  const quickDates = [
    { label: "Tomorrow", days: 1 },
    { label: "In 3 days", days: 3 },
    { label: "Next week", days: 7 },
    { label: "In 2 weeks", days: 14 },
  ];

  function setQuickDate(days: number) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setScheduledDate(date.toISOString().split("T")[0]);
    setError("");
  }

  function handleConfirm() {
    if (!scheduledDate) {
      setError("Please select a scheduled date.");
      return;
    }

    const selectedDate = new Date(`${scheduledDate}T${scheduledTime}`);
    const now = new Date();

    if (selectedDate <= now) {
      setError("Scheduled date must be in the future.");
      return;
    }

    onConfirm(selectedDate.toISOString());
  }

  function formatZAR(amount: number) {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 2,
    }).format(amount);
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#EFF6FF] flex items-center justify-center">
              <Calendar size={16} className="text-[#2980B9]" />
            </div>
            <h2 className="text-base font-bold text-[#1A202C]">
              Schedule Payment
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
        <div className="px-6 py-5 space-y-5">

          {/* Payment Summary */}
          <div className="p-4 rounded-xl bg-[#F4F6F8] border border-[#E2E8F0]">
            <p className="text-xs text-[#718096] mb-1">Payment to be scheduled</p>
            <p className="text-sm font-bold text-[#1A202C]">
              {formData.beneficiary || "Beneficiary"}
            </p>
            <p className="text-lg font-bold text-[#1B4332] mt-0.5">
              {formatZAR(Number(formData.amount) || 0)}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-3 rounded-xl bg-[#FFF1F2] border border-[#FFC5C5] text-sm text-[#C0392B]">
              {error}
            </div>
          )}

          {/* Quick Date Selection */}
          <div>
            <p className="text-xs font-semibold text-[#718096] uppercase tracking-wide mb-2">
              Quick Select
            </p>
            <div className="grid grid-cols-2 gap-2">
              {quickDates.map(({ label, days }) => (
                <button
                  key={label}
                  onClick={() => setQuickDate(days)}
                  className={`py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                    scheduledDate === (() => {
                      const d = new Date();
                      d.setDate(d.getDate() + days);
                      return d.toISOString().split("T")[0];
                    })()
                      ? "bg-[#1B4332] text-white border-[#1B4332]"
                      : "bg-[#F4F6F8] text-[#718096] border-transparent"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date */}
          <div>
            <p className="text-xs font-semibold text-[#718096] uppercase tracking-wide mb-2">
              Custom Date
            </p>
            <Input
              type="date"
              value={scheduledDate}
              onChange={(e) => {
                setScheduledDate(e.target.value);
                setError("");
              }}
              min={new Date().toISOString().split("T")[0]}
              className="bg-[#F4F6F8] border-[#E2E8F0] rounded-xl text-sm h-11"
            />
          </div>

          {/* Time Selection */}
          <div>
            <p className="text-xs font-semibold text-[#718096] uppercase tracking-wide mb-2">
              Scheduled Time
            </p>
            <div className="relative">
              <Clock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0AEC0]"
              />
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="bg-[#F4F6F8] border-[#E2E8F0] rounded-xl text-sm h-11 pl-9"
              />
            </div>
          </div>

          {/* Selected Date Preview */}
          {scheduledDate && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0]">
              <Calendar size={14} className="text-[#27AE60]" />
              <p className="text-xs font-semibold text-[#27AE60]">
                Scheduled for{" "}
                {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleDateString(
                  "en-ZA",
                  {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}
              </p>
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
            className="flex-1 h-11 rounded-xl bg-[#2980B9] text-white text-sm font-semibold hover:bg-[#1F6391] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Calendar size={16} />
            {loading ? "Scheduling..." : "Schedule Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}