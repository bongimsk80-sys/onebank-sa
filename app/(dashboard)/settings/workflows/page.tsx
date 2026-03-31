"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Plus,
  Trash2,
  X,
  CheckCircle,
  XCircle,
  ChevronRight,
  Shield,
  Edit2,
} from "lucide-react";

function formatZAR(amount: number) {
  if (amount >= 999999999) return "Unlimited";
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 0,
  }).format(amount);
}

const availableSteps = [
  { id: "initiator", label: "Initiator", color: "#2980B9", bg: "#EFF6FF" },
  { id: "reviewer", label: "Reviewer", color: "#7C3AED", bg: "#F5F3FF" },
  { id: "approver", label: "Approver", color: "#27AE60", bg: "#F0FDF4" },
  { id: "executor", label: "Executor", color: "#E67E22", bg: "#FFF7ED" },
];

export default function WorkflowsPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<any>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    minAmount: "",
    maxAmount: "",
    steps: ["initiator", "approver", "executor"],
  });

  useEffect(() => {
    fetchWorkflows();
  }, []);

  async function fetchWorkflows() {
    try {
      const res = await fetch("/api/workflows");
      const data = await res.json();
      setWorkflows(data.workflows ?? []);
    } catch (error) {
      console.error("Failed to fetch workflows:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setError("");
    if (!form.name || !form.minAmount) {
      setError("Please fill in all required fields.");
      return;
    }
    if (form.steps.length < 2) {
      setError("Workflow must have at least 2 steps.");
      return;
    }

    try {
      const payload = {
        name: form.name,
        description: form.description,
        minAmount: Number(form.minAmount),
        maxAmount: form.maxAmount ? Number(form.maxAmount) : 999999999,
        steps: form.steps,
      };

      if (editingWorkflow) {
        await fetch("/api/workflows", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingWorkflow.id, ...payload }),
        });
      } else {
        await fetch("/api/workflows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      setShowAddForm(false);
      setEditingWorkflow(null);
      resetForm();
      fetchWorkflows();
    } catch (error) {
      setError("Failed to save workflow. Please try again.");
    }
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    await fetch("/api/workflows", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    fetchWorkflows();
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this workflow?")) return;
    await fetch("/api/workflows", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchWorkflows();
  }

  function handleEdit(workflow: any) {
    const steps = JSON.parse(workflow.steps);
    setForm({
      name: workflow.name,
      description: workflow.description,
      minAmount: String(workflow.minAmount),
      maxAmount: workflow.maxAmount >= 999999999 ? "" : String(workflow.maxAmount),
      steps,
    });
    setEditingWorkflow(workflow);
    setShowAddForm(true);
  }

  function resetForm() {
    setForm({
      name: "",
      description: "",
      minAmount: "",
      maxAmount: "",
      steps: ["initiator", "approver", "executor"],
    });
    setError("");
  }

  function toggleStep(stepId: string) {
    if (stepId === "initiator" || stepId === "executor") return;
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.includes(stepId)
        ? prev.steps.filter((s) => s !== stepId)
        : [...prev.steps.slice(0, -1), stepId, "executor"],
    }));
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1A202C]">
            Approval Workflows
          </h2>
          <p className="text-xs text-[#718096] mt-0.5">
            Configure multi-level payment approval chains
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1B4332] text-white text-xs font-semibold hover:bg-[#2D6A4F] transition-colors"
        >
          <Plus size={14} />
          New Workflow
        </button>
      </div>
      {/* Info Card */}
      <Card className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F0FDF4] shadow-sm">
        <div className="flex items-start gap-3">
          <Shield size={16} className="text-[#1B4332] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-[#1B4332]">
              How Workflows Work
            </p>
            <p className="text-xs text-[#718096] mt-0.5 leading-relaxed">
              Workflows define who must approve payments based on amount ranges.
              Each payment automatically follows the matching workflow based on
              its value.
            </p>
          </div>
        </div>
      </Card>
      {/* Workflows List */}
      {loading ? (
        <div className="py-12 text-center text-sm text-[#A0AEC0]">
          Loading workflows...
        </div>
      ) : (
        <div className="space-y-3">
          {workflows.map((workflow) => {
            const steps = JSON.parse(workflow.steps);
            return (
              <Card
                key={workflow.id}
                className={`p-5 rounded-xl border shadow-sm ${
                  workflow.isActive
                    ? "border-[#E2E8F0] bg-white"
                    : "border-[#E2E8F0] bg-[#F4F6F8] opacity-60"
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[#1A202C]">
                        {workflow.name}
                      </p>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                          workflow.isActive
                            ? "bg-[#F0FDF4] text-[#27AE60]"
                            : "bg-[#F4F6F8] text-[#A0AEC0]"
                        }`}
                      >
                        {workflow.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-xs text-[#718096] mt-0.5">
                      {workflow.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <button
                      onClick={() => handleEdit(workflow)}
                      className="w-7 h-7 rounded-lg bg-[#EFF6FF] flex items-center justify-center hover:bg-[#BFDBFE] transition-colors"
                    >
                      <Edit2 size={12} className="text-[#2980B9]" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(workflow.id, workflow.isActive)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                        workflow.isActive
                          ? "bg-[#FFF1F2] hover:bg-[#FFC5C5]"
                          : "bg-[#F0FDF4] hover:bg-[#BBF7D0]"
                      }`}
                    >
                      {workflow.isActive ? (
                        <XCircle size={12} className="text-[#C0392B]" />
                      ) : (
                        <CheckCircle size={12} className="text-[#27AE60]" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(workflow.id)}
                      className="w-7 h-7 rounded-lg bg-[#FFF1F2] flex items-center justify-center hover:bg-[#FFC5C5] transition-colors"
                    >
                      <Trash2 size={12} className="text-[#C0392B]" />
                    </button>
                  </div>
                </div>
                {/* Amount Range */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-[#F4F6F8] text-[#718096]">
                    {formatZAR(workflow.minAmount)} — {formatZAR(workflow.maxAmount)}
                  </span>
                </div>
                {/* Workflow Steps */}
                <div className="flex items-center gap-2 flex-wrap">
                  {steps.map((step: string, index: number) => {
                    const stepConfig = availableSteps.find((s) => s.id === step);
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold"
                          style={{
                            backgroundColor: stepConfig?.bg ?? "#F4F6F8",
                            color: stepConfig?.color ?? "#718096",
                          }}
                        >
                          <span className="w-4 h-4 rounded-full bg-white flex items-center justify-center text-[10px] font-bold"
                            style={{ color: stepConfig?.color }}
                          >
                            {index + 1}
                          </span>
                          {stepConfig?.label ?? step}
                        </div>
                        {index < steps.length - 1 && (
                          <ChevronRight size={12} className="text-[#A0AEC0]" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {/* Add/Edit Workflow Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4">
          <div className="bg-white w-full lg:max-w-lg rounded-t-3xl lg:rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
              <h2 className="text-base font-bold text-[#1A202C]">
                {editingWorkflow ? "Edit Workflow" : "New Workflow"}
              </h2>
              <button
                onClick={() => { setShowAddForm(false); setEditingWorkflow(null); resetForm(); }}
                className="w-8 h-8 rounded-full bg-[#F4F6F8] flex items-center justify-center"
              >
                <X size={16} className="text-[#718096]" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[75vh] px-6 py-5 space-y-5">
              {error && (
                <div className="px-4 py-3 rounded-xl bg-[#FFF1F2] border border-[#FFC5C5] text-sm text-[#C0392B]">
                  {error}
                </div>
              )}
              {/* Name */}
              <div>
                <label className="text-xs font-semibold text-[#718096] uppercase tracking-wide mb-1.5 block">
                  Workflow Name *
                </label>
                <Input
                  placeholder="e.g. Standard Payment"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-[#F4F6F8] border-[#E2E8F0] rounded-xl text-sm h-11"
                />
              </div>
              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-[#718096] uppercase tracking-wide mb-1.5 block">
                  Description
                </label>
                <Input
                  placeholder="e.g. For payments between R0 - R50,000"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="bg-[#F4F6F8] border-[#E2E8F0] rounded-xl text-sm h-11"
                />
              </div>
              {/* Amount Range */}
              <div>
                <label className="text-xs font-semibold text-[#718096] uppercase tracking-wide mb-1.5 block">
                  Amount Range (ZAR) *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-[#A0AEC0] mb-1 block">
                      Minimum
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#718096]">R</span>
                      <Input
                        type="number"
                        placeholder="0"
                        value={form.minAmount}
                        onChange={(e) => setForm({ ...form, minAmount: e.target.value })}
                        className="bg-[#F4F6F8] border-[#E2E8F0] rounded-xl text-sm h-11 pl-6"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-[#A0AEC0] mb-1 block">
                      Maximum (blank = unlimited)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#718096]">R</span>
                      <Input
                        type="number"
                        placeholder="Unlimited"
                        value={form.maxAmount}
                        onChange={(e) => setForm({ ...form, maxAmount: e.target.value })}
                        className="bg-[#F4F6F8] border-[#E2E8F0] rounded-xl text-sm h-11 pl-6"
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/* Workflow Steps */}
              <div>
                <label className="text-xs font-semibold text-[#718096] uppercase tracking-wide mb-1.5 block">
                  Approval Steps
                </label>
                <p className="text-[10px] text-[#A0AEC0] mb-3">
                  Initiator and Executor are always required. Toggle optional steps.
                </p>
                {/* Steps Preview */}
                <div className="flex items-center gap-2 flex-wrap mb-4 p-3 rounded-xl bg-[#F4F6F8]">
                  {form.steps.map((step, index) => {
                    const stepConfig = availableSteps.find((s) => s.id === step);
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold"
                          style={{
                            backgroundColor: stepConfig?.bg ?? "#F4F6F8",
                            color: stepConfig?.color ?? "#718096",
                          }}
                        >
                          <span className="w-4 h-4 rounded-full bg-white flex items-center justify-center text-[10px] font-bold"
                            style={{ color: stepConfig?.color }}
                          >
                            {index + 1}
                          </span>
                          {stepConfig?.label ?? step}
                        </div>
                        {index < form.steps.length - 1 && (
                          <ChevronRight size={12} className="text-[#A0AEC0]" />
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Toggle optional steps */}
                <div className="grid grid-cols-2 gap-2">
                  {availableSteps.map((step) => {
                    const isIncluded = form.steps.includes(step.id);
                    const isRequired = step.id === "initiator" || step.id === "executor";
                    return (
                      <button
                        key={step.id}
                        onClick={() => toggleStep(step.id)}
                        disabled={isRequired}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                          isRequired
                            ? "opacity-50 cursor-not-allowed bg-[#F4F6F8] border-transparent"
                            : isIncluded
                            ? "border-transparent text-white"
                            : "bg-[#F4F6F8] border-transparent text-[#718096]"
                        }`}
                        style={
                          isIncluded && !isRequired
                            ? { backgroundColor: step.color }
                            : isRequired && isIncluded
                            ? { backgroundColor: step.bg, color: step.color }
                            : {}
                        }
                      >
                        <span className="capitalize">{step.label}</span>
                        {isRequired ? (
                          <span className="text-[10px] opacity-60">Required</span>
                        ) : isIncluded ? (
                          <CheckCircle size={14} />
                        ) : (
                          <Plus size={14} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#E2E8F0] flex gap-3">
              <button
                onClick={() => { setShowAddForm(false); setEditingWorkflow(null); resetForm(); }}
                className="flex-1 h-11 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#718096]"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 h-11 rounded-xl bg-[#1B4332] text-white text-sm font-semibold hover:bg-[#2D6A4F] transition-colors"
              >
                {editingWorkflow ? "Save Changes" : "Create Workflow"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
