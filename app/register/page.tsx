"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from "lucide-react";

const perks = [
  {
    title: "Unified bank dashboard",
    desc: "Aggregate FNB, Standard Bank, Absa, Nedbank and Capitec into one treasury view.",
  },
  {
    title: "Multi-level payment approvals",
    desc: "Build approval workflows tailored to your organisation's risk policy.",
  },
  {
    title: "Real-time analytics & ERP sync",
    desc: "Live cash flow reporting with Sage, SAP, Oracle, Xero and more.",
  },
];

function validate(fields: {
  orgName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}): string | null {
  const { orgName, firstName, lastName, email, password, confirmPassword } = fields;

  if (!orgName.trim())        return "Organisation name is required.";
  if (!firstName.trim())      return "First name is required.";
  if (!lastName.trim())       return "Last name is required.";
  if (!email.trim())          return "Work email is required.";

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email))   return "Please enter a valid email address.";

  if (password.length < 8)    return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter.";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number.";
  if (!/[^A-Za-z0-9]/.test(password))
    return "Password must contain at least one special character.";

  if (password !== confirmPassword) return "Passwords do not match.";

  return null;
}

export default function RegisterPage() {
  const [orgName,          setOrgName]          = useState("");
  const [firstName,        setFirstName]        = useState("");
  const [lastName,         setLastName]         = useState("");
  const [email,            setEmail]            = useState("");
  const [password,         setPassword]         = useState("");
  const [confirmPassword,  setConfirmPassword]  = useState("");
  const [showPassword,     setShowPassword]     = useState(false);
  const [showConfirm,      setShowConfirm]      = useState(false);
  const [loading,          setLoading]          = useState(false);
  const [error,            setError]            = useState("");
  const [success,          setSuccess]          = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const validationError = validate({ orgName, firstName, lastName, email, password, confirmPassword });
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgName, firstName, lastName, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      // Success — clear form and show confirmation
      setSuccess(true);
      setOrgName(""); setFirstName(""); setLastName("");
      setEmail(""); setPassword(""); setConfirmPassword("");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left Panel — Branding ─────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1B4332] flex-col justify-between p-12 relative overflow-hidden">

        {/* Background circles */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-white -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-white translate-x-1/2 translate-y-1/2" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-white -translate-x-1/2 -translate-y-1/2" />
        </div>

        {/* Gold accent line */}
        <div className="absolute top-0 left-0 w-1 h-full bg-[#D4A017]" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-[#D4A017] flex items-center justify-center font-bold text-[#1B4332] text-lg flex-shrink-0">
              OB
            </div>
            <div>
              <p className="font-bold text-2xl text-white leading-tight">OneBank</p>
              <p className="text-xs text-[#A0C4B1]">South Africa</p>
            </div>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Start managing your
              <span className="text-[#D4A017]"> treasury smarter</span>
            </h1>
            <p className="text-[#A0C4B1] text-base leading-relaxed">
              Join South African businesses already using OneBank to streamline
              payments, approvals, and cash flow — all in one place.
            </p>
          </div>

          {/* Perks */}
          <div className="space-y-5">
            {perks.map((perk) => (
              <div key={perk.title} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#D4A017] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle size={12} className="text-[#1B4332]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{perk.title}</p>
                  <p className="text-xs text-[#A0C4B1] mt-0.5 leading-relaxed">{perk.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* SA Banks */}
          <div>
            <p className="text-xs text-[#718096] uppercase tracking-widest mb-3">
              Supported Banks
            </p>
            <div className="flex gap-2 flex-wrap">
              {[
                { name: "FNB",  color: "#006B3C" },
                { name: "STD",  color: "#0033A0" },
                { name: "ABSA", color: "#DC0032" },
                { name: "NED",  color: "#007B40" },
                { name: "CAP",  color: "#007DC5" },
              ].map((bank) => (
                <div
                  key={bank.name}
                  className="px-3 py-1.5 rounded-xl text-white text-xs font-bold"
                  style={{ backgroundColor: bank.color }}
                >
                  {bank.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-xs text-[#718096]">
            © 2026 OneBank South Africa. All rights reserved.
          </p>
          <p className="text-xs text-[#718096] mt-1">
            POPIA Compliant • SARB Regulated • 256-bit Encrypted
          </p>
        </div>
      </div>

      {/* ── Right Panel — Registration Form ──────────────────────────── */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 lg:p-12 bg-[#F4F6F8] overflow-y-auto">

        {/* Mobile logo */}
        <div className="flex items-center gap-3 mb-8 lg:hidden">
          <div className="w-10 h-10 min-w-[40px] rounded-full bg-[#1B4332] flex items-center justify-center text-white font-bold flex-shrink-0">
            OB
          </div>
          <div>
            <p className="font-bold text-lg text-[#1A202C]">OneBank</p>
            <p className="text-xs text-[#718096]">South Africa</p>
          </div>
        </div>

        <div className="w-full max-w-md">

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-[#1A202C]">
              Create your account
            </h2>
            <p className="text-sm text-[#718096] mt-1">
              Set up your organisation on OneBank SA — free during beta.
            </p>
          </div>

          {/* Success state */}
          {success ? (
            <div className="flex flex-col items-center text-center py-8 gap-4">
              <div className="w-16 h-16 rounded-full bg-[#F0FAF4] flex items-center justify-center">
                <CheckCircle size={32} className="text-[#27AE60]" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#1A202C]">Check your email</p>
                <p className="text-sm text-[#718096] mt-1 leading-relaxed">
                  We've sent a verification link to <strong>{email || "your inbox"}</strong>.
                  Click the link to activate your account.
                </p>
              </div>
              <Link
                href="/login"
                className="mt-2 text-sm font-semibold text-[#1B4332] hover:underline"
              >
                Back to sign in →
              </Link>
            </div>
          ) : (
            <>
              {/* Error banner */}
              {error && (
                <div className="mb-5 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-[#FFF1F2] border border-[#FFC5C5]">
                  <AlertCircle size={15} className="text-[#C0392B] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-[#C0392B]">{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>

                {/* Organisation Name */}
                <div>
                  <label className="text-xs font-semibold text-[#1A202C] mb-1.5 block">
                    Organisation Name
                  </label>
                  <Input
                    type="text"
                    placeholder="Acme Corp (Pty) Ltd"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="bg-white border-[#E2E8F0] rounded-xl text-sm h-12"
                    required
                  />
                </div>

                {/* First + Last Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#1A202C] mb-1.5 block">
                      First Name
                    </label>
                    <Input
                      type="text"
                      placeholder="Thabo"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="bg-white border-[#E2E8F0] rounded-xl text-sm h-12"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#1A202C] mb-1.5 block">
                      Last Name
                    </label>
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

                {/* Work Email */}
                <div>
                  <label className="text-xs font-semibold text-[#1A202C] mb-1.5 block">
                    Work Email
                  </label>
                  <Input
                    type="email"
                    placeholder="thabo@acmecorp.co.za"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white border-[#E2E8F0] rounded-xl text-sm h-12"
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="text-xs font-semibold text-[#1A202C] mb-1.5 block">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 chars, uppercase, number, symbol"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-white border-[#E2E8F0] rounded-xl text-sm h-12 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0AEC0] hover:text-[#718096]"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {/* Strength hints */}
                  {password.length > 0 && (
                    <div className="flex gap-3 mt-2 flex-wrap">
                      {[
                        { label: "8+ chars",   ok: password.length >= 8 },
                        { label: "Uppercase",  ok: /[A-Z]/.test(password) },
                        { label: "Number",     ok: /[0-9]/.test(password) },
                        { label: "Symbol",     ok: /[^A-Za-z0-9]/.test(password) },
                      ].map(({ label, ok }) => (
                        <span
                          key={label}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            ok
                              ? "bg-[#F0FAF4] text-[#27AE60]"
                              : "bg-[#F4F6F8] text-[#A0AEC0]"
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
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Re-enter your password"
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

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-[#1B4332] text-white rounded-xl font-semibold text-sm hover:bg-[#2D6A4F] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creating account…
                    </>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>

              {/* Sign-in link */}
              <p className="text-sm text-[#718096] mt-6 text-center">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-[#1B4332] hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </>
          )}

          {/* Mobile footer */}
          <p className="text-xs text-[#A0AEC0] mt-8 text-center lg:hidden">
            © 2026 OneBank South Africa. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
