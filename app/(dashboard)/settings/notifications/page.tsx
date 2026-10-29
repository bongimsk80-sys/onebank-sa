"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Bell,
  CreditCard,
  CheckSquare,
  XCircle,
  Clock,
  Users,
  Building2,
  Shield,
  TrendingUp,
  Mail,
  Smartphone,
} from "lucide-react";

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  enabled: boolean;
}

interface NotificationChannel {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
}

const defaultChannels: NotificationChannel[] = [
  {
    id: "inApp",
    label: "In-App Notifications",
    description: "Bell icon alerts within OneView",
    icon: <Bell size={16} />,
    enabled: true,
  },
  {
    id: "email",
    label: "Email Notifications",
    description: "Alerts sent to bonginkosi@oneview.co.za",
    icon: <Mail size={16} />,
    enabled: true,
  },
  {
    id: "sms",
    label: "SMS Notifications",
    description: "Text message alerts to your registered number",
    icon: <Smartphone size={16} />,
    enabled: false,
  },
];

const defaultSettings: NotificationSetting[] = [
  {
    id: "paymentCreated",
    label: "Payment Created",
    description: "When a new payment request is submitted",
    icon: <CreditCard size={16} />,
    iconBg: "#EFF6FF",
    iconColor: "#2980B9",
    enabled: true,
  },
  {
    id: "paymentApproved",
    label: "Payment Approved",
    description: "When a payment is approved by an approver",
    icon: <CheckSquare size={16} />,
    iconBg: "#F0FDF4",
    iconColor: "#27AE60",
    enabled: true,
  },
  {
    id: "paymentRejected",
    label: "Payment Rejected",
    description: "When a payment is rejected at any stage",
    icon: <XCircle size={16} />,
    iconBg: "#FFF1F2",
    iconColor: "#C0392B",
    enabled: true,
  },
  {
    id: "paymentExecuted",
    label: "Payment Executed",
    description: "When a payment is sent to the bank",
    icon: <TrendingUp size={16} />,
    iconBg: "#FFF7ED",
    iconColor: "#E67E22",
    enabled: true,
  },
  {
    id: "paymentScheduled",
    label: "Scheduled Payment",
    description: "When a scheduled payment is due",
    icon: <Clock size={16} />,
    iconBg: "#F5F3FF",
    iconColor: "#7C3AED",
    enabled: true,
  },
  {
    id: "userAdded",
    label: "User Added",
    description: "When a new user is added to the organisation",
    icon: <Users size={16} />,
    iconBg: "#F5F3FF",
    iconColor: "#7C3AED",
    enabled: false,
  },
  {
    id: "beneficiaryAdded",
    label: "Beneficiary Added",
    description: "When a new beneficiary is added",
    icon: <Building2 size={16} />,
    iconBg: "#F0FDF4",
    iconColor: "#1B4332",
    enabled: false,
  },
  {
    id: "securityAlert",
    label: "Security Alerts",
    description: "Failed login attempts and suspicious activity",
    icon: <Shield size={16} />,
    iconBg: "#FFF1F2",
    iconColor: "#C0392B",
    enabled: true,
  },
];

