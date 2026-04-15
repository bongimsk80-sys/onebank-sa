"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("Please enter your email address.");
      return;
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      // Always show success — never leak whether email exists
      setSent(true);
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
              <p className="font-bold text-sm text-[#1A202C] leading-tight">OneBank SA</p>
              <p className="text-[10px] text-[#718096]">B2B Treasury Management</p>
            </div>
          </div>

          {sent ? (
            /* ── Success state ── */
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-[#F0FAF4] flex items-center justify-center mx-auto mb-5">
                <Mail size={28} className="text-[#27AE60]" />
              </div>
              <h1 className="text-xl font-bold text-[#1A202C] mb-2">Check your inbox</h1>
              <p className="text-sm text-[#718096] leading-relaxed mb-8">
                If that email exists in our system, a password reset link is on its way.
                The link will expire in <strong className="text-[#1A202C]">1 hour</strong>.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1B4332] hover:underline"
              >
                <ArrowLeft size={14} />
                Back to sign in
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div className="mb-7">
                <h1 className="text-2xl font-bold text-[#1A202C] mb-1">Forgot your password?</h1>
                <p className="text-sm text-[#718096] leading-relaxed">
                  Enter your work email and we&apos;ll send you a link to reset your password.
                </p>
              </div>

              {error && (
                <div className="mb-5 px-4 py-3 rounded-xl bg-[#FFF1F2] border border-[#FFC5C5] text-sm text-[#C0392B]">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div>
                  <label className="text-xs font-semibold text-[#1A202C] mb-1.5 block">
                    Work Email
                  </label>
                  <Input
                    type="email"
                    placeholder="you@company.co.za"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white border-[#E2E8F0] rounded-xl text-sm h-12"
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-[#1B4332] text-white rounded-xl font-semibold text-sm hover:bg-[#2D6A4F] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sending reset link…
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>

              <p className="text-sm text-[#718096] mt-6 text-center">
                Remember it?{" "}
                <Link href="/login" className="font-semibold text-[#1B4332] hover:underline">
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

      <p className="text-xs text-[#A0AEC0] mt-6 text-center">
        © 2026 OneBank South Africa •{" "}
        <a href="mailto:hello@onebank.co.za" className="hover:text-[#1B4332] transition-colors">
          hello@onebank.co.za
        </a>
      </p>
    </div>
  );
}
