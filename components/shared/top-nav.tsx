"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import NotificationsPanel from "@/components/shared/notifications-panel";

const pageTitles: Record<string, string> = {
  "/overview": "Overview",
  "/transactions": "Transactions",
  "/payments": "Payments",
  "/beneficiaries": "Beneficiaries",
  "/analytics": "Analytics",
  "/erp": "ERP Integration",
  "/settings": "Settings",
  "/users": "User Management",
  "/feedback": "Beta Feedback",
};

export default function TopNav() {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "OneBank";
  const { unreadCount, refetch } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header
      className="sticky top-0 z-30 border-b px-4 lg:px-8 h-16 flex items-center justify-between"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      {/* Mobile logo + Page title */}
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-[#1B4332] flex items-center justify-center text-white font-bold text-xs lg:hidden">
          OB
        </div>
        <h1
          className="text-base lg:text-lg font-bold"
          style={{ color: "var(--text)" }}
        >
          {title}
        </h1>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 relative">
        <button className="p-2 rounded-xl hover:bg-[#F4F6F8] transition-colors">
          <Search size={18} className="text-[#718096]" />
        </button>

        {/* Bell Button */}
        <button
          onClick={() => {
            setShowNotifications(!showNotifications);
            refetch();
          }}
          className="relative p-2 rounded-xl hover:bg-[#F4F6F8] transition-colors"
        >
          <Bell size={18} className="text-[#718096]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center bg-[#D4A017] text-white text-[10px] font-bold rounded-full border-2 border-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Notifications Panel */}
        {showNotifications && (
          <NotificationsPanel
            onClose={() => setShowNotifications(false)}
          />
        )}
      </div>
    </header>
  );
}