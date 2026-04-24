"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSessionStore } from "@/store/session-store";
import {
  ChevronLeft,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Loader2,
} from "lucide-react";

const CLOSE_REASONS = [
  "Switching to another platform",
  "Business is closing down",
  "Too expensive",
  "Missing features I need",
  "Poor customer support",
  "Compliance or regulatory concerns",
  "Other",
];

export default function CloseAccountPage() {
  const router  = useRouter();
  const { role, name, orgName } = useSessionStore();

  const [reason,           setReason]           = useState("");
  const [details,          setDetails]          = useState("");
  const [confirmedOrgName, setConfirmedOrgName] = useState("");
  const [understood,       setUnderstood]       = useState(false);
  const [loading,          setLoading]          = useState(false);
  const [error,            setError]            = useState("");
  const [submitted,        setSubmitted]        = useState(false);

  // Only admins may submit this form
  const isAdmin = role === "admin";

  const canSubmit =
    isAdmin &&
    reason !== "" &&
    confirmedOrgName.trim().toLowerCase() === (orgName ?? "").trim().toLowerCase() &&
    understood &&
    !loading;

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/close-account-request", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ reason, details, confirmedOrgName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <button
          onClick={() => router.push("/settings")}
          className="flex items-center gap-1.5 text-sm text-[#718096] hover:text-[#1A202C] transition-colors mb-2"
        >
          <ChevronLeft size={16} /> Back to Settings
        </button>

        <Card className="p-8 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm text-center">
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-full bg-[#F0FDF4] flex items-center justify-center">
              <CheckCircle2 size={32} className="text-[#27AE60]" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-[#1A202C] mb-3">Request received</h2>
          <p className="text-sm text-[#718096] leading-relaxed max-w-sm mx-auto mb-6">
            We've sent a confirmation to your email and notified the OneBank TMS team. Someone will
            contact you within <strong className="text-[#1A202C]">5 business days</strong> to
            guide you through the offboarding process.
          </p>
          <p className="text-sm text-[#718096] leading-relaxed max-w-sm mx-auto mb-8">
            Your account remains fully active until the process is complete. If you've changed your
            mind, reply to the confirmation email or contact us at{" "}
            <a href="mailto:hello@onebank.co.za" className="text-[#1B4332] font-medium">
              hello@onebank.co.za
            </a>
            .
          </p>
          <button
            onClick={() => router.push("/settings")}
            className="px-6 py-2.5 rounded-xl bg-[#1B4332] text-white text-sm font-semibold hover:bg-[#2D6A4F] transition-colors"
          >
            Back to Settings
          </button>
        </Card>
        <div className="h-24 lg:h-4" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/settings")}
          className="flex items-center gap-1.5 text-sm text-[#718096] hover:text-[#1A202C] transition-colors"
        >
          <ChevronLeft size={16} /> Back
        </button>
      </div>

      <div>
        <h1 className="text-xl font-bold text-[#1A202C]">Close Account</h1>
        <p className="text-sm text-[#718096] mt-1">
          Request permanent closure of your organisation's account
        </p>
      </div>

      {/* Non-admin gate */}
      {!isAdmin ? (
        <Card className="p-6 rounded-2xl border border-[#FED7D7] bg-[#FFF5F5] shadow-sm">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-[#FED7D7] flex items-center justify-center flex-shrink-0">
              <ShieldAlert size={20} className="text-[#C0392B]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#C0392B] mb-1">Admin access required</p>
              <p className="text-sm text-[#718096] leading-relaxed">
                Only the organisation admin can submit a closure request. Please contact your
                administrator if you need this action taken.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* Warning banner */}
          <Card className="p-5 rounded-2xl border border-[#FED7D7] bg-[#FFF5F5] shadow-sm">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-[#FED7D7] flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle size={20} className="text-[#C0392B]" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-bold text-[#C0392B]">Before you continue</p>
                <ul className="text-sm text-[#718096] leading-relaxed space-y-1.5 list-disc list-inside">
                  <li>This is a <strong className="text-[#1A202C]">request</strong> — your account stays active until our team completes the review.</li>
                  <li>Per South African financial regulations, transaction and payment records are <strong className="text-[#1A202C]">retained for 7 years</strong> after closure.</li>
                  <li>All pending or approved payments must be resolved before closure can proceed.</li>
                  <li>You will receive a full data export before your account is deactivated.</li>
                  <li>This action affects <strong className="text-[#1A202C]">all users</strong> in your organisation.</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Form card */}
          <Card className="p-5 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm space-y-5">

            {/* Reason */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#1A202C]">
                Reason for closing <span className="text-[#C0392B]">*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full h-11 rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] transition-colors"
              >
                <option value="">Select a reason…</option>
                {CLOSE_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Additional details */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#1A202C]">
                Additional details{" "}
                <span className="text-xs font-normal text-[#A0AEC0]">(optional)</span>
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                placeholder="Help us understand so we can improve the platform…"
                className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-[#1A202C] placeholder:text-[#A0AEC0] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] transition-colors resize-none"
              />
            </div>

            {/* Org name confirmation */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#1A202C]">
                Type your organisation name to confirm{" "}
                <span className="text-[#C0392B]">*</span>
              </label>
              <p className="text-xs text-[#A0AEC0]">
                Type exactly: <strong className="text-[#1A202C]">{orgName}</strong>
              </p>
              <Input
                value={confirmedOrgName}
                onChange={(e) => setConfirmedOrgName(e.target.value)}
                placeholder={orgName ?? "Organisation name"}
                className={`h-11 rounded-xl text-sm transition-colors ${
                  confirmedOrgName && confirmedOrgName.trim().toLowerCase() !== (orgName ?? "").trim().toLowerCase()
                    ? "border-[#FC8181] focus:border-[#C0392B]"
                    : ""
                }`}
              />
              {confirmedOrgName &&
                confirmedOrgName.trim().toLowerCase() !== (orgName ?? "").trim().toLowerCase() && (
                  <p className="text-xs text-[#C0392B]">Name doesn't match — please check the spelling.</p>
                )}
            </div>

            {/* Understood checkbox */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={understood}
                  onChange={(e) => setUnderstood(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                    understood
                      ? "bg-[#C0392B] border-[#C0392B]"
                      : "bg-white border-[#CBD5E0] group-hover:border-[#C0392B]"
                  }`}
                >
                  {understood && (
                    <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                      <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-[#718096] leading-relaxed">
                I understand that this request will close the{" "}
                <strong className="text-[#1A202C]">{orgName}</strong> account, affect all{" "}
                users in my organisation, and that financial records will be retained for
                regulatory compliance purposes.
              </span>
            </label>

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-[#FFF5F5] border border-[#FED7D7] px-4 py-3 text-sm text-[#C0392B]">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                canSubmit
                  ? "bg-[#C0392B] text-white hover:bg-[#A93226] active:scale-[0.98]"
                  : "bg-[#F4F6F8] text-[#A0AEC0] cursor-not-allowed"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Submitting…
                </>
              ) : (
                "Submit Closure Request"
              )}
            </button>
          </Card>

          {/* Help */}
          <p className="text-center text-xs text-[#A0AEC0] pb-2">
            Having trouble or want to speak to someone first?{" "}
            <a href="mailto:hello@onebank.co.za" className="text-[#1B4332] font-medium hover:underline">
              hello@onebank.co.za
            </a>
          </p>
        </>
      )}

      <div className="h-24 lg:h-4" />
    </div>
  );
}
