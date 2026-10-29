"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { useSessionStore } from "@/store/session-store";
import {
  ChevronRight,
  User,
  Globe,
  LayoutDashboard,
  Fingerprint,
  Bell,
  Sun,
  Sliders,
  QrCode,
  Building2,
  Layers,
  Wifi,
  ClipboardList,
  Users,
  Shield,
  LogOut,
  XCircle,
} from "lucide-react";

const settingsGroups = [
  {
    title: "SETTINGS",
    items: [
      { icon: Globe,         label: "Language",            value: "English",   href: null,                          comingSoon: true  },
      { icon: LayoutDashboard, label: "Customize Overview", value: null,        href: "/settings/customize-overview", comingSoon: false },
      { icon: Fingerprint,  label: "Security & two-factor", value: null,       href: "/settings/security",           comingSoon: false },
      { icon: Bell,         label: "Notification Settings",value: null,        href: "/settings/notifications",      comingSoon: false },
      { icon: Sun,          label: "Display Settings",     value: "Light",     href: "/settings/display",            comingSoon: false },
      { icon: Sliders,      label: "Preferences",          value: null,        href: null,                          comingSoon: true  },
      { icon: QrCode,       label: "QR Pay Authentication",value: "Biometric", href: "/settings/qr-auth",            comingSoon: false },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      { icon: Building2,    label: "Bank Accounts",        value: null,        href: "/settings/bank-accounts",      comingSoon: false },
      { icon: Layers,       label: "Virtual Accounts",     value: null,        href: null,                          comingSoon: true  },
      { icon: Wifi,         label: "Bank Connections",     value: "Stitch",    href: "/settings/bank-accounts",      comingSoon: false },
      { icon: ClipboardList,label: "Activity Log",         value: null,        href: "/settings/activity-log",       comingSoon: false },
    ],
  },
  {
    title: "ORGANISATION",
    items: [
      { icon: Users,        label: "Users & Roles",        value: null,        href: "/users",                       comingSoon: false },
      { icon: Shield,       label: "Approval Workflows",   value: null,        href: "/settings/workflows",          comingSoon: false },
      { icon: Sliders,      label: "Transfer Limits",      value: null,        href: "/settings/transfer-limits",    comingSoon: false },
    ],
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const { name, email, role, clearSession } = useSessionStore();

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Profile Card */}
      <Card
        className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-sm cursor-pointer hover:bg-[#F4F6F8] transition-colors"
        onClick={() => router.push("/settings/profile")}
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#1B4332] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {name
              ? name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
              : "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-[#1A202C]">{name || "User"}</p>
            <p className="text-sm text-[#718096] truncate">{email || ""}</p>
            <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#F0FDF4] text-[#27AE60]">
              {role || "viewer"}
            </span>
          </div>
          <ChevronRight size={16} className="text-[#A0AEC0] flex-shrink-0" />
        </div>
      </Card>

      {/* Settings Groups */}
      {settingsGroups.map((group) => (
        <div key={group.title}>
          <p className="text-xs font-bold text-[#A0AEC0] uppercase tracking-widest mb-2 px-1">
            {group.title}
          </p>
          <Card className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm divide-y divide-[#E2E8F0]">
            {group.items.map(({ icon: Icon, label, value, href, comingSoon }) => (
              <div
                key={label}
                onClick={() => (!comingSoon && href ? router.push(href) : undefined)}
                className={`flex items-center justify-between px-4 py-3.5 transition-colors ${
                  !comingSoon && href
                    ? "cursor-pointer hover:bg-[#F4F6F8]"
                    : "cursor-default"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${comingSoon ? "bg-[#F4F6F8]" : "bg-[#F4F6F8]"}`}>
                    <Icon size={16} className={comingSoon ? "text-[#A0AEC0]" : "text-[#1B4332]"} />
                  </div>
                  <span className={`text-sm font-medium ${comingSoon ? "text-[#A0AEC0]" : "text-[#1A202C]"}`}>
                    {label}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {comingSoon ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF7ED] text-[#D4A017] border border-[#D4A017]/20">
                      Coming Soon
                    </span>
                  ) : (
                    <>
                      {value && (
                        <span className="text-sm text-[#A0AEC0]">{value}</span>
                      )}
                      <ChevronRight size={14} className="text-[#A0AEC0]" />
                    </>
                  )}
                </div>
              </div>
            ))}
          </Card>
        </div>
      ))}

      {/* Danger Zone */}
      {role === "admin" && (
        <div>
          <p className="text-xs font-bold text-[#A0AEC0] uppercase tracking-widest mb-2 px-1">
            DANGER ZONE
          </p>
          <Card className="rounded-xl border border-[#FED7D7] bg-white shadow-sm overflow-hidden">
            <div
              onClick={() => router.push("/settings/close-account")}
              className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-[#FFF5F5] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FFF5F5] flex items-center justify-center">
                  <XCircle size={16} className="text-[#C0392B]" />
                </div>
                <span className="text-sm font-medium text-[#C0392B]">Close Account</span>
              </div>
              <ChevronRight size={14} className="text-[#FC8181]" />
            </div>
          </Card>
        </div>
      )}

      {/* App Info */}
      <Card className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-[#1A202C]">OneView</p>
            <p className="text-xs text-[#A0AEC0]">Version 1.0.0 (MVP)</p>
          </div>
          <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[#F0FDF4] text-[#27AE60]">
            Up to date
          </span>
        </div>
      </Card>

      {/* Logout */}
      <button
        onClick={() => {
          clearSession();
          signOut({ callbackUrl: "/login" });
        }}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-[#FFF1F2] bg-white text-[#C0392B] font-semibold text-sm hover:bg-[#FFF1F2] transition-colors"
      >
        <LogOut size={16} />
        Sign Out
      </button>

      {/* Bottom padding for mobile nav */}
      <div className="h-24 lg:h-4" />
    </div>
  );
}
