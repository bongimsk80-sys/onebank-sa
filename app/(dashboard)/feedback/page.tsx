"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Star, MessageSquare, Filter, X } from "lucide-react";
import { useSessionStore } from "@/store/session-store";

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(dateStr: string) {
  const diff = Math.floor(
    (new Date().getTime() - new Date(dateStr).getTime()) / 1000
  );
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const ratingColors: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: "#FFF1F2", text: "#C0392B", label: "Very Poor" },
  2: { bg: "#FFF7ED", text: "#E67E22", label: "Poor" },
  3: { bg: "#FFFBEB", text: "#D4A017", label: "Average" },
  4: { bg: "#F0FDF4", text: "#27AE60", label: "Good" },
  5: { bg: "#F0FDF4", text: "#1B4332", label: "Excellent" },
};

const roleColors: Record<string, { bg: string; text: string }> = {
  admin: { bg: "#FFF7ED", text: "#D4A017" },
  initiator: { bg: "#EFF6FF", text: "#2980B9" },
  reviewer: { bg: "#F5F3FF", text: "#7C3AED" },
  approver: { bg: "#F0FDF4", text: "#27AE60" },
  executor: { bg: "#FFF1F2", text: "#C0392B" },
  viewer: { bg: "#F4F6F8", text: "#718096" },
};

