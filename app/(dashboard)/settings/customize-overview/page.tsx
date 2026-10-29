"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Check,
  GripVertical,
  LayoutDashboard,
  CreditCard,
  TrendingUp,
  Bell,
  Building2,
  BarChart2,
  Clock,
  Users,
  Eye,
  EyeOff,
} from "lucide-react";

interface Widget {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  visible: boolean;
  required?: boolean;
}

const defaultWidgets: Widget[] = [
  {
    id: "totalBalance",
    label: "Total Balance",
    description: "Shows combined balance across all bank accounts",
    icon: <Building2 size={16} />,
    iconBg: "#F0FDF4",
    iconColor: "#1B4332",
    visible: true,
    required: true,
  },
  {
    id: "bankAccounts",
    label: "Bank Accounts",
    description: "List of all connected bank accounts with balances",
    icon: <CreditCard size={16} />,
    iconBg: "#EFF6FF",
    iconColor: "#2980B9",
    visible: true,
  },
  {
    id: "paymentsSummary",
    label: "Payments Summary",
    description: "Overview of pending, approved and settled payments",
    icon: <LayoutDashboard size={16} />,
    iconBg: "#FFF7ED",
    iconColor: "#E67E22",
    visible: true,
  },
  {
    id: "recentTransactions",
    label: "Recent Transactions",
    description: "Latest transactions across all accounts",
    icon: <TrendingUp size={16} />,
    iconBg: "#F5F3FF",
    iconColor: "#7C3AED",
    visible: true,
  },
  {
    id: "cashFlow",
    label: "Cash Flow Chart",
    description: "6-month credits vs debits bar chart",
    icon: <BarChart2 size={16} />,
    iconBg: "#F0FDF4",
    iconColor: "#27AE60",
    visible: false,
  },
  {
    id: "pendingApprovals",
    label: "Pending Approvals",
    description: "Payments waiting for your approval action",
    icon: <Clock size={16} />,
    iconBg: "#FFF1F2",
    iconColor: "#C0392B",
    visible: true,
  },
  {
    id: "notifications",
    label: "Recent Notifications",
    description: "Latest system alerts and notifications",
    icon: <Bell size={16} />,
    iconBg: "#FFF7ED",
    iconColor: "#D4A017",
    visible: false,
  },
  {
    id: "teamActivity",
    label: "Team Activity",
    description: "Recent actions by your team members",
    icon: <Users size={16} />,
    iconBg: "#EFF6FF",
    iconColor: "#2980B9",
    visible: false,
  },
];

