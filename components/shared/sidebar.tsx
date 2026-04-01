"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSessionStore } from "@/store/session-store";
import {
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  Users,
  BarChart2,
  Settings,
  LogOut,
  Link2,
  UserCog,
  MessageSquare,
} from "lucide-react";

const baseNavItems = [
  { label: "Overview", href: "/overview", icon: LayoutDashboard },
  { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { label: "Payments", href: "/payments", icon: CreditCard },
  { label: "Beneficiaries", href: "/beneficiaries", icon: Users },
  { label: "Analytics", href: "/analytics", icon: BarChart2 },
  { label: "ERP", href: "/erp", icon: Link2 },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Users", href: "/users", icon: UserCog },
];

const roleColors: Record<string, string> = {
  admin: "#D4A017",
  approver: "#27AE60",
  initiator: "#2980B9",
  reviewer: "#E67E22",
  executor: "#7C3AED",
  viewer: "#A0AEC0",
};

export default function Sidebar() {
  const pathname = usePathname();
  const { name, role } = useSessionStore();
  const clearSession = useSessionStore((s) => s.clearSession);
  const navItems = [
    ...baseNavItems,
    ...(role === "admin"
      ? [{ label: "Feedback", href: "/feedback", icon: MessageSquare }]
      : []),
  ];

  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
    : "OB";

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-[#1B4332] text-white dark:bg-[#1B4332] dark:text-white z-40">
      {/* Logo */}
      <div className="p-6 border-b border-[#2D6A4F] dark:border-[#2D6A4F]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#D4A017] flex items-center justify-center font-bold text-[#1B4332] text-sm">
            OB
          </div>
          <div>
            <p className="font-bold text-base leading-tight">OneBank</p>
            <p className="text-xs text-[#A0C4B1]">South Africa</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-[#D4A017] text-[#1B4332] dark:bg-[#D4A017] dark:text-[#1B4332]"
                  : "text-[#A0C4B1] hover:bg-[#2D6A4F] hover:text-white dark:text-[#A0C4B1] dark:hover:bg-[#2D6A4F] dark:hover:text-white"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom user section */}
      <div className="p-4 border-t border-[#2D6A4F] dark:border-[#2D6A4F] space-y-2">
        <div className="flex items-center gap-3 px-4 py-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{
              backgroundColor: roleColors[role ?? "viewer"] ?? "#A0AEC0",
              color: "#1B4332",
            }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{name ?? "User"}</p>
            <p className="text-xs text-[#A0C4B1] dark:text-[#A0C4B1] capitalize">{role ?? "viewer"}</p>
          </div>
        </div>
        <button
          onClick={() => {
            clearSession();
            signOut({ callbackUrl: "/login" });
          }}
          className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-xs text-[#A0C4B1] hover:bg-[#2D6A4F] hover:text-white dark:text-[#A0C4B1] dark:hover:bg-[#2D6A4F] dark:hover:text-white transition-all"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}