export default function FeedbackPage() {
  const { role } = useSessionStore();
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchFeedback();
    // Poll for new feedback every 10 seconds
    const interval = setInterval(fetchFeedback, 10000);
    return () => clearInterval(interval);
  }, []);

  if (role !== "admin") {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center">
        <p className="text-sm text-[#A0AEC0]">
          You don't have permission to view feedback.
        </p>
      </div>
    );
  }

  async function fetchFeedback() {
    try {
      const res = await fetch("/api/feedback");
      const data = await res.json();
      setFeedback(data.feedback ?? []);
    } catch (error) {
      console.error("Failed to fetch feedback:", error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = feedback.filter((f) =>
    filterRating === 0 ? true : f.rating === filterRating
  );

  const avgRating =
    feedback.length > 0
      ? (
          feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length
        ).toFixed(1)
      : "0.0";

  const ratingCounts = [5, 4, 3, 2, 1].map((r) => ({
    rating: r,
    count: feedback.filter((f) => f.rating === r).length,
    percent:
      feedback.length > 0
        ? Math.round(
            (feedback.filter((f) => f.rating === r).length / feedback.length) *
              100
          )
        : 0,
  }));

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-[#1A202C]">
          Beta Feedback
        </h2>
        <p className="text-xs text-[#718096] mt-0.5">
          All feedback submitted by beta testers
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-sm text-center">
          <p className="text-2xl font-bold text-[#1B4332]">
            {feedback.length}
          </p>
          <p className="text-[10px] text-[#718096] mt-0.5">
            Total Responses
          </p>
        </Card>
        <Card className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-sm text-center">
          <div className="flex items-center justify-center gap-1">
            <p className="text-2xl font-bold text-[#D4A017]">{avgRating}</p>
            <Star size={16} className="fill-[#D4A017] text-[#D4A017]" />
          </div>
          <p className="text-[10px] text-[#718096] mt-0.5">Average Rating</p>
        </Card>
        <Card className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-sm text-center">
          <p className="text-2xl font-bold text-[#27AE60]">
            {feedback.filter((f) => f.rating >= 4).length}
          </p>
          <p className="text-[10px] text-[#718096] mt-0.5">
            Positive (4-5 ⭐)
          </p>
        </Card>
      </div>

      {/* Rating Breakdown */}
      <Card className="p-5 rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
        <h3 className="text-sm font-bold text-[#1A202C] mb-4">
          Rating Breakdown
        </h3>
        <div className="space-y-2">
          {ratingCounts.map(({ rating, count, percent }) => (
            <div key={rating} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-16 flex-shrink-0">
                <span className="text-xs font-semibold text-[#718096]">
                  {rating}
                </span>
                <Star size={12} className="fill-[#D4A017] text-[#D4A017]" />
              </div>
              <div className="flex-1 h-2 bg-[#F4F6F8] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#D4A017] transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="text-xs text-[#718096] w-8 text-right">
                {count}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Filter + List Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#718096]">
          {filtered.length} response{filtered.length !== 1 ? "s" : ""}
          {filterRating > 0 ? ` with ${filterRating} star${filterRating !== 1 ? "s" : ""}` : ""}
        </p>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
            filterRating > 0
              ? "bg-[#1B4332] text-white border-[#1B4332]"
              : "bg-white text-[#718096] border-[#E2E8F0]"
          }`}
        >
          <Filter size={13} />
          Filter by Rating
          {filterRating > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#D4A017] text-white text-[10px] font-bold flex items-center justify-center">
              {filterRating}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-[#1A202C] uppercase tracking-wide">
              Filter by Stars
            </p>
            <button onClick={() => setShowFilters(false)}>
              <X size={14} className="text-[#A0AEC0]" />
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterRating(0)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterRating === 0
                  ? "bg-[#1B4332] text-white"
                  : "bg-[#F4F6F8] text-[#718096]"
              }`}
            >
              All
            </button>
            {[5, 4, 3, 2, 1].map((r) => (
              <button
                key={r}
                onClick={() => setFilterRating(r)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filterRating === r
                    ? "bg-[#1B4332] text-white"
                    : "bg-[#F4F6F8] text-[#718096]"
                }`}
              >
                {r}
                <Star size={10} className="fill-[#D4A017] text-[#D4A017]" />
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Feedback List */}
      {loading ? (
        <div className="py-12 text-center text-sm text-[#A0AEC0]">
          Loading feedback...
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 rounded-xl border border-[#E2E8F0] bg-white shadow-sm text-center">
          <MessageSquare size={32} className="text-[#E2E8F0] mx-auto mb-3" />
          <p className="text-sm text-[#A0AEC0]">No feedback yet</p>
          <p className="text-xs text-[#A0AEC0] mt-1">
            Share the app with beta testers to collect feedback
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const ratingStyle = ratingColors[item.rating];
            const roleStyle = roleColors[item.userRole] ?? roleColors.viewer;
            const cats = JSON.parse(item.categories ?? "[]");

            return (
              <Card
                key={item.id}
                className="p-5 rounded-xl border border-[#E2E8F0] bg-white shadow-sm"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        backgroundColor: roleStyle.bg,
                        color: roleStyle.text,
                      }}
                    >
                      {item.userName
                        ?.split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1A202C]">
                        {item.userName ?? "Anonymous"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md capitalize"
                          style={{
                            backgroundColor: roleStyle.bg,
                            color: roleStyle.text,
                          }}
                        >
                          {item.userRole}
                        </span>
                        {item.page && (
                          <span className="text-[10px] text-[#A0AEC0]">
                            📍 {item.page}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="text-right flex-shrink-0">
                    <div
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl"
                      style={{
                        backgroundColor: ratingStyle.bg,
                        color: ratingStyle.text,
                      }}
                    >
                      {[...Array(item.rating)].map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          className="fill-current"
                        />
                      ))}
                      <span className="text-[10px] font-bold ml-1">
                        {ratingStyle.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Categories */}
                {cats.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {cats.map((cat: string) => (
                      <span
                        key={cat}
                        className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-[#F4F6F8] text-[#718096]"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}

                {/* Message */}
                {item.message && (
                  <div className="p-3 rounded-xl bg-[#F4F6F8] mb-3">
                    <p className="text-xs text-[#1A202C] leading-relaxed">
                      "{item.message}"
                    </p>
                  </div>
                )}

                {/* Timestamp */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-[#718096]">
                    🕐 {formatDateTime(item.createdAt)}
                  </span>
                  <span className="text-[10px] text-[#A0AEC0]">
                    ({timeAgo(item.createdAt)})
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