export default function CustomizeOverviewPage() {
  const router = useRouter();
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [saved, setSaved] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("oneview_overview_widgets");
      if (saved) {
        const parsed = JSON.parse(saved);
        setWidgets(
          defaultWidgets.map((def) => ({
            ...def,
            visible: parsed.find((p: { id: string; visible: boolean }) => p.id === def.id)?.visible ?? def.visible,
          }))
        );
      } else {
        setWidgets(defaultWidgets);
      }
    } catch {
      setWidgets(defaultWidgets);
    }
  }, []);

  function toggleWidget(id: string) {
    setWidgets((prev) =>
      prev.map((w) =>
        w.id === id && !w.required ? { ...w, visible: !w.visible } : w
      )
    );
  }

  function showAll() {
    setWidgets((prev) => prev.map((w) => ({ ...w, visible: true })));
  }

  function resetDefault() {
    setWidgets(defaultWidgets);
  }

  function handleDragStart(id: string) {
    setDraggingId(id);
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    setDragOverId(id);
  }

  function handleDrop(targetId: string) {
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }

    const newWidgets = [...widgets];
    const fromIndex = newWidgets.findIndex((w) => w.id === draggingId);
    const toIndex = newWidgets.findIndex((w) => w.id === targetId);
    const [moved] = newWidgets.splice(fromIndex, 1);
    newWidgets.splice(toIndex, 0, moved);

    setWidgets(newWidgets);
    setDraggingId(null);
    setDragOverId(null);
  }

  function handleSave() {
    localStorage.setItem(
      "oneview_overview_widgets",
      JSON.stringify(widgets.map(({ id, visible }) => ({ id, visible })))
    );
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      router.back();
    }, 1500);
  }

  const visibleCount = widgets.filter((w) => w.visible).length;

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
            Customize Overview
          </h2>
          <p className="text-xs text-[#718096] mt-0.5">
            {visibleCount} of {widgets.length} widgets visible
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetDefault}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#F4F6F8] text-[#718096] hover:bg-[#E2E8F0] transition-colors"
          >
            Reset
          </button>
          <button
            onClick={showAll}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#F0FDF4] text-[#27AE60] hover:bg-[#BBF7D0] transition-colors"
          >
            Show All
          </button>
        </div>
      </div>

      {/* Info Card */}
      <Card className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F0FDF4] shadow-sm">
        <div className="flex items-start gap-3">
          <LayoutDashboard size={16} className="text-[#1B4332] shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-[#1B4332]">
              How to Customise
            </p>
            <p className="text-xs text-[#718096] mt-0.5 leading-relaxed">
              Toggle widgets on or off using the eye icon. Drag and drop to
              reorder how they appear on your Overview dashboard.
            </p>
          </div>
        </div>
      </Card>

      {/* Widgets List */}
      <div className="space-y-2">
        {widgets.map((widget) => (
          <div
            key={widget.id}
            draggable
            onDragStart={() => handleDragStart(widget.id)}
            onDragOver={(e) => handleDragOver(e, widget.id)}
            onDrop={() => handleDrop(widget.id)}
            onDragEnd={() => {
              setDraggingId(null);
              setDragOverId(null);
            }}
            className={`transition-all ${
              draggingId === widget.id ? "opacity-40" : "opacity-100"
            } ${
              dragOverId === widget.id && draggingId !== widget.id
                ? "scale-[1.02]"
                : ""
            }`}
          >
            <Card
              className={`p-4 rounded-xl border-2 transition-all ${
                widget.visible
                  ? "border-[#E2E8F0] bg-white"
                  : "border-[#E2E8F0] bg-[#F4F6F8] opacity-60"
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Drag Handle */}
                <div className="cursor-grab active:cursor-grabbing shrink-0">
                  <GripVertical size={16} className="text-[#A0AEC0]" />
                </div>

                {/* Icon */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: widget.iconBg,
                    color: widget.iconColor,
                  }}
                >
                  {widget.icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#1A202C]">
                      {widget.label}
                    </p>
                    {widget.required && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#F4F6F8] text-[#A0AEC0]">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#718096] mt-0.5">
                    {widget.description}
                  </p>
                </div>

                {/* Toggle */}
                <button
                  onClick={() => toggleWidget(widget.id)}
                  disabled={widget.required}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                    widget.required
                      ? "opacity-30 cursor-not-allowed bg-[#F4F6F8]"
                      : widget.visible
                      ? "bg-[#F0FDF4] hover:bg-[#BBF7D0]"
                      : "bg-[#FFF1F2] hover:bg-[#FFC5C5]"
                  }`}
                >
                  {widget.visible ? (
                    <Eye size={15} className="text-[#27AE60]" />
                  ) : (
                    <EyeOff size={15} className="text-[#C0392B]" />
                  )}
                </button>
              </div>
            </Card>
          </div>
        ))}
      </div>

      {/* Preview Section */}
      <div>
        <p className="text-xs font-bold text-[#718096] uppercase tracking-widest mb-3">
          Preview
        </p>
        <Card className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            {widgets
              .filter((w) => w.visible)
              .map((widget, index) => (
                <div
                  key={widget.id}
                  className="flex items-center gap-2 p-2 rounded-xl"
                  style={{ backgroundColor: widget.iconBg }}
                >
                  <div style={{ color: widget.iconColor }}>
                    {widget.icon}
                  </div>
                  <p
                    className="text-[10px] font-semibold truncate"
                    style={{ color: widget.iconColor }}
                  >
                    {index + 1}. {widget.label}
                  </p>
                </div>
              ))}
          </div>
          {widgets.filter((w) => w.visible).length === 0 && (
            <p className="text-xs text-[#A0AEC0] text-center py-4">
              No widgets selected
            </p>
          )}
        </Card>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className={`w-full h-12 rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
          saved ? "bg-[#27AE60]" : "bg-[#1B4332] hover:bg-[#2D6A4F]"
        }`}
      >
        {saved ? (
          <>
            <Check size={16} />
            Saved Successfully!
          </>
        ) : (
          "Save Overview Layout"
        )}
      </button>
    </div>
  );
}
