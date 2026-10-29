"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2, CheckCircle, XCircle } from "lucide-react";

const roleLabels: Record<string, string> = {
  admin:     "Administrator",
  approver:  "Approver",
  initiator: "Initiator",
  reviewer:  "Reviewer",
  executor:  "Executor",
  viewer:    "Viewer",
};

function validate(password: string, confirmPassword: string): string | null {
  if (password.length < 8)              return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password))          return "Password must contain at least one uppercase letter.";
  if (!/[0-9]/.test(password))          return "Password must contain at least one number.";
  if (!/[^A-Za-z0-9]/.test(password))  return "Password must contain at least one special character.";
  if (password !== confirmPassword)     return "Passwords do not match.";
  return null;
}

type InviteState = "loading" | "ready" | "invalid" | "success";

interface InviteInfo {
  email:   string;
  role:    string;
  orgName: string;
}

function InviteContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const token        = searchParams.get("token");

  const [state,           setState]           = useState<InviteState>("loading");
  const [invite,          setInvite]          = useState<InviteInfo | null>(null);
  const [invalidMessage,  setInvalidMessage]  = useState("");
  const [firstName,       setFirstName]       = useState("");
  const [lastName,        setLastName]        = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [submitting,      setSubmitting]      = useState(false);
  const [error,           setError]           = useState("");

  // ── Validate token on mount ──────────────────────────────────────────────
  useEffect(() => {
    if (!token) {
      setState("invalid");
      setInvalidMessage("No invite token found in this link.");
      return;
    }

    async function validate() {
      try {
        const res  = await fetch(`/api/auth/validate-invite?token=${token}`);
        const data = await res.json();

        if (data.valid) {
          setInvite({ email: data.email, role: data.role, orgName: data.orgName });
          setState("ready");
        } else {
          setState("invalid");
          setInvalidMessage(data.error ?? "This invite link is invalid or has expired.");
        }
      } catch {
        setState("invalid");
        setInvalidMessage("Network error. Please check your connection.");
      }
    }

    validate();
  }, [token]);

  // ── Accept invite ────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const validationError = validate(password, confirmPassword);
    if (validationError) { setError(validationError); return; }
    if (!firstName.trim()) { setError("First name is required."); return; }
    if (!lastName.trim())  { setError("Last name is required.");  return; }

    setSubmitting(true);
    try {
      const res  = await fetch("/api/auth/accept-invite", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, firstName, lastName, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setState("success");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col items-center justify-center p-6">

      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        <div className="h-2 bg-[#1B4332]" />

        <div className="px-8 py-10">

          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 min-w-[36px] rounded-full bg-[#D4A017] flex items-center justify-center font-bold text-[#1B4332] text-sm flex-shrink-0">
              OV
            </div>
            <div>
              <p className="font-bold text-sm text-[#1A202C] leading-tight">OneView</p>
              <p className="text-[10px] text-[#718096]">B2B Treasury Management</p>
            </div>
          </div>

          {/* ── Loading ── */}
          {state === "loading" && (
            <div className="text-center py-6">
              <Loader2 size={32} className="text-[#1B4332] animate-spin mx-auto mb-4" />
              <p className="text-sm text-[#718096]">Validating your invitation…</p>
            </div>
          )}

          {/* ── Invalid ── */}
          {state === "invalid" && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-[#FFF1F2] flex items-center justify-center mx-auto mb-5">
                <XCircle size={28} className="text-[#C0392B]" />
              </div>
              <h1 className="text-xl font-bold text-[#1A202C] mb-2">Invalid invitation</h1>
              <p className="text-sm text-[#718096] leading-relaxed mb-6">{invalidMessage}</p>
              <Link
                href="/login"
                className="inline-block w-full h-12 bg-[#1B4332] text-white rounded-xl font-semibold text-sm hover:bg-[#2D6A4F] transition-colors leading-[48px] text-center"
              >
                Go to Sign In
              </Link>
            </div>
          )}

          {/* ── Success ── */}
          {state === "success" && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-[#F0FAF4] flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={28} className="text-[#27AE60]" />
              </div>
              <h1 className="text-xl font-bold text-[#1A202C] mb-2">You're all set!</h1>
              <p className="text-sm text-[#718096] leading-relaxed mb-8">
                Your account has been activated. Sign in to access your{" "}
                <strong className="text-[#1A202C]">{invite?.orgName}</strong> dashboard.
              </p>
              <button
                onClick={() => router.push("/login")}
                className="w-full h-12 bg-[#1B4332] text-white rounded-xl font-semibold text-sm hover:bg-[#2D6A4F] transition-colors"
              >
                Go to Sign In
              </button>
            </div>
          )}

          {/* ── Ready: Accept form ── */}
          {state === "ready" && invite && (
            <>
              {/* Invite banner */}
              <div className="bg-[#F0FAF4] border border-[#C6E8D3] rounded-xl px-4 py-3 mb-6">
                <p className="text-sm font-semibold text-[#1B4332] mb-0.5">
                  You've been invited to join <span className="text-[#D4A017]">{invite.orgName}</span>
                </p>
                <p className="text-xs text-[#718096]">
                  as <strong className="text-[#1A202C]">{roleLabels[invite.role] ?? invite.role}</strong>
                  {" · "}{invite.email}
                </p>
              </div>

              <div className="mb-6">
                <h1 className="text-2xl font-bold text-[#1A202C] mb-1">Set up your account</h1>
                <p className="text-sm text-[#718096]">Choose your name and a secure password to get started.</p>
              </div>

              {error && (
                <div className="mb-5 px-4 py-3 rounded-xl bg-[#FFF1F2] border border-[#FFC5C5] text-sm text-[#C0392B]">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>

                {/* First + Last name */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#1A202C] mb-1.5 block">First Name</label>
                    <Input
                      type="text"
                      placeholder="Thabo"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="bg-white border-[#E2E8F0] rounded-xl text-sm h-12"
                      required
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#1A202C] mb-1.5 block">Last Name</label>
                    <Input
                      type="text"
                      placeholder="Nkosi"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="bg-white border-[#E2E8F0] rounded-xl text-sm h-12"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-xs font-semibold text-[#1A202C] mb-1.5 block">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 chars, uppercase, number, symbol"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-white border-[#E2E8F0] rounded-xl text-sm h-12 pr-10"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0AEC0] hover:text-[#718096]">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {[
                        { label: "8+ chars",  ok: password.length >= 8 },
                        { label: "Uppercase", ok: /[A-Z]/.test(password) },
                        { label: "Number",    ok: /[0-9]/.test(password) },
                        { label: "Symbol",    ok: /[^A-Za-z0-9]/.test(password) },
                      ].map(({ label, ok }) => (
                        <span key={label}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ok ? "bg-[#F0FAF4] text-[#27AE60]" : "bg-[#F4F6F8] text-[#A0AEC0]"}`}>
                          {ok ? "✓" : "·"} {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="text-xs font-semibold text-[#1A202C] mb-1.5 block">Confirm Password</label>
                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`bg-white border-[#E2E8F0] rounded-xl text-sm h-12 pr-10 ${
                        confirmPassword.length > 0 && confirmPassword !== password ? "border-[#FFC5C5]" : ""
                      }`}
                      required
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0AEC0] hover:text-[#718096]">
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && confirmPassword !== password && (
                    <p className="text-[11px] text-[#C0392B] mt-1.5">Passwords do not match.</p>
                  )}
                </div>

                <button type="submit" disabled={submitting}
                  className="w-full h-12 bg-[#1B4332] text-white rounded-xl font-semibold text-sm hover:bg-[#2D6A4F] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
                  {submitting ? (
                    <><Loader2 size={16} className="animate-spin" /> Activating account…</>
                  ) : "Accept Invitation"}
                </button>
              </form>

              <p className="text-sm text-[#718096] mt-6 text-center">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-[#1B4332] hover:underline">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>

      <p className="text-xs text-[#A0AEC0] mt-6 text-center">
        © 2026 OneView •{" "}
        <a href="mailto:hello@oneview.co.za" className="hover:text-[#1B4332] transition-colors">
          hello@oneview.co.za
        </a>
      </p>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center">
        <Loader2 size={32} className="text-[#1B4332] animate-spin" />
      </div>
    }>
      <InviteContent />
    </Suspense>
  );
}
