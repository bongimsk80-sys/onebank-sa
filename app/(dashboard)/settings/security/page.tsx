"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ShieldCheck, ShieldAlert } from "lucide-react";

export default function SecurityPage() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [status, setStatus] = useState<{ enabled: boolean; required: boolean; enabledAt: string | null } | null>(null);
  const [setup, setSetup] = useState<{ secret: string; qr: string } | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/users/me/mfa");
    if (res.ok) setStatus(await res.json());
  }
  useEffect(() => { load(); }, []);

  async function call(action: "setup" | "enable" | "disable") {
    setBusy(true);
    setError("");
    const res = await fetch("/api/users/me/mfa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action === "setup" ? { action } : { action, code }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Something went wrong.");
    if (action === "setup") return setSetup(data);
    setSetup(null);
    setCode("");
    await updateSession({ mfaEnabled: data.enabled });
    load();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-[#718096] hover:text-[#1B4332] font-medium">
        <ArrowLeft size={16} /> Back to Settings
      </button>

      <div>
        <h2 className="text-lg font-bold text-[#1A202C]">Security</h2>
        <p className="text-xs text-[#718096] mt-0.5">Two-factor authentication protects payment approvals and account changes.</p>
      </div>

      <Card className="p-5 rounded-xl border border-[#E2E8F0] bg-white shadow-sm space-y-4">
        {status === null ? (
          <p className="text-sm text-[#718096]">Loading…</p>
        ) : status.enabled ? (
          <div className="flex items-start gap-3">
            <ShieldCheck className="text-[#27AE60] shrink-0" size={20} />
            <div className="flex-1">
              <p className="text-sm font-semibold">Two-factor authentication is on</p>
              <p className="text-xs text-[#718096]">
                Since {new Date(status.enabledAt!).toLocaleDateString("en-ZA", { dateStyle: "medium" })}. You will be asked for a code at every sign-in.
              </p>
              {!status.required && (
                <div className="mt-3 flex gap-2">
                  <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Current code" inputMode="numeric" className="h-10 w-40" />
                  <button onClick={() => call("disable")} disabled={busy || code.length < 6} className="px-3 rounded-lg bg-[#F4F6F8] text-xs font-semibold disabled:opacity-40">
                    Turn off
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="text-[#D4A017] shrink-0" size={20} />
              <div>
                <p className="text-sm font-semibold">Two-factor authentication is off</p>
                <p className="text-xs text-[#718096]">
                  {status.required
                    ? "Your role must use two-factor authentication before approving payments or changing settings."
                    : "Recommended for every user."}
                </p>
              </div>
            </div>

            {!setup ? (
              <button onClick={() => call("setup")} disabled={busy} className="px-4 py-2.5 rounded-xl bg-[#1B4332] text-white text-sm font-semibold">
                Set up authenticator app
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-[#4A5568]">
                  1. Scan this code with Google Authenticator, Microsoft Authenticator or 1Password.
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={setup.qr} alt="Authenticator QR code" className="w-44 h-44 border rounded-lg" />
                <p className="text-[11px] text-[#718096]">Can&apos;t scan? Enter this key: <code className="font-mono">{setup.secret}</code></p>
                <p className="text-xs text-[#4A5568]">2. Enter the 6-digit code it shows.</p>
                <div className="flex gap-2">
                  <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" inputMode="numeric" autoComplete="one-time-code" className="h-10 w-40" />
                  <button onClick={() => call("enable")} disabled={busy || code.length < 6} className="px-4 rounded-lg bg-[#1B4332] text-white text-xs font-semibold disabled:opacity-40">
                    Turn on
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {error && <p className="text-xs text-[#C0392B]">{error}</p>}
      </Card>
    </div>
  );
}
