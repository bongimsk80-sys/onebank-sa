"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  ChevronRight,
} from "lucide-react";

const typeConfig: Record<string, {
  icon: React.ReactNode;
  bg: string;
  text: string;
  border: string;
}> = {
  success: {
    icon: <CheckCircle size={16} />,
    bg: "#F0FDF4",
    text: "#27AE60",
    border: "#BBF7D0",
  },
  error: {
    icon: <XCircle size={16} />,
    bg: "#FFF1F2",
    text: "#C0392B",
    border: "#FFC5C5",
  },
  warning: {
    icon: <AlertTriangle size={16} />,
    bg: "#FFF7ED",
    text: "#E67E22",
    border: "#FFE0B2",
  },
  info: {
    icon: <Info size={16} />,
    bg: "#EFF6FF",
    text: "#2980B9",
    border: "#BFDBFE",
  },
};

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

interface NotificationsPanelProps {
  onClose: () => void;
}

export default function NotificationsPanel({ onClose }: NotificationsPanelProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(data.notifications ?? []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function deleteNotification(id: string) {
    await fetch("/api/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  function handleNotificationClick(notification: any) {
    markAsRead(notification.id);
    if (notification.link) {
      router.push(notification.link);
      onClose();
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      ref={panelRef}
      className="absolute top-14 right-0 w-[360px] bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-[#1B4332]" />
          <h3 className="text-sm font-bold text-[#1A202C]">Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg bg-[#D4A017] text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-[10px] text-[#1B4332] font-semibold hover:underline"
            >
              <CheckCheck size={12} />
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-[#F4F6F8] flex items-center justify-center hover:bg-[#E2E8F0] transition-colors"
          >
            <X size={12} className="text-[#718096]" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto max-h-[420px]">
        {loading ? (
          <div className="py-8 text-center text-sm text-[#A0AEC0]">
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center">
            <Bell size={32} className="text-[#E2E8F0] mx-auto mb-2" />
            <p className="text-sm text-[#A0AEC0]">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F4F6F8]">
            {notifications.map((notification) => {
              const config = typeConfig[notification.type] ?? typeConfig.info;
              return (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-[#F4F6F8] transition-colors cursor-pointer relative ${
                    !notification.read ? "bg-[#FAFFFE]" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {/* Unread dot */}
                  {!notification.read && (
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#D4A017]" />
                  )}

                  {/* Icon */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      backgroundColor: config.bg,
                      color: config.text,
                    }}
                  >
                    {config.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold text-[#1A202C] ${!notification.read ? "font-bold" : ""}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-[#718096] mt-0.5 leading-relaxed">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-[#A0AEC0]">
                        {timeAgo(notification.createdAt)}
                      </span>
                      {notification.link && (
                        <span className="text-[10px] text-[#1B4332] font-semibold flex items-center gap-0.5">
                          View <ChevronRight size={10} />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    className="w-6 h-6 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 group-hover:opacity-100 hover:bg-[#FFF1F2] transition-all flex-shrink-0"
                  >
                    <Trash2 size={11} className="text-[#C0392B]" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-[#E2E8F0] text-center">
        <button className="text-xs text-[#1B4332] font-semibold hover:underline">
          View all notifications
        </button>
      </div>
    </div>
  );
}