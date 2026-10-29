"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Link2, RefreshCw, ShieldOff, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

type Provider = { id: "stitch" | "yodlee" | "simulated"; name: string; description: string; enabled: boolean; reason: string | null };
type Connection = {
  id: string; provider: string; status: string; label: string | null;
  lastSyncedAt: string | null; lastError: string | null;
  consentGrantedAt: string | null; consentExpiresAt: string | null; revokedAt: string | null;
  _count: { accounts: number };
};

const SIM_BANKS = ["FNB", "Standard Bank", "Absa", "Nedbank", "Capitec", "Investec"];

function when(iso: string | null) {
  if (!iso) return "never";
  return new Date(iso).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Johannesburg" });
}

const STATUS_STYLE: Record<string, string> = {
  active: "bg-[#E8F5E9] text-[#1B4332]",
  pending: "bg-[#FFF8E1] text-[#8A6D00]",
  error: "bg-[#FDECEA] text-[#C0392B]",
  revoked: "bg-[#F4F6F8] text-[#718096]",
};

export function BankConnections({ isAdmin, onChanged }: { isAdmin: boolean; onChanged: () => void }) {
  const params = useSearchParams();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState<Provider["id"]>("stitch");
  const [simBank, setSimBank] = useState("FNB");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/connections");
    if (!res.ok) return;
    const data = await res.json();
    setConnections(data.connections ?? []);
    setProviders(data.providers ?? []);
    const firstEnabled = (data.providers ?? []).find((p: Provider) => p.enabled);
    if (firstEnabled) setProvider(firstEnabled.id);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const ok = params.get("connected");
    const err = params.get("connectError");
    if (ok) setMessage({ kind: "ok", text: `Bank connected via ${ok}. ${params.get("accounts") ?? 0} account(s) synced.` });
    if (err) setMessage({ kind: "err", text: `Connection failed: ${err.replace(/_/g, " ")}` });
  }, [params]);

  async function connect() {
    setBusy("connect");
    setMessage(null);
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, consent, ...(provider === "simulated" ? { bank: simBank } : {}) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl; // Stitch consent screen
        return;
      }
      if (data.fastlink?.url) {
        setMessage({ kind: "ok", text: "Yodlee FastLink session created. Complete linking in the FastLink window, then press Sync." });
      } else {
        setMessage({ kind: "ok", text: `Connected. ${data.result?.accounts ?? 0} account(s), ${data.result?.inserted ?? 0} transaction(s) loaded.` });
      }
      setOpen(false);
      setConsent(false);
      await load();
      onChanged();
    } catch (e: any) {
      setMessage({ kind: "err", text: e.message });
    } finally {
      setBusy(null);
    }
  }

  async function sync(id: string) {
    setBusy(id);
    setMessage(null);
    const res = await fetch(`/api/connections/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const data = await res.json().catch(() => ({}));
    setMessage(res.ok
      ? { kind: "ok", text: `Synced: ${data.result.accounts} account(s), ${data.result.inserted} new transaction(s).` }
      : { kind: "err", text: data.error ?? "Sync failed" });
    setBusy(null);
    await load();
    onChanged();
  }

  async function revoke(id: string) {
    if (!confirm("Revoke consent for this connection? Syncing stops and its accounts are hidden. Past transactions stay for the audit trail.")) return;
    setBusy(id);
    await fetch(`/api/connections/${id}`, { method: "DELETE" });
    setBusy(null);
    await load();
    onChanged();
  }

  const selected = providers.find((p) => p.id === provider);

  return (
    <Card className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-[#1A202C]">Bank connections</p>
          <p className="text-[11px] text-[#718096]">Balances and transactions are pulled with the account holder&apos;s consent. OneView never stores bank passwords.</p>
        </div>
        {isAdmin && (
          <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1B4332] text-white text-xs font-semibold hover:bg-[#2D6A4F]">
            <Link2 size={13} /> Connect a bank
          </button>
        )}
      </div>

      {message && (
        <div className={`flex items-start gap-2 text-xs rounded-lg p-2.5 ${message.kind === "ok" ? "bg-[#E8F5E9] text-[#1B4332]" : "bg-[#FDECEA] text-[#C0392B]"}`}>
          {message.kind === "ok" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          <span>{message.text}</span>
        </div>
      )}

      {connections.length === 0 ? (
        <p className="text-xs text-[#A0AEC0]">No bank connections yet.</p>
      ) : (
        <ul className="divide-y divide-[#F4F6F8]">
          {connections.map((c) => (
            <li key={c.id} className="py-2.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#1A202C] capitalize">
                  {c.provider === "simulated" ? `Demo data${c.label ? ` · ${c.label}` : ""}` : c.provider}
                  <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${STATUS_STYLE[c.status] ?? STATUS_STYLE.pending}`}>{c.status}</span>
                </p>
                <p className="text-[10px] text-[#718096]">
                  {c._count.accounts} account(s) · last sync {when(c.lastSyncedAt)} · consent until {when(c.consentExpiresAt)}
                </p>
                {c.lastError && <p className="text-[10px] text-[#C0392B] truncate">{c.lastError}</p>}
              </div>
              {c.status !== "revoked" && (
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => sync(c.id)} disabled={busy === c.id} className="p-2 rounded-lg bg-[#F4F6F8] hover:bg-[#E2E8F0]" title="Sync now">
                    {busy === c.id ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                  </button>
                  {isAdmin && (
                    <button onClick={() => revoke(c.id)} className="p-2 rounded-lg bg-[#F4F6F8] hover:bg-[#FDECEA]" title="Revoke consent">
                      <ShieldOff size={13} />
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-bold text-[#1A202C]">Connect a bank</p>
              <button onClick={() => setOpen(false)} aria-label="Close"><X size={16} /></button>
            </div>

            <div className="space-y-2">
              {providers.map((p) => (
                <label key={p.id} className={`flex gap-3 p-3 rounded-xl border cursor-pointer ${provider === p.id ? "border-[#1B4332] bg-[#F1F8F4]" : "border-[#E2E8F0]"} ${!p.enabled ? "opacity-50 cursor-not-allowed" : ""}`}>
                  <input type="radio" name="provider" disabled={!p.enabled} checked={provider === p.id} onChange={() => setProvider(p.id)} />
                  <span>
                    <span className="block text-sm font-semibold">{p.name}</span>
                    <span className="block text-[11px] text-[#718096]">{p.description}</span>
                    {!p.enabled && p.reason && <span className="block text-[10px] text-[#8A6D00] mt-0.5">{p.reason}</span>}
                  </span>
                </label>
              ))}
            </div>

            {provider === "simulated" && (
              <label className="block text-xs">
                <span className="font-semibold">Bank to simulate</span>
                <select value={simBank} onChange={(e) => setSimBank(e.target.value)} className="mt-1 w-full border rounded-lg p-2 text-sm">
                  {SIM_BANKS.map((b) => <option key={b}>{b}</option>)}
                </select>
              </label>
            )}

            <label className="flex gap-2 text-[11px] text-[#4A5568] leading-snug">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
              <span>
                I am authorised by my organisation to share read-only account, balance and transaction data
                {selected && selected.id !== "simulated" ? ` from our bank via ${selected.name}` : ""} with OneView for 90 days,
                and I have read the <a href="/privacy" target="_blank" className="underline">privacy notice</a>. Consent can be revoked at any time.
              </span>
            </label>

            <button
              onClick={connect}
              disabled={!consent || !selected?.enabled || busy === "connect"}
              className="w-full py-2.5 rounded-xl bg-[#1B4332] text-white text-sm font-semibold disabled:opacity-40"
            >
              {busy === "connect" ? "Connecting…" : provider === "stitch" ? "Continue to Stitch" : "Connect"}
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
