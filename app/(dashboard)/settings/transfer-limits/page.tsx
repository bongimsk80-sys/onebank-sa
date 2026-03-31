"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Shield,
  Edit2,
  Check,
  X,
} from "lucide-react";

function formatZAR(amount: number) {
  if (amount >= 999999999) return "Unlimited";
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 0,
  }).format(amount);
}

const roleColors: Record<string, { bg: string; text: string }> = {
  admin: { bg: "#FFF7ED", text: "#D4A017" },
  initiator: { bg: "#EFF6FF", text: "#2980B9" },
  reviewer: { bg: "#F5F3FF", text: "#7C3AED" },
  approver: { bg: "#F0FDF4", text: "#27AE60" },
  executor: { bg: "#FFF1F2", text: "#C0392B" },
  viewer: { bg: "#F4F6F8", text: "#A0AEC0" },
};

const roleDescriptions: Record<string, string> = {
  admin: "Full system access — no restrictions",
  initiator: "Can create and submit payment requests",
  reviewer: "Can review and flag payments",
  approver: "Can approve payment requests",
  executor: "Can execute approved payments",
  viewer: "Read-only access — cannot make payments",
};

export default function TransferLimitsPage() {
  const router = useRouter();
  const [limits, setLimits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    dailyLimit: "",
    perTxLimit: "",
    monthlyLimit: "",
  });

  useEffect(() => {
    fetchLimits();
  }, []);

  async function fetchLimits() {
    try {
      const res = await fetch("/api/transfer-limits");
      const data = await res.json();
      setLimits(data.limits ?? []);
    } catch (error) {
      console.error("Failed to fetch limits:", error);
    } finally {
      setLoading(false);
    }
  }

  function startEditing(limit: any) {
    setEditingId(limit.id);
    setEditForm({
      dailyLimit: limit.dailyLimit >= 999999999 ? "" : String(limit.dailyLimit),
      perTxLimit: limit.perTxLimit >= 999999999 ? "" : String(limit.perTxLimit),
      monthlyLimit: limit.monthlyLimit >= 999999999 ? "" : String(limit.monthlyLimit),
    });
  }

  async function handleSave(id: string, isActive: boolean) {
    await fetch("/api/transfer-limits", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        isActive,
        dailyLimit: editForm.dailyLimit ? Number(editForm.dailyLimit) : 999999999,
        perTxLimit: editForm.perTxLimit ? Number(editForm.perTxLimit) : 999999999,
        monthlyLimit: editForm.monthlyLimit ? Number(editForm.monthlyLimit) : 999999999,
      }),
    });
    setEditingId(null);
    fetchLimits();
  }

  async function handleToggleActive(id: string, limit: any) {
    await fetch("/api/transfer-limits", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        isActive: !limit.isActive,
        dailyLimit: limit.dailyLimit,
        perTxLimit: limit.perTxLimit,
        monthlyLimit: limit.monthlyLimit,
      }),
    });
    fetchLimits();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">

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
        <h2 className="text-lg font-bold text-[#1A202C]">Transfer Limits</h2>
        <p className="text-xs text-[#718096] mt-0.5">
          Set maximum payment amounts per user role
        </p>
      </div>

      {/* Info Card */}
      <Card className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F0FDF4] shadow-sm">
        <div className="flex items-start gap-3">
          <Shield size={16} className="text-[#1B4332] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-[#1B4332]">
              How Transfer Limits Work
            </p>
            <p className="text-xs text-[#718096] mt-0.5 leading-relaxed">
              Limits restrict the maximum payment value a role can process.
              Leave blank for unlimited. Viewer role cannot initiate payments.
            </p>
          </div>
        </div>
      </Card>

      {/* Limits List */}
      {loading ? (
        <div className="py-12 text-center text-sm text-[#A0AEC0]">
          Loading transfer limits...
        </div>
      ) : (
        <div className="space-y-3">
          {limits.map((limit) => {
            const roleColor = roleColors[limit.role] ?? roleColors.viewer;
            const isEditing = editingId === limit.id;

            return (
              <Card
                key={limit.id}
                className={`p-5 rounded-xl border shadow-sm transition-all ${
                  limit.isActive
                    ? "border-[#E2E8F0] bg-white"
                    : "border-[#E2E8F0] bg-[#F4F6F8] opacity-60"
                }`}
              >
                {/* Role Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="px-3 py-1.5 rounded-xl text-xs font-bold capitalize"
                      style={{ backgroundColor: roleColor.bg, color: roleColor.text }}
                    >
                      {limit.role}
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                        limit.isActive
                          ? "bg-[#F0FDF4] text-[#27AE60]"
                          : "bg-[#F4F6F8] text-[#A0AEC0]"
                      }`}
                    >
                      {limit.isActive ? "Active" : "Disabled"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {!isEditing && limit.role !== "viewer" && (
                      <button
                        onClick={() => startEditing(limit)}
                        className="w-7 h-7 rounded-lg bg-[#EFF6FF] flex items-center justify-center hover:bg-[#BFDBFE] transition-colors"
                      >
                        <Edit2 size={12} className="text-[#2980B9]" />
                      </button>
                    )}
                    {isEditing && (
                      <>
                        <button
                          onClick={() => handleSave(limit.id, limit.isActive)}
                          className="w-7 h-7 rounded-lg bg-[#F0FDF4] flex items-center justify-center hover:bg-[#BBF7D0] transition-colors"
                        >
                          <Check size={12} className="text-[#27AE60]" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="w-7 h-7 rounded-lg bg-[#FFF1F2] flex items-center justify-center hover:bg-[#FFC5C5] transition-colors"
                        >
                          <X size={12} className="text-[#C0392B]" />
                        </button>
                      </>
                    )}
                    {limit.role !== "admin" && limit.role !== "viewer" && (
                      <button
                        onClick={() => handleToggleActive(limit.id, limit)}
                        className={`text-[10px] font-semibold px-2 py-1 rounded-lg transition-all ${
                          limit.isActive
                            ? "bg-[#FFF1F2] text-[#C0392B] hover:bg-[#FFC5C5]"
                            : "bg-[#F0FDF4] text-[#27AE60] hover:bg-[#BBF7D0]"
                        }`}
                      >
                        {limit.isActive ? "Disable" : "Enable"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-[#718096] mb-4">
                  {roleDescriptions[limit.role]}
                </p>

                {/* Limits Grid */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Per Transaction", key: "perTxLimit", value: limit.perTxLimit },
                    { label: "Daily Limit", key: "dailyLimit", value: limit.dailyLimit },
                    { label: "Monthly Limit", key: "monthlyLimit", value: limit.monthlyLimit },
                  ].map(({ label, key, value }) => (
                    <div
                      key={key}
                      className="p-3 rounded-xl bg-[#F4F6F8] border border-[#E2E8F0]"
                    >
                      <p className="text-[10px] text-[#A0AEC0] mb-1">{label}</p>
                      {isEditing ? (
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#718096]">
                            R
                          </span>
                          <Input
                            type="number"
                            placeholder="Unlimited"
                            value={(editForm as any)[key]}
                            onChange={(e) =>
                              setEditForm({ ...editForm, [key]: e.target.value })
                            }
                            className="bg-white border-[#E2E8F0] rounded-lg text-xs h-8 pl-5"
                          />
                        </div>
                      ) : (
                        <p
                          className="text-sm font-bold"
                          style={{ color: roleColor.text }}
                        >
                          {formatZAR(value)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
