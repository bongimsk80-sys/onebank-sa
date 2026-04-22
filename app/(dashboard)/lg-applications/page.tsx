"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useSessionStore } from "@/store/session-store";
import {
  ShieldCheck,
  Hammer,
  Gavel,
  Home,
  Truck,
  Clock,
  CheckCircle2,
  Loader2,
  Bell,
  FileText,
  Zap,
  Building2,
} from "lucide-react";

const LG_TYPES = [
  {
    icon: Hammer,
    label: "Performance Bond",
    bg: "bg-[#FFF8EC]",
    iconColor: "text-[#D4A017]",
    badge: "Most requested",
    badgeBg: "bg-[#D4A017]/10 text-[#D4A017]",
    description:
      "Guarantees a contractor will complete a project to the agreed standard. Required on virtually all government and large private construction contracts in South Africa.",
    usedBy: "Construction, infrastructure, engineering firms",
  },
  {
    icon: Gavel,
    label: "Bid Bond (Tender Guarantee)",
    bg: "bg-[#EBF8FF]",
    iconColor: "text-[#2980B9]",
    badge: "High demand",
    badgeBg: "bg-[#2980B9]/10 text-[#2980B9]",
    description:
      "Issued when submitting a tender to show you're a serious bidder. If you win and decline the contract, the bank pays the client the difference. Mandatory on most public sector tenders above R500k.",
    usedBy: "Any company bidding on government or private tenders",
  },
  {
    icon: Home,
    label: "Rental Guarantee",
    bg: "bg-[#F0FDF4]",
    iconColor: "text-[#27AE60]",
    badge: "Common in SA",
    badgeBg: "bg-[#27AE60]/10 text-[#27AE60]",
    description:
      "Replaces cash deposits for commercial leases. Landlords (Growthpoint, Redefine, etc.) increasingly prefer bank guarantees over tied-up cash — frees up your working capital.",
    usedBy: "Retailers, offices, warehousing, industrial tenants",
  },
  {
    icon: Truck,
    label: "Advance Payment Guarantee",
    bg: "bg-[#FFF5F5]",
    iconColor: "text-[#C0392B]",
    badge: "Trade & export",
    badgeBg: "bg-[#C0392B]/10 text-[#C0392B]",
    description:
      "Protects a buyer who has paid a deposit or advance before goods/services are delivered. Common in import/export transactions and large procurement contracts.",
    usedBy: "Importers, exporters, large procurement teams",
  },
];

const FEATURES = [
  {
    icon: FileText,
    title: "Digital LG Application",
    desc: "Submit LG applications online — no more paper forms or branch visits. Track status in real-time.",
  },
  {
    icon: Zap,
    title: "Faster Approvals",
    desc: "Cut application time from 3–10 days down to hours by connecting directly to your bank's trade finance desk.",
  },
  {
    icon: Building2,
    title: "Multi-bank in One Place",
    desc: "Apply to FNB, Standard Bank, ABSA, Nedbank or Capitec from a single dashboard — no switching portals.",
  },
  {
    icon: ShieldCheck,
    title: "Compliant & Secure",
    desc: "All LG wording meets SA Banks Act requirements. Documents stored securely with full audit trail.",
  },
];

