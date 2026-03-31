"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  Users,
  BarChart2,
  Settings,
  MessageSquare,
} from "lucide-react";

const navItems = [
  { label: "Overview", href: "/overview", icon: LayoutDashboard },
  { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { label: "Payments", href: "/payments", icon: CreditCard },
  { label: "Beneficiaries", href: "/beneficiaries", icon: Users },
  { label: "Analytics", href: "/analytics", icon: BarChart2 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] z-50">
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
      </div>
    </nav>
  );
}