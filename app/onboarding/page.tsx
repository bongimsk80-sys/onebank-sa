"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  Building2,
  Users,
  Sparkles,
  ArrowRight,
} from "lucide-react";

// ─── Bank definitions ─────────────────────────────────────────────────────────

const BANKS = [
  {
    id: "FNB",
    name: "FNB",
    fullName: "First National Bank",
    color: "#006B3C",
    abbr: "FNB",
  },
  {
    id: "Standard Bank",
    name: "Standard Bank",
    fullName: "Standard Bank",
    color: "#0033A0",
    abbr: "STD",
  },
  {
    id: "Absa",
    name: "Absa",
    fullName: "Absa Bank",
    color: "#DC0032",
    abbr: "ABSA",
  },
  {
    id: "Nedbank",
    name: "Nedbank",
    fullName: "Nedbank",
    color: "#007B40",
    abbr: "NED",
  },
  {
    id: "Capitec",
    name: "Capitec",
    fullName: "Capitec Bank",
    color: "#007DC5",
    abbr: "CAP",
  },
];

const ROLES = ["Initiator", "Reviewer", "Approver", "Executor", "Viewer"];

// ─── Types ────────────────────────────────────────────────────────────────────

interface BankSelection {
  selected: boolean;
  accountNumber: string;
}

interface InviteRow {
  id: string;
  email: string;
  role: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  const steps = [
    { num: 1, label: "Banks",  icon: Building2 },
    { num: 2, label: "Team",   icon: Users },
    { num: 3, label: "Ready",  icon: Sparkles },
  ];

