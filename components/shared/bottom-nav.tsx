"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSessionStore } from "@/store/session-store";
import {
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  BarChart2,
  Settings,
  LogOut,
} from "lucide-react";

const navItems = [
  { label: "Overview", href: "/overview", icon: LayoutDashboard },
  { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { label: "Payments", href: "/payments", icon: CreditCard },
  { label: "Analytics", href: "/analytics", icon: BarChart2 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();
  const clearSession = useSessionStore((s) => s.clearSession);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] z-50"
      style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-xl transition-all ${
                isActive ? "text-[#1B4332]" : "text-[#A0AEC0]"
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className={`text-[9px] font-medium ${
                isActive ? "text-[#1B4332]" : "text-[#A0AEC0]"
              }`}>
                {label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-[#D4A017]" />
              )}
            </Link>
          );
        })}

        {/* Sign Out */}
        <button
          onClick={() => {
            clearSession();
            signOut({ callbackUrl: "/login" });
          }}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-xl transition-all text-[#C0392B]"
        >
          <LogOut size={18} strokeWidth={1.5} />
          <span className="text-[9px] font-medium">Sign Out</span>
        </button>
      </div>
    </nav>
  );
}