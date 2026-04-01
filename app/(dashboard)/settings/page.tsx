"use client";

import { useState } from "react";
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
} from "lucide-react";

const settingsGroups = [
  {
    title: "SETTINGS",
    items: [
      { icon: Globe, label: "Language", value: "English", href: null },
      { icon: LayoutDashboard, label: "Customize Overview", value: null, href: "/settings/customize-overview" },
      { icon: Fingerprint, label: "Face ID & Password", value: null, href: null },
      { icon: Bell, label: "Notification Settings", value: null, href: "/settings/notifications" },
      { icon: Sun, label: "Display Settings", value: "Light", href: "/settings/display" },
      { icon: Sliders, label: "Preferences", value: null, href: null },
      { icon: QrCode, label: "QR Pay Authentication", value: "Biometric", href: "/settings/qr-auth" },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      { icon: Building2, label: "Bank Accounts", value: null, href: "/settings/bank-accounts" },
      { icon: Layers, label: "Virtual Accounts", value: null, href: null },
      { icon: Wifi, label: "Open Banking Services", value: null, href: null },
      { icon: ClipboardList, label: "Activity Log", value: null, href: "/settings/activity-log" },
    ],
  },
  {
    title: "ORGANISATION",
    items: [
      { icon: Users, label: "Users & Roles", value: null, href: "/users" },
      { icon: Shield, label: "Approval Workflows", value: null, href: "/settings/workflows" },
      { icon: Sliders, label: "Transfer Limits", value: null, href: "/settings/transfer-limits" },
    ],
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const { name, email, role, clearSession } = useSessionStore();

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Profile Card */}
      <Card className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#1B4332] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {name
              ? name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
              : "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-[#1A202C]">
              {name ?? "User"}
            </p>
            <p className="text-sm text-[#718096] truncate">
              {email ?? ""}
            </p>
            <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#F0FDF4] text-[#27AE60]">
              {role ?? "viewer"}
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
            {group.items.map(({ icon: Icon, label, value, href }) => (
              <div
                key={label}
                onClick={() => (href ? router.push(href) : null)}
                className={`flex items-center justify-between px-4 py-3.5 transition-colors ${
                  href ? "cursor-pointer hover:bg-[#F4F6F8]" : "cursor-default"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F4F6F8] flex items-center justify-center">
                    <Icon size={16} className="text-[#1B4332]" />
                  </div>
                  <span className="text-sm text-[#1A202C] font-medium">
                    {label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {value && (
                    <span className="text-sm text-[#A0AEC0]">{value}</span>
                  )}
                  <ChevronRight size={14} className="text-[#A0AEC0]" />
                </div>
              </div>
            ))}
          </Card>
        </div>
      ))}

      {/* App Info */}
      <Card className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-[#1A202C]">OneBank</p>
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