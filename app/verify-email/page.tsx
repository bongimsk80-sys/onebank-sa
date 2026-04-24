"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";

type Status = "loading" | "success" | "error";

function VerifyEmailContent() {
  const searchParams  = useSearchParams();
  const router        = useRouter();
  const token         = searchParams.get("token");

  const [status,  setStatus]  = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const [resent,  setResent]  = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found in this link.");
      return;
    }

    async function verify() {
      try {
        const res  = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setStatus("success");
        } else {
          setStatus("error");
          setMessage(data.error ?? "Verification failed. Please try again.");
        }
      } catch {
        setStatus("error");
        setMessage("Network error. Please check your connection and try again.");
      }
    }

    verify();
  }, [token]);

  // Placeholder resend handler — wire up to resend API when built
  async function handleResend() {
    setResending(true);
    // TODO: POST /api/auth/resend-verification when that route exists
    await new Promise((r) => setTimeout(r, 800));
    setResent(true);
    setResending(false);
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col items-center justify-center p-6">

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden">

        {/* Green header bar */}
        <div className="h-2 bg-[#1B4332]" />

        <div className="px-8 py-10 flex flex-col items-center text-center">

          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 min-w-[36px] rounded-full bg-[#D4A017] flex items-center justify-center font-bold text-[#1B4332] text-sm flex-shrink-0">
              OB
            </div>
            <div className="text-left">
              <p className="font-bold text-sm text-[#1A202C] leading-tight">OneBank TMS</p>
              <p className="text-[10px] text-[#718096]">B2B Treasury Management</p>
            </div>
          </div>

          {/* ── Loading ── */}
          {status === "loading" && (
            <>
              <div className="w-20 h-20 rounded-full bg-[#F0FAF4] flex items-center justify-center mb-6">
                <Loader2 size={36} className="text-[#1B4332] animate-spin" />
              </div>
              <h1 className="text-xl font-bold text-[#1A202C] mb-2">
                Verifying your email…
              </h1>
              <p className="text-sm text-[#718096] leading-relaxed">
                Please wait while we confirm your account.
              </p>
            </>
          )}

          {/* ── Success ── */}
          {status === "success" && (
            <>
              <div className="w-20 h-20 rounded-full bg-[#F0FAF4] flex items-center justify-center mb-6">
                <CheckCircle size={40} className="text-[#27AE60]" />
              </div>
              <h1 className="text-xl font-bold text-[#1A202C] mb-2">
                Email verified!
              </h1>
              <p className="text-sm text-[#718096] leading-relaxed mb-8">
                Your account is ready. Sign in to access your OneBank TMS treasury dashboard.
              </p>
              <button
                onClick={() => router.push("/login")}
                className="w-full h-12 bg-[#1B4332] text-white rounded-xl font-semibold text-sm hover:bg-[#2D6A4F] transition-colors"
              >
                Go to Sign In
              </button>
            </>
          )}

          {/* ── Error ── */}
          {status === "error" && (
            <>
              <div className="w-20 h-20 rounded-full bg-[#FFF1F2] flex items-center justify-center mb-6">
                <XCircle size={40} className="text-[#C0392B]" />
              </div>
              <h1 className="text-xl font-bold text-[#1A202C] mb-2">
                Verification failed
              </h1>
              <p className="text-sm text-[#718096] leading-relaxed mb-2">
                {message || "This verification link is invalid or has expired."}
              </p>
              <p className="text-xs text-[#A0AEC0] mb-8">
                Verification links expire after 24 hours. Request a new one below.
              </p>

              {resent ? (
                <div className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#F0FAF4] border border-[#C6E8D3]">
                  <Mail size={15} className="text-[#27AE60]" />
                  <p className="text-sm text-[#27AE60] font-semibold">
                    Verification email sent — check your inbox.
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="w-full h-12 bg-[#1B4332] text-white rounded-xl font-semibold text-sm hover:bg-[#2D6A4F] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mb-3"
                >
                  {resending ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Sending…
                    </>
                  ) : (
                    "Resend Verification Email"
                  )}
                </button>
              )}

              <Link
                href="/login"
                className="text-sm text-[#718096] hover:text-[#1B4332] hover:underline mt-3 inline-block transition-colors"
              >
                Back to sign in
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <p className="text-xs text-[#A0AEC0] mt-6 text-center">
        © 2026 OneBank TMS. All rights reserved. •{" "}
        <a href="mailto:hello@onebank.co.za" className="hover:text-[#1B4332] transition-colors">
          hello@onebank.co.za
        </a>
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center">
        <Loader2 size={32} className="text-[#1B4332] animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
