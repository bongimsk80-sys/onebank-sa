"use client";

import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Sun,
  Moon,
  Monitor,
  Check,
} from "lucide-react";

const themes = [
  {
    id: "light",
    label: "Light",
    description: "Clean white interface — best for daytime use",
    icon: <Sun size={24} />,
    bg: "bg-white",
    border: "border-[#E2E8F0]",
    preview: {
      bg: "#F4F6F8",
      sidebar: "#1B4332",
      card: "#FFFFFF",
      text: "#1A202C",
    },
  },
  {
    id: "dark",
    label: "Dark",
    description: "Easy on the eyes — best for nighttime use",
    icon: <Moon size={24} />,
    bg: "bg-[#1A1D27]",
    border: "border-[#2D3748]",
    preview: {
      bg: "#0F1117",
      sidebar: "#0D2B1F",
      card: "#1A1D27",
      text: "#F7FAFC",
    },
  },
  {
    id: "system",
    label: "System",
    description: "Automatically matches your device settings",
    icon: <Monitor size={24} />,
    bg: "bg-gradient-to-r from-white to-[#1A1D27]",
    border: "border-[#E2E8F0]",
    preview: {
      bg: "#8B98A8",
      sidebar: "#1B4332",
      card: "#C5CDD5",
      text: "#1A202C",
    },
  },
];

export default function DisplaySettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

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
      <div>
        <h2 className="text-lg font-bold text-[#1A202C] dark:text-white">
          Display Settings
        </h2>
        <p className="text-xs text-[#718096] mt-0.5">
          Choose your preferred appearance
        </p>
      </div>

      {/* Theme Options */}
      <div className="space-y-3">
        {themes.map((t) => (
          <Card
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
              theme === t.id
                ? "border-[#1B4332] bg-[#F0FDF4] dark:bg-[#1A1D27]"
                : "border-[#E2E8F0] bg-white dark:bg-[#1A1D27] dark:border-[#2D3748] hover:border-[#1B4332]"
            }`}
          >
            <div className="flex items-center gap-4">
              {/* Preview */}
              <div
                className="w-16 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-[#E2E8F0]"
                style={{ backgroundColor: t.preview.bg }}
              >
                <div className="flex h-full">
                  <div
                    className="w-4 h-full"
                    style={{ backgroundColor: t.preview.sidebar }}
                  />
                  <div className="flex-1 p-1 space-y-1">
                    <div
                      className="h-2 rounded-sm"
                      style={{ backgroundColor: t.preview.card }}
                    />
                    <div
                      className="h-2 rounded-sm w-3/4"
                      style={{ backgroundColor: t.preview.card }}
                    />
                    <div
                      className="h-2 rounded-sm w-1/2"
                      style={{ backgroundColor: t.preview.card }}
                    />
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[#718096] dark:text-[#A0AEC0]">
                    {t.icon}
                  </span>
                  <p className="text-sm font-bold text-[#1A202C] dark:text-white">
                    {t.label}
                  </p>
                </div>
                <p className="text-xs text-[#718096] mt-0.5">
                  {t.description}
                </p>
              </div>

              {/* Selected indicator */}
              {theme === t.id && (
                <div className="w-6 h-6 rounded-full bg-[#1B4332] flex items-center justify-center flex-shrink-0">
                  <Check size={12} className="text-white" />
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Current Theme Info */}
      <Card className="p-4 rounded-xl border border-[#E2E8F0] dark:border-[#2D3748] bg-white dark:bg-[#1A1D27] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#F0FDF4] flex items-center justify-center">
            {theme === "dark" ? (
              <Moon size={16} className="text-[#1B4332]" />
            ) : theme === "system" ? (
              <Monitor size={16} className="text-[#1B4332]" />
            ) : (
              <Sun size={16} className="text-[#1B4332]" />
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-[#1A202C] dark:text-white">
              Currently using{" "}
              <span className="text-[#1B4332] capitalize">{theme}</span> mode
            </p>
            <p className="text-[10px] text-[#718096]">
              {theme === "system"
                ? "Follows your device's appearance settings"
                : theme === "dark"
                ? "Dark mode is active — easier on the eyes at night"
                : "Light mode is active — crisp and clear"}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