export default function NotificationSettingsPage() {
  const router = useRouter();

  const [channels, setChannels] = useState<NotificationChannel[]>(() => {
    if (typeof window === "undefined") return defaultChannels;
    try {
      const saved = localStorage.getItem("oneview_notification_channels");
      if (!saved) return defaultChannels;
      const parsed = JSON.parse(saved);
      return defaultChannels.map((def) => ({
        ...def,
        enabled: parsed.find((p: any) => p.id === def.id)?.enabled ?? def.enabled,
      }));
    } catch {
      return defaultChannels;
    }
  });

  const [settings, setSettings] = useState<NotificationSetting[]>(() => {
    if (typeof window === "undefined") return defaultSettings;
    try {
      const saved = localStorage.getItem("oneview_notification_settings");
      if (!saved) return defaultSettings;
      const parsed = JSON.parse(saved);
      return defaultSettings.map((def) => ({
        ...def,
        enabled: parsed.find((p: any) => p.id === def.id)?.enabled ?? def.enabled,
      }));
    } catch {
      return defaultSettings;
    }
  });

  function toggleChannel(id: string) {
    setChannels((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
  }

  function toggleSetting(id: string) {
    setSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  }

  function enableAll() {
    setSettings((prev) => prev.map((s) => ({ ...s, enabled: true })));
    setChannels((prev) => prev.map((c) => ({ ...c, enabled: true })));
  }

  function disableAll() {
    setSettings((prev) => prev.map((s) => ({ ...s, enabled: false })));
    setChannels((prev) => prev.map((c) => ({ ...c, enabled: false })));
  }

  function handleSave() {
    localStorage.setItem(
      "oneview_notification_channels",
      JSON.stringify(channels.map(({ icon, ...rest }) => rest))
    );
    localStorage.setItem(
      "oneview_notification_settings",
      JSON.stringify(settings.map(({ icon, ...rest }) => rest))
    );
    router.back();
  }

  const enabledCount = settings.filter((s) => s.enabled).length;

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-[#718096] hover:text-[#1B4332] transition-colors font-medium"
      >
        <ArrowLeft size={16} />
        Back to Settings
      </button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1A202C]">
            Notification Settings
          </h2>
          <p className="text-xs text-[#718096] mt-0.5">
            {enabledCount} of {settings.length} alerts enabled
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={disableAll}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#FFF1F2] text-[#C0392B] hover:bg-[#FFC5C5] transition-colors"
          >
            Disable All
          </button>
          <button
            onClick={enableAll}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#F0FDF4] text-[#27AE60] hover:bg-[#BBF7D0] transition-colors"
          >
            Enable All
          </button>
        </div>
      </div>

      {/* Channels */}
      <div>
        <p className="text-xs font-bold text-[#718096] uppercase tracking-widest mb-3">
          Notification Channels
        </p>
        <Card className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm divide-y divide-[#E2E8F0]">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className="flex items-center justify-between px-4 py-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#F0FDF4] flex items-center justify-center text-[#1B4332]">
                  {channel.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1A202C]">
                    {channel.label}
                  </p>
                  <p className="text-xs text-[#718096]">{channel.description}</p>
                </div>
              </div>
              <Toggle
                enabled={channel.enabled}
                onToggle={() => toggleChannel(channel.id)}
              />
            </div>
          ))}
        </Card>
      </div>

      {/* Alert Types */}
      <div>
        <p className="text-xs font-bold text-[#718096] uppercase tracking-widest mb-3">
          Alert Types
        </p>
        <Card className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm divide-y divide-[#E2E8F0]">
          {settings.map((setting) => (
            <div
              key={setting.id}
              className="flex items-center justify-between px-4 py-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: setting.iconBg,
                    color: setting.iconColor,
                  }}
                >
                  {setting.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1A202C]">
                    {setting.label}
                  </p>
                  <p className="text-xs text-[#718096]">{setting.description}</p>
                </div>
              </div>
              <Toggle
                enabled={setting.enabled}
                onToggle={() => toggleSetting(setting.id)}
              />
            </div>
          ))}
        </Card>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full h-12 rounded-xl bg-[#1B4332] text-white text-sm font-semibold hover:bg-[#2D6A4F] transition-colors"
      >
        Save Notification Preferences
      </button>
    </div>
  );
}

function Toggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
        enabled ? "bg-[#1B4332]" : "bg-[#CBD5E0]"
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full shadow-sm transition-transform ${
          enabled ? "translate-x-5 bg-[#D4A017]" : "translate-x-0.5 bg-white"
        }`}
        style={{
          backgroundColor: enabled ? "#D4A017" : "#FFFFFF",
        }}
      />
    </button>
  );
}