  return (
    <div className="flex items-center gap-0 w-full max-w-xs mx-auto">
      {steps.map((s, i) => {
        const Icon = s.icon;
        const done    = step > s.num;
        const current = step === s.num;
        return (
          <div key={s.num} className="flex items-center flex-1">
            {/* Circle */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                  done
                    ? "bg-[#1B4332] text-white"
                    : current
                    ? "bg-[#1B4332] text-white ring-4 ring-[#1B4332]/20"
                    : "bg-[#E2E8F0] text-[#A0AEC0]"
                }`}
              >
                {done ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <Icon size={16} />
                )}
              </div>
              <span
                className={`text-[10px] font-semibold tracking-wide ${
                  current ? "text-[#1B4332]" : done ? "text-[#1B4332]" : "text-[#A0AEC0]"
                }`}
              >
                {s.label}
              </span>
            </div>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 mb-5 relative overflow-hidden rounded-full bg-[#E2E8F0]">
                <div
                  className="absolute inset-y-0 left-0 bg-[#1B4332] transition-all duration-500"
                  style={{ width: step > s.num ? "100%" : "0%" }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Animated checkmark for Step 3
function AnimatedCheck() {
  const [visible, setVisible] = useState(false);
  const [scaled, setScaled]   = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 100);
    const t2 = setTimeout(() => setScaled(true), 200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div
      className={`w-28 h-28 rounded-full bg-[#1B4332] flex items-center justify-center mx-auto transition-all duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      } ${scaled ? "scale-100" : "scale-50"}`}
    >
      <CheckCircle2
        size={56}
        className={`text-white transition-all duration-300 delay-300 ${
          scaled ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

// ─── Main wizard ─────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();

  const [step, setStep]         = useState(1);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  // Step 1 state
  const [banks, setBanks] = useState<Record<string, BankSelection>>(
    Object.fromEntries(BANKS.map((b) => [b.id, { selected: false, accountNumber: "" }]))
  );

  // Step 2 state
  const [invites, setInvites] = useState<InviteRow[]>([
    { id: crypto.randomUUID(), email: "", role: "Viewer" },
  ]);

  const orgName = (session?.user as any)?.orgName ?? "your organisation";

  // ── Role guard: only admins run onboarding ─────────────────────────────────
  // Non-admin users (e.g. invited viewers) should never land here.
  useEffect(() => {
    if (!session) return; // still loading
    const role = (session.user as any)?.role;
    if (role && role !== "admin") {
      router.replace("/overview");
    }
  }, [session, router]);

  // ── Bank helpers ────────────────────────────────────────────────────────────
  function toggleBank(id: string) {
    setBanks((prev) => ({
      ...prev,
      [id]: { ...prev[id], selected: !prev[id].selected },
    }));
  }

  function setAccountNumber(id: string, value: string) {
    setBanks((prev) => ({
      ...prev,
      [id]: { ...prev[id], accountNumber: value },
    }));
  }

  const selectedBanks = BANKS.filter((b) => banks[b.id].selected);

  // ── Invite helpers ──────────────────────────────────────────────────────────
  function addInviteRow() {
    setInvites((prev) => [
      ...prev,
      { id: crypto.randomUUID(), email: "", role: "Viewer" },
    ]);
  }

  function removeInviteRow(id: string) {
    setInvites((prev) => prev.filter((r) => r.id !== id));
  }

  function updateInviteRow(id: string, field: "email" | "role", value: string) {
    setInvites((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  }

  const filledInvites = invites.filter(
    (r) => r.email.trim().length > 0 && r.email.includes("@")
  );

  // ── Navigation ──────────────────────────────────────────────────────────────
  async function handleNext() {
    if (step < 3) {
      setStep((s) => s + 1);
      return;
    }
    await handleComplete();
  }

  async function handleSkip() {
    if (step === 3) {
      await handleComplete();
    } else {
      setStep((s) => s + 1);
    }
  }

  async function handleComplete() {
    setSaving(true);
    setError("");

    try {
      const payload = {
        banks: selectedBanks.map((b) => ({
          bank:          b.id,
          accountNumber: banks[b.id].accountNumber || `000000000${BANKS.indexOf(b) + 1}`,
        })),
        invites: filledInvites.map((r) => ({ email: r.email, role: r.role })),
      };

      const res = await fetch("/api/users/complete-onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Something went wrong");
      }

      // Update the JWT so subsequent page loads don't redirect here again.
      await updateSession({ hasCompletedOnboarding: true });

      router.push("/overview");
    } catch (err: any) {
      setError(err.message ?? "Failed to complete setup. Please try again.");
      setSaving(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-[#E2E8F0] px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#1B4332] flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
              OV
            </div>
            <div>
              <p className="font-bold text-sm text-[#1A202C] leading-tight">OneView</p>
              <p className="text-[10px] text-[#A0AEC0]">Treasury Management</p>
            </div>
          </div>

          <span className="text-xs text-[#A0AEC0] font-medium">
            Step {step} of 3
          </span>
        </div>
      </header>

      {/* ── Progress ───────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E2E8F0] px-6 py-5">
        <div className="max-w-2xl mx-auto">
          <ProgressBar step={step} />
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-2xl">

          {/* ─────────────────── STEP 1: Banks ──────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div>
                <h1 className="text-2xl font-bold text-[#1A202C]">
                  Which banks does your company use?
                </h1>
                <p className="text-sm text-[#718096] mt-1">
                  Select all that apply. You can add more later from the Accounts page.
                </p>
              </div>

              {/* Bank grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {BANKS.map((bank) => {
                  const sel = banks[bank.id].selected;
                  return (
                    <div
                      key={bank.id}
                      onClick={() => toggleBank(bank.id)}
                      className={`rounded-2xl border-2 p-4 cursor-pointer transition-all duration-200 select-none ${
                        sel
                          ? "border-[#1B4332] bg-[#F0FDF4] shadow-sm"
                          : "border-[#E2E8F0] bg-white hover:border-[#CBD5E0]"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                          style={{ backgroundColor: bank.color }}
                        >
                          {bank.abbr}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-[#1A202C] truncate">
                            {bank.fullName}
                          </p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            sel
                              ? "bg-[#1B4332] border-[#1B4332]"
                              : "border-[#CBD5E0] bg-white"
                          }`}
                        >
                          {sel && (
                            <svg viewBox="0 0 12 9" fill="none" className="w-3 h-2">
                              <path
                                d="M1 4.5L4.5 8L11 1"
                                stroke="white"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                      </div>

                      {/* Account number input — shown only when selected */}
                      {sel && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            placeholder="Account number (optional)"
                            value={banks[bank.id].accountNumber}
                            onChange={(e) => setAccountNumber(bank.id, e.target.value)}
                            className="w-full h-9 px-3 text-xs rounded-lg border border-[#CBD5E0] bg-white text-[#1A202C] placeholder:text-[#A0AEC0] focus:outline-none focus:border-[#1B4332] transition-colors"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {selectedBanks.length > 0 && (
                <p className="text-xs text-[#1B4332] font-medium">
                  {selectedBanks.length} bank{selectedBanks.length > 1 ? "s" : ""} selected
                </p>
              )}
            </div>
          )}

          {/* ─────────────────── STEP 2: Team ───────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div>
                <h1 className="text-2xl font-bold text-[#1A202C]">
                  Who else needs access?
                </h1>
                <p className="text-sm text-[#718096] mt-1">
                  Invite your treasury team. They&apos;ll receive an email to set their password.
                </p>
              </div>

              {/* Role reference */}
              <div className="bg-[#FFFBEB] border border-[#D4A017]/30 rounded-xl px-4 py-3 flex flex-wrap gap-x-4 gap-y-1">
                {[
                  { role: "Initiator",  desc: "Creates payments" },
                  { role: "Approver",   desc: "Approves payments" },
                  { role: "Executor",   desc: "Executes payments" },
                  { role: "Reviewer",   desc: "Reviews & audits" },
                  { role: "Viewer",     desc: "Read-only access" },
                ].map((r) => (
                  <span key={r.role} className="text-xs text-[#92400E]">
                    <span className="font-semibold">{r.role}</span>
                    <span className="text-[#B45309]"> — {r.desc}</span>
                  </span>
                ))}
              </div>

              {/* Invite rows */}
              <div className="space-y-3">
                {invites.map((row, idx) => (
                  <div
                    key={row.id}
                    className="flex items-center gap-3 bg-white rounded-2xl border border-[#E2E8F0] px-4 py-3"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#F0FDF4] border border-[#1B4332]/20 flex items-center justify-center text-xs font-semibold text-[#1B4332] flex-shrink-0">
                      {idx + 1}
                    </div>

                    <input
                      type="email"
                      placeholder="colleague@company.co.za"
                      value={row.email}
                      onChange={(e) => updateInviteRow(row.id, "email", e.target.value)}
                      className="flex-1 min-w-0 h-9 px-3 text-sm rounded-lg border border-[#E2E8F0] bg-[#F4F6F8] text-[#1A202C] placeholder:text-[#A0AEC0] focus:outline-none focus:border-[#1B4332] transition-colors"
                    />

                    <select
                      value={row.role}
                      onChange={(e) => updateInviteRow(row.id, "role", e.target.value)}
                      className="h-9 px-2 pr-7 text-sm rounded-lg border border-[#E2E8F0] bg-[#F4F6F8] text-[#1A202C] focus:outline-none focus:border-[#1B4332] transition-colors appearance-none cursor-pointer"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23718096' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>

                    {invites.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeInviteRow(row.id)}
                        className="text-[#CBD5E0] hover:text-[#E53E3E] transition-colors flex-shrink-0"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add row button */}
              <button
                type="button"
                onClick={addInviteRow}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-[#D4A017]/50 text-[#D4A017] text-sm font-semibold hover:border-[#D4A017] hover:bg-[#FFFBEB] transition-all"
              >
                <Plus size={16} />
                Add another person
              </button>

              {filledInvites.length > 0 && (
                <p className="text-xs text-[#1B4332] font-medium">
                  {filledInvites.length} invitation{filledInvites.length > 1 ? "s" : ""} ready to send
                </p>
              )}
            </div>
          )}

          {/* ─────────────────── STEP 3: Ready ──────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 text-center">
              <AnimatedCheck />

              <div>
                <h1 className="text-3xl font-bold text-[#1A202C] mt-4">
                  You&apos;re all set!
                </h1>
                <p className="text-base text-[#718096] mt-2">
                  <span className="font-semibold text-[#1B4332]">{orgName}</span> is configured and ready to go.
                </p>
              </div>

              {/* Summary card */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] divide-y divide-[#F0F0F0] text-left max-w-md mx-auto overflow-hidden">

                {/* Banks summary */}
                <div className="px-5 py-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#F0FDF4] flex items-center justify-center flex-shrink-0">
                    <Building2 size={18} className="text-[#1B4332]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#1A202C] mb-1">Bank Accounts</p>
                    {selectedBanks.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedBanks.map((b) => (
                          <span
                            key={b.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-[11px] font-semibold"
                            style={{ backgroundColor: b.color }}
                          >
                            {b.abbr}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#A0AEC0]">No bank accounts added — you can add them from the Accounts page.</p>
                    )}
                  </div>
                </div>

                {/* Team summary */}
                <div className="px-5 py-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FFFBEB] flex items-center justify-center flex-shrink-0">
                    <Users size={18} className="text-[#D4A017]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#1A202C] mb-1">Team Invitations</p>
                    {filledInvites.length > 0 ? (
                      <div className="space-y-1">
                        {filledInvites.map((inv) => (
                          <p key={inv.id} className="text-xs text-[#718096]">
                            <span className="font-medium text-[#1A202C]">{inv.email}</span>
                            {" "}
                            <span className="text-[#A0AEC0]">·</span>
                            {" "}
                            <span className="text-[#1B4332] font-medium">{inv.role}</span>
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#A0AEC0]">No invitations — you can invite your team from the Users page.</p>
                    )}
                  </div>
                </div>

                {/* What's next */}
                <div className="px-5 py-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
                    <Sparkles size={18} className="text-[#3B82F6]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#1A202C] mb-1">What&apos;s next</p>
                    <ul className="space-y-0.5">
                      {[
                        "View consolidated cash positions on the dashboard",
                        "Create your first payment and approval workflow",
                        "Connect an ERP system (Sage, SAP, Oracle)",
                      ].map((item) => (
                        <li key={item} className="text-xs text-[#718096] flex items-start gap-1.5">
                          <span className="text-[#1B4332] mt-px">›</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {error && (
                <div className="max-w-md mx-auto px-4 py-3 rounded-xl bg-[#FFF1F2] border border-[#FFC5C5] text-sm text-[#C0392B] text-left">
                  {error}
                </div>
              )}

              {/* Go to Dashboard CTA */}
              <button
                onClick={handleComplete}
                disabled={saving}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#1B4332] text-white rounded-2xl font-semibold text-sm hover:bg-[#2D6A4F] transition-colors disabled:opacity-60 shadow-lg shadow-[#1B4332]/20 mx-auto"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Setting up…
                  </>
                ) : (
                  <>
                    Go to Dashboard
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          )}

          {/* ── Error banner (Steps 1 & 2) ────────────────────────────────── */}
          {error && step < 3 && (
            <div className="mt-4 px-4 py-3 rounded-xl bg-[#FFF1F2] border border-[#FFC5C5] text-sm text-[#C0392B]">
              {error}
            </div>
          )}

          {/* ── Bottom nav (Steps 1 & 2) ──────────────────────────────────── */}
          {step < 3 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={handleSkip}
                className="text-sm text-[#A0AEC0] hover:text-[#718096] transition-colors font-medium"
              >
                Skip this step
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-[#1B4332] text-white rounded-xl font-semibold text-sm hover:bg-[#2D6A4F] transition-colors disabled:opacity-60 shadow-md shadow-[#1B4332]/20"
              >
                {saving ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    {step === 2 ? "Review & Finish" : "Continue"}
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
