"use client";

import SchedulePaymentModal from "@/components/payments/schedule-payment-modal";
import { useState } from "react";
import { useSessionStore } from "@/store/session-store";
import { Input } from "@/components/ui/input";
import { X, Upload, Calendar, Zap } from "lucide-react";

const paymentTypes = [
  { id: "same-bank", label: "Same Bank" },
  { id: "local", label: "Local EFT" },
  { id: "international", label: "International" },
];

const banks = [
  "FNB",
  "Standard Bank",
  "Absa",
  "Nedbank",
  "Capitec",
];

interface AddPaymentFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPaymentForm({ onClose, onSuccess }: AddPaymentFormProps) {
  const { name } = useSessionStore();
  const [activeType, setActiveType] = useState("local");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [priority, setPriority] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const [form, setForm] = useState({
    beneficiary: "",
    bank: "",
    amount: "",
    reference: "",
    description: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit() {
  setError("");

  if (!form.beneficiary || !form.bank || !form.amount || !form.reference) {
    setError("Please fill in all required fields.");
    return;
  }

  if (isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
    setError("Please enter a valid amount.");
    return;
  }

  setLoading(true);
  try {
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        beneficiary: form.beneficiary,
        bank: form.bank,
        amount: Number(form.amount),
        type: activeType,
        reference: form.reference,
        description: form.description,
        priority,
        initiatedBy: name ?? "Unknown",
      }),
    });

    if (!res.ok) throw new Error("Failed to create payment");
    onSuccess();
    onClose();
  } catch (err) {
    setError("Failed to create payment. Please try again.");
  } finally {
    setLoading(false);
  }
}async function handleSchedule(scheduledDate: string) {
  setError("");

  if (!form.beneficiary || !form.bank || !form.amount || !form.reference) {
    setShowScheduleModal(false);
    setError("Please fill in all required fields before scheduling.");
    return;
  }

  setLoading(true);
  try {
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        beneficiary: form.beneficiary,
        bank: form.bank,
        amount: Number(form.amount),
        type: activeType,
        reference: form.reference,
        description: form.description,
        priority,
        initiatedBy: name ?? "Unknown",
        isScheduled: true,
        scheduledDate,
      }),
    });

    if (!res.ok) throw new Error("Failed to schedule payment");
    onSuccess();
    onClose();
  } catch (err) {
    setError("Failed to schedule payment. Please try again.");
  } finally {
    setLoading(false);
    setShowScheduleModal(false);
  }
}

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4">
      <div className="bg-white w-full lg:max-w-lg rounded-t-3xl lg:rounded-2xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-base font-bold text-[#1A202C]">Add New Payment</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F4F6F8] flex items-center justify-center hover:bg-[#E2E8F0] transition-colors"
          >
            <X size={16} className="text-[#718096]" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[80vh] px-6 py-5 space-y-5">

          {/* Payment Type */}
          <div className="flex gap-2">
            {paymentTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setActiveType(type.id)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeType === type.id
                    ? "bg-[#1B4332] text-white"
                    : "bg-[#F4F6F8] text-[#718096]"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-3 rounded-xl bg-[#FFF1F2] border border-[#FFC5C5] text-sm text-[#C0392B]">
              {error}
            </div>
          )}

          {/* Debit From */}
          <div>
            <label className="text-xs font-semibold text-[#718096] mb-1.5 block uppercase tracking-wide">
              Debit From *
            </label>
            <select
              name="bank"
              value={form.bank}
              onChange={handleChange}
              className="w-full h-11 px-3 rounded-xl border border-[#E2E8F0] bg-[#F4F6F8] text-sm text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
            >
              <option value="">Select bank account</option>
              {banks.map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </select>
          </div>

          {/* Beneficiary */}
          <div>
            <label className="text-xs font-semibold text-[#718096] mb-1.5 block uppercase tracking-wide">
              Beneficiary *
            </label>
            <Input
              name="beneficiary"
              placeholder="Beneficiary name"
              value={form.beneficiary}
              onChange={handleChange}
              className="bg-[#F4F6F8] border-[#E2E8F0] rounded-xl text-sm h-11"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-semibold text-[#718096] mb-1.5 block uppercase tracking-wide">
              Amount (ZAR) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#718096]">
                R
              </span>
              <Input
                name="amount"
                type="number"
                placeholder="0.00"
                value={form.amount}
                onChange={handleChange}
                className="bg-[#F4F6F8] border-[#E2E8F0] rounded-xl text-sm h-11 pl-7"
              />
            </div>
          </div>

          {/* Reference */}
          <div>
            <label className="text-xs font-semibold text-[#718096] mb-1.5 block uppercase tracking-wide">
              Reference *
            </label>
            <Input
              name="reference"
              placeholder="Payment reference"
              value={form.reference}
              onChange={handleChange}
              className="bg-[#F4F6F8] border-[#E2E8F0] rounded-xl text-sm h-11"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-[#718096] mb-1.5 block uppercase tracking-wide">
              Description
            </label>
            <textarea
              name="description"
              placeholder="Payment description (optional)"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F4F6F8] text-sm text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-[#1B4332] resize-none"
            />
          </div>

          {/* Priority Toggle */}
          <div className="flex items-center justify-between py-3 border-t border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-[#D4A017]" />
              <span className="text-sm font-medium text-[#1A202C]">
                Priority Payment
              </span>
            </div>
            <button
              onClick={() => setPriority(!priority)}
              className={`w-12 h-6 rounded-full transition-all relative ${
                priority ? "bg-[#1B4332]" : "bg-[#E2E8F0]"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                  priority ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* Attach Document */}
          <div>
            <label className="text-xs font-semibold text-[#718096] mb-1.5 block uppercase tracking-wide">
              Attach Document (Optional)
            </label>
            <div className="border-2 border-dashed border-[#E2E8F0] rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#1B4332] transition-colors">
              <Upload size={20} className="text-[#A0AEC0]" />
              <p className="text-xs text-[#A0AEC0] text-center">
                Click to upload or drag and drop
              </p>
              <p className="text-[10px] text-[#A0AEC0]">
                Maximum 5 files, 2MB each
              </p>
              {showScheduleModal && (
  <SchedulePaymentModal
    formData={form}
    loading={loading}
    onCancel={() => setShowScheduleModal(false)}
    onConfirm={handleSchedule}
  />
)}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#E2E8F0] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#718096] hover:bg-[#F4F6F8] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 h-11 rounded-xl bg-[#1B4332] text-white text-sm font-semibold hover:bg-[#2D6A4F] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? "Submitting..." : "Add to Payments"}
          </button>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="w-11 h-11 rounded-xl bg-[#D4A017] flex items-center justify-center flex-shrink-0 hover:bg-[#A07810] transition-colors"
            title="Schedule payment"
          >
            <Calendar size={18} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}