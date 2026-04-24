"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2, CheckCircle, XCircle } from "lucide-react";

function validate(password: string, confirmPassword: string): string | null {
  if (password.length < 8)          return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password))      return "Password must contain at least one uppercase letter.";
  if (!/[0-9]/.test(password))      return "Password must contain at least one number.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must contain at least one special character.";
  if (password !== confirmPassword)  return "Passwords do not match.";
  return null;
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const token        = searchParams.get("token");

  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [success,         setSuccess]         = useState(false);
  const [error,           setError]           = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("No reset token found. Please request a new reset link.");
      return;
    }

    const validationError = validate(password, confirmPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col items-center justify-center p-6">

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        <div className="h-2 bg-[#1B4332]" />

        <div className="px-8 py-10">

          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 min-w-[36px] rounded-full bg-[#D4A017] flex items-center justify-center font-bold text-[#1B4332] text-sm flex-shrink-0">
              OB
            </div>
            <div>
              <p className="font-bold text-sm text-[#1A202C] leading-tight">OneBank TMS</p>
              <p className="text-[10px] text-[#718096]">B2B Treasury Management</p>
            </div>
          </div>

          {/* ── No token in URL ── */}
          {!token ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-[#FFF1F2] flex items-center justify-center mx-auto mb-5">
                <XCircle size={28} className="text-[#C0392B]" />
              </div>
              <h1 className="text-xl font-bold text-[#1A202C] mb-2">Invalid reset link</h1>
              <p className="text-sm text-[#718096] leading-relaxed mb-6">
                This link is missing a reset token. Please request a new password reset.
              </p>
              <Link
                href="/forgot-password"
                className="inline-block w-full h-12 bg-[#1B4332] text-white rounded-xl font-semibold text-sm hover:bg-[#2D6A4F] transition-colors leading-[48px] text-center"
              >
                Request New Link
              </Link>
            </div>

          ) : success ? (
            /* ── Success state ── */
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-[#F0FAF4] flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={28} className="text-[#27AE60]" />
              </div>
              <h1 className="text-xl font-bold text-[#1A202C] mb-2">Password updated!</h1>
              <p className="text-sm text-[#718096] leading-relaxed mb-8">
                Your password has been changed successfully. You can now sign in with your new password.
              </p>
              <button
                onClick={() => router.push("/login")}
                className="w-full h-12 bg-[#1B4332] text-white rounded-xl font-semibold text-sm hover:bg-[#2D6A4F] transition-colors"
              >
                Go to Sign In
              </button>
            </div>

          ) : (
            /* ── Form state ── */
            <>
              <div className="mb-7">
                <h1 className="text-2xl font-bold text-[#1A202C] mb-1">Set new password</h1>
                <p className="text-sm text-[#718096]">Choose a strong password for your account.</p>
              </div>

              {error && (
                <div className="mb-5 px-4 py-3 rounded-xl bg-[#FFF1F2] border border-[#FFC5C5] text-sm text-[#C0392B]">
                  {error}{" "}
                  {error.includes("expired") && (
                    <Link href="/forgot-password" className="font-semibold underline">
                      Request a new link
                    </Link>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>

                {/* New Password */}
                <div>
                  <label className="text-xs font-semibold text-[#1A202C] mb-1.5 block">
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 chars, uppercase, number, symbol"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-white border-[#E2E8F0] rounded-xl text-sm h-12 pr-10"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0AEC0] hover:text-[#718096]"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Strength indicators */}
                  {password.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {[
                        { label: "8+ chars",  ok: password.length >= 8 },
                        { label: "Uppercase", ok: /[A-Z]/.test(password) },
                        { label: "Number",    ok: /[0-9]/.test(password) },
                        { label: "Symbol",    ok: /[^A-Za-z0-9]/.test(password) },
                      ].map(({ label, ok }) => (
                        <span
                          key={label}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            ok ? "bg-[#F0FAF4] text-[#27AE60]" : "bg-[#F4F6F8] text-[#A0AEC0]"
                          }`}
                        >
                          {ok ? "✓" : "·"} {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="text-xs font-semibold text-[#1A202C] mb-1.5 block">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Re-enter your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`bg-white border-[#E2E8F0] rounded-xl text-sm h-12 pr-10 ${
                        confirmPassword.length > 0 && confirmPassword !== password
                          ? "border-[#FFC5C5]"
                          : ""
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0AEC0] hover:text-[#718096]"
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && confirmPassword !== password && (
                    <p className="text-[11px] text-[#C0392B] mt-1.5">Passwords do not match.</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-[#1B4332] text-white rounded-xl font-semibold text-sm hover:bg-[#2D6A4F] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Updating password…
                    </>
                  ) : (
                    "Update Password"
                  )}
                </button>
              </form>

              <p className="text-sm text-[#718096] mt-6 text-center">
                <Link href="/login" className="font-semibold text-[#1B4332] hover:underline">
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

      <p className="text-xs text-[#A0AEC0] mt-6 text-center">
        © 2026 OneBank TMS •{" "}
        <a href="mailto:hello@onebank.co.za" className="hover:text-[#1B4332] transition-colors">
          hello@onebank.co.za
        </a>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center">
        <Loader2 size={32} className="text-[#1B4332] animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
