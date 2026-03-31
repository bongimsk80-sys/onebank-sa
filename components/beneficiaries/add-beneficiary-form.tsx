"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

const categories = ["vendor", "supplier", "employee", "government", "utility"];
const types = ["local", "international", "wallet"];
const banks = ["FNB", "Standard Bank", "Absa", "Nedbank", "Capitec", "HSBC"];

interface AddBeneficiaryFormProps {
  onClose: () => void;
  onSuccess: (form: any) => void;
}

export default function AddBeneficiaryForm({
  onClose,
  onSuccess,
}: AddBeneficiaryFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    type: "local",
    category: "vendor",
    bank: "",
    accountNumber: "",
    branchCode: "",
    tag: "",
    status: "active",
    totalPayments: 0,
    lastPayment: 0,
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit() {
    setError("");
    if (!form.name || !form.bank || !form.accountNumber || !form.branchCode) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      await onSuccess(form);
    } catch {
      setError("Failed to add beneficiary. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4">
      <div className="bg-white w-full lg:max-w-md rounded-t-3xl lg:rounded-2xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-base font-bold text-[#1A202C]">
            Add Beneficiary
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F4F6F8] flex items-center justify-center"
          >
            <X size={16} className="text-[#718096]" />
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto max-h-[75vh] px-6 py-5 space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-[#FFF1F2] border border-[#FFC5C5] text-sm text-[#C0392B]">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-[#718096] uppercase tracking-wide mb-1.5 block">
              Beneficiary Name *
            </label>
            <Input
              name="name"
              placeholder="e.g. Eskom Holdings"
              value={form.name}
              onChange={handleChange}
              className="bg-[#F4F6F8] border-[#E2E8F0] rounded-xl text-sm h-11"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#718096] uppercase tracking-wide mb-1.5 block">
                Type *
              </label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full h-11 px-3 rounded-xl border border-[#E2E8F0] bg-[#F4F6F8] text-sm text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-[#1B4332] capitalize"
              >
                {types.map((t) => (
                  <option key={t} value={t} className="capitalize">{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#718096] uppercase tracking-wide mb-1.5 block">
                Category *
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full h-11 px-3 rounded-xl border border-[#E2E8F0] bg-[#F4F6F8] text-sm text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-[#1B4332] capitalize"
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="capitalize">{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#718096] uppercase tracking-wide mb-1.5 block">
              Bank *
            </label>
            <select
              name="bank"
              value={form.bank}
              onChange={handleChange}
              className="w-full h-11 px-3 rounded-xl border border-[#E2E8F0] bg-[#F4F6F8] text-sm text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
            >
              <option value="">Select bank</option>
              {banks.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#718096] uppercase tracking-wide mb-1.5 block">
              Account Number *
            </label>
            <Input
              name="accountNumber"
              placeholder="e.g. 1009001234008490"
              value={form.accountNumber}
              onChange={handleChange}
              className="bg-[#F4F6F8] border-[#E2E8F0] rounded-xl text-sm h-11 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#718096] uppercase tracking-wide mb-1.5 block">
              Branch Code *
            </label>
            <Input
              name="branchCode"
              placeholder="e.g. 250655"
              value={form.branchCode}
              onChange={handleChange}
              className="bg-[#F4F6F8] border-[#E2E8F0] rounded-xl text-sm h-11"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#718096] uppercase tracking-wide mb-1.5 block">
              Tag
            </label>
            <Input
              name="tag"
              placeholder="e.g. Utilities, Tax, Payroll"
              value={form.tag}
              onChange={handleChange}
              className="bg-[#F4F6F8] border-[#E2E8F0] rounded-xl text-sm h-11"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E2E8F0] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#718096]"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 h-11 rounded-xl bg-[#1B4332] text-white text-sm font-semibold hover:bg-[#2D6A4F] transition-colors disabled:opacity-60"
          >
            {loading ? "Adding..." : "Add Beneficiary"}
          </button>
        </div>
      </div>
    </div>
  );
}