export default function LgApplicationsPage() {
  const { name, orgName } = useSessionStore();

  const [selectedType, setSelectedType] = useState("");
  const [loading, setLoading]           = useState(false);
  const [joined, setJoined]             = useState(false);
  const [error, setError]               = useState("");

  async function handleJoinWaitlist() {
    if (!selectedType) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/lg-waitlist", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ lgType: selectedType }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Something went wrong. Please try again.");
        return;
      }
      setJoined(true);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-[#1A202C]">Letters of Guarantee</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D4A017]/10 text-[#D4A017] border border-[#D4A017]/20">
              Coming Soon
            </span>
          </div>
          <p className="text-sm text-[#718096]">
            Digital LG applications, tracking and management — coming to OneBank SA
          </p>
        </div>
      </div>

      {/* ── Hero card ────────────────────────────────────────────────── */}
      <Card className="rounded-2xl border border-[#E2E8F0] bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] text-white overflow-hidden shadow-sm">
        <div className="p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#D4A017] flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={24} className="text-[#1B4332]" />
            </div>
            <div>
              <h2 className="text-lg font-bold mb-2">What is a Letter of Guarantee?</h2>
              <p className="text-sm text-[#A0C4B1] leading-relaxed max-w-xl">
                A Letter of Guarantee (LG) is a commitment by your bank to pay a third party if
                you fail to meet a contractual obligation. In South Africa, LGs are a daily
                requirement for construction tenders, commercial leases, government contracts and
                import/export trade — yet applying for one still means paperwork, branch visits
                and days of waiting. <span className="text-white font-semibold">We're changing that.</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {[
              { label: "Average wait time", value: "3–10 days", sub: "We're targeting hours" },
              { label: "SA bank guarantee market", value: "R180bn+", sub: "Annual issuance" },
              { label: "LG types supported", value: "4 types", sub: "At launch" },
              { label: "Banks at launch", value: "5 major", sub: "FNB, STD, ABSA, NED, CAP" },
            ].map(({ label, value, sub }) => (
              <div key={label} className="bg-white/10 rounded-xl p-3">
                <p className="text-[10px] text-[#A0C4B1] mb-1">{label}</p>
                <p className="text-base font-bold">{value}</p>
                <p className="text-[10px] text-[#A0C4B1] mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* ── LG Types ─────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-bold text-[#1A202C] mb-3">LG types we'll support at launch</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {LG_TYPES.map(({ icon: Icon, label, bg, iconColor, badge, badgeBg, description, usedBy }) => (
            <Card key={label} className="p-4 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={20} className={iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-bold text-[#1A202C]">{label}</p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${badgeBg}`}>
                      {badge}
                    </span>
                  </div>
                  <p className="text-xs text-[#718096] leading-relaxed mb-2">{description}</p>
                  <p className="text-[10px] text-[#A0AEC0]">
                    <span className="font-semibold">Used by:</span> {usedBy}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* ── What's coming ────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-bold text-[#1A202C] mb-3">What you'll be able to do</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="p-4 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-[#1B4332]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1A202C] mb-0.5">{title}</p>
                  <p className="text-xs text-[#718096] leading-relaxed">{desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Waitlist ─────────────────────────────────────────────────── */}
      <Card className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
        {joined ? (
          <div className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-[#F0FDF4] flex items-center justify-center">
                <CheckCircle2 size={28} className="text-[#27AE60]" />
              </div>
            </div>
            <h3 className="text-base font-bold text-[#1A202C] mb-2">You're on the list!</h3>
            <p className="text-sm text-[#718096] max-w-sm mx-auto leading-relaxed">
              We'll notify <strong className="text-[#1A202C]">{name?.split(" ")[0] ?? "you"}</strong> at{" "}
              <strong className="text-[#1A202C]">{orgName}</strong> the moment LG Applications
              goes live. You'll be among the first to access it.
            </p>
          </div>
        ) : (
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#FFF8EC] flex items-center justify-center flex-shrink-0">
                <Bell size={18} className="text-[#D4A017]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1A202C]">Join the early access waitlist</h3>
                <p className="text-xs text-[#718096]">
                  Be first in line when LG Applications launches — we'll notify you directly.
                </p>
              </div>
            </div>

            {/* Timeline */}
            <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
              {[
                { label: "Beta (now)", active: true,  done: true  },
                { label: "Waitlist",   active: true,  done: false },
                { label: "Pilot",      active: false, done: false },
                { label: "Launch",     active: false, done: false },
              ].map(({ label, active, done }, i, arr) => (
                <div key={label} className="flex items-center gap-2 flex-shrink-0">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                    done
                      ? "bg-[#1B4332] text-white border-[#1B4332]"
                      : active
                      ? "bg-[#D4A017]/10 text-[#D4A017] border-[#D4A017]/30"
                      : "bg-[#F4F6F8] text-[#A0AEC0] border-[#E2E8F0]"
                  }`}>
                    {done && <CheckCircle2 size={9} />}
                    {active && !done && <Clock size={9} />}
                    {label}
                  </div>
                  {i < arr.length - 1 && <div className="w-4 h-px bg-[#E2E8F0] flex-shrink-0" />}
                </div>
              ))}
            </div>

            {/* LG type selector */}
            <div className="space-y-2 mb-4">
              <p className="text-sm font-semibold text-[#1A202C]">
                Which LG type do you need most?{" "}
                <span className="text-[#C0392B]">*</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {LG_TYPES.map(({ label, icon: Icon, iconColor, bg }) => (
                  <button
                    key={label}
                    onClick={() => setSelectedType(label)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all ${
                      selectedType === label
                        ? "border-[#1B4332] bg-[#F0FDF4] shadow-sm"
                        : "border-[#E2E8F0] hover:border-[#1B4332]/30 hover:bg-[#F4F6F8]"
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={14} className={iconColor} />
                    </div>
                    <span className={`text-xs font-medium ${selectedType === label ? "text-[#1B4332]" : "text-[#4A5568]"}`}>
                      {label}
                    </span>
                    {selectedType === label && (
                      <CheckCircle2 size={14} className="text-[#1B4332] ml-auto flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-[#FFF5F5] border border-[#FED7D7] px-4 py-3 text-sm text-[#C0392B]">
                {error}
              </div>
            )}

            <button
              onClick={handleJoinWaitlist}
              disabled={!selectedType || loading}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                selectedType && !loading
                  ? "bg-[#1B4332] text-white hover:bg-[#2D6A4F] active:scale-[0.98]"
                  : "bg-[#F4F6F8] text-[#A0AEC0] cursor-not-allowed"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Joining waitlist…
                </>
              ) : (
                <>
                  <Bell size={16} />
                  Notify me when it launches
                </>
              )}
            </button>

            <p className="text-center text-[10px] text-[#A0AEC0] mt-3">
              No spam — one email when LG Applications goes live. That's it.
            </p>
          </div>
        )}
      </Card>

      <div className="h-24 lg:h-4" />
    </div>
  );
}
