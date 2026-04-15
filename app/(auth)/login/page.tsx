"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";

const demoUsers = [
  { role: "Admin", email: "admin@onebank.co.za", password: "OneBankAdmin2026!" },
  { role: "Approver", email: "approver@onebank.co.za", password: "OneBankApprove2026!" },
  { role: "Initiator", email: "initiator@onebank.co.za", password: "OneBankInit2026!" },
  { role: "Reviewer", email: "reviewer@onebank.co.za", password: "OneBankReview2026!" },
  { role: "Executor", email: "executor@onebank.co.za", password: "OneBankExec2026!" },
  { role: "Viewer", email: "viewer@onebank.co.za", password: "OneBankView2026!" },
];

const features = [
  "Aggregate all your SA bank accounts in one place",
  "Full payment workflow with multi-level approvals",
  "Real-time analytics and cash flow reporting",
  "ERP integration with Sage, SAP, Oracle & more",
  "Role-based access for your entire treasury team",
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
    } else {
      router.push("/overview");
      router.refresh();
    }
  }

  function handleDemoLogin(demoEmail: string, demoPassword: string) {
    setEmail(demoEmail);
    setPassword(demoPassword);
  }

  return (
    <div className="min-h-screen flex">

      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1B4332] flex-col justify-between p-12 relative overflow-hidden">

        {/* Background pattern */}
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
            <div className="w-12 h-12 rounded-full bg-[#D4A017] flex items-center justify-center font-bold text-[#1B4332] text-lg">
              OB
            </div>
            <div>
              <p className="font-bold text-2xl text-white leading-tight">
                OneBank
              </p>
              <p className="text-xs text-[#A0C4B1]">South Africa</p>
            </div>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              One platform for all your
              <span className="text-[#D4A017]"> business banking</span>
            </h1>
            <p className="text-[#A0C4B1] text-base leading-relaxed">
              Aggregate FNB, Standard Bank, Absa, Nedbank and Capitec
              into a single powerful treasury management console.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            {features.map((feature, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle
                  size={16}
                  className="text-[#D4A017] flex-shrink-0 mt-0.5"
                />
                <p className="text-sm text-[#A0C4B1]">{feature}</p>
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
                { name: "FNB", color: "#006B3C" },
                { name: "STD", color: "#0033A0" },
                { name: "ABSA", color: "#DC0032" },
                { name: "NED", color: "#007B40" },
                { name: "CAP", color: "#007DC5" },
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

      {/* Right Panel — Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 lg:p-12 bg-[#F4F6F8]">

        {/* Mobile logo */}
        <div className="flex items-center gap-3 mb-8 lg:hidden">
          <div className="w-10 h-10 rounded-full bg-[#1B4332] flex items-center justify-center text-white font-bold">
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
              Welcome back
            </h2>
            <p className="text-sm text-[#718096] mt-1">
              Sign in to your OneBank account
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-[#FFF1F2] border border-[#FFC5C5] text-sm text-[#C0392B]">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-[#1A202C] mb-1.5 block">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="you@onebank.co.za"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white border-[#E2E8F0] rounded-xl text-sm h-12"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#1A202C] mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
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
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="text-xs text-[#1B4332] font-semibold hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#1B4332] text-white rounded-xl font-semibold text-sm hover:bg-[#2D6A4F] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#E2E8F0]" />
            <span className="text-xs text-[#A0AEC0]">Demo accounts</span>
            <div className="flex-1 h-px bg-[#E2E8F0]" />
          </div>

          {/* Demo Users */}
          <div className="grid grid-cols-2 gap-2">
            {demoUsers.map((u) => (
              <button
                key={u.role}
                type="button"
                onClick={() => handleDemoLogin(u.email, u.password)}
                className="px-3 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-xs font-semibold text-[#1A202C] hover:bg-[#1B4332] hover:text-white hover:border-[#1B4332] transition-all text-left"
              >
                <span className="block text-[10px] text-[#A0AEC0] font-normal mb-0.5">
                  Login as
                </span>
                {u.role}
              </button>
            ))}
          </div>

          {/* Register link */}
          <p className="text-sm text-[#718096] mt-6 text-center">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-[#1B4332] hover:underline"
            >
              Register free
            </Link>
          </p>

          {/* Mobile footer */}
          <p className="text-xs text-[#A0AEC0] mt-8 text-center lg:hidden">
            © 2026 OneBank South Africa. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}