"use client";

import { useState } from "react";
import { MessageSquare, X, Send, Star } from "lucide-react";

const categories = [
  "Bug / Error",
  "UI / Design",
  "Missing Feature",
  "Performance",
  "General Feedback",
  "Other",
];

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function toggleCategory(cat: string) {
    setSelectedCategories((prev) =>
      prev.includes(cat)
        ? prev.filter((c) => c !== cat)
        : [...prev, cat]
    );
  }

  async function handleSubmit() {
    if (!rating) return;
    setSubmitting(true);

    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          categories: selectedCategories,
          message: message || null,
          page: window.location.pathname,
        }),
      });

      setSubmitted(true);
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        setRating(0);
        setHoveredRating(0);
        setSelectedCategories([]);
        setMessage("");
        // Refresh page if on feedback page
        if (window.location.pathname === "/feedback") {
          window.location.reload();
        }
      }, 2000);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setSubmitted(false);
    setRating(0);
    setHoveredRating(0);
    setSelectedCategories([]);
    setMessage("");
  }

  const ratingLabels: Record<number, string> = {
    1: "Very Poor",
    2: "Poor",
    3: "Average",
    4: "Good",
    5: "Excellent",
  };

  return (
    <>
      {/* Feedback Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 left-6 lg:bottom-8 lg:left-72 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D4A017] text-white text-xs font-semibold shadow-lg hover:bg-[#A07810] transition-colors"
      >
        <MessageSquare size={14} />
        Feedback
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4">
          <div
            className="w-full lg:max-w-md rounded-t-3xl lg:rounded-2xl overflow-hidden shadow-2xl"
            style={{ backgroundColor: "var(--surface)" }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: "var(--border)" }}
            >
              <div>
                <h2
                  className="text-base font-bold"
                  style={{ color: "var(--text)" }}
                >
                  Share Feedback
                </h2>
                <p className="text-[10px] text-[#718096]">
                  Help us improve OneBank
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-[#F4F6F8] flex items-center justify-center"
              >
                <X size={16} className="text-[#718096]" />
              </button>
            </div>

            {submitted ? (
              <div className="px-6 py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-[#F0FDF4] flex items-center justify-center mx-auto mb-4">
                  <Send size={24} className="text-[#27AE60]" />
                </div>
                <p
                  className="text-base font-bold"
                  style={{ color: "var(--text)" }}
                >
                  Thank you!
                </p>
                <p className="text-sm text-[#718096] mt-1">
                  Your feedback has been recorded.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-y-auto max-h-[75vh] px-6 py-5 space-y-5">

                  {/* Star Rating */}
                  <div>
                    <label className="text-xs font-semibold text-[#718096] uppercase tracking-wide mb-3 block">
                      Overall Rating *
                    </label>
                    <div className="flex gap-2 items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          className="transition-transform hover:scale-110 focus:outline-none"
                        >
                          <Star
                            size={32}
                            className={
                              star <= (hoveredRating || rating)
                                ? "fill-[#D4A017] text-[#D4A017]"
                                : "text-[#E2E8F0]"
                            }
                          />
                        </button>
                      ))}
                      {(hoveredRating || rating) > 0 && (
                        <span className="text-sm font-semibold text-[#D4A017] ml-1">
                          {ratingLabels[hoveredRating || rating]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Categories — multi select */}
                  <div>
                    <label className="text-xs font-semibold text-[#718096] uppercase tracking-wide mb-2 block">
                      Category{" "}
                      <span className="text-[#A0AEC0] normal-case font-normal">
                        (select all that apply)
                      </span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((cat) => {
                        const selected = selectedCategories.includes(cat);
                        return (
                          <button
                            key={cat}
                            onClick={() => toggleCategory(cat)}
                            className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all border text-left flex items-center gap-2 ${
                              selected
                                ? "bg-[#1B4332] text-white border-[#1B4332]"
                                : "bg-[#F4F6F8] text-[#718096] border-transparent hover:border-[#E2E8F0]"
                            }`}
                          >
                            <span
                              className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center ${
                                selected
                                  ? "bg-[#D4A017] border-[#D4A017]"
                                  : "border-[#CBD5E0]"
                              }`}
                            >
                              {selected && (
                                <svg
                                  viewBox="0 0 10 8"
                                  fill="none"
                                  className="w-2.5 h-2.5"
                                >
                                  <path
                                    d="M1 4l2.5 2.5L9 1"
                                    stroke="white"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </span>
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Message — optional */}
                  <div>
                    <label className="text-xs font-semibold text-[#718096] uppercase tracking-wide mb-2 block">
                      Additional Comments{" "}
                      <span className="text-[#A0AEC0] normal-case font-normal">
                        (optional)
                      </span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Tell us more about your experience..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#F4F6F8] text-sm text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-[#1B4332] resize-none"
                    />
                  </div>

                  {/* Page indicator */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F4F6F8]">
                    <p className="text-[10px] text-[#718096]">
                      📍 Page:{" "}
                      <span className="font-semibold text-[#1A202C]">
                        {typeof window !== "undefined"
                          ? window.location.pathname
                          : ""}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div
                  className="px-6 py-4 border-t flex gap-3"
                  style={{ borderColor: "var(--border)" }}
                >
                  <button
                    onClick={handleClose}
                    className="flex-1 h-11 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#718096]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!rating || submitting}
                    className="flex-1 h-11 rounded-xl bg-[#1B4332] text-white text-sm font-semibold disabled:opacity-40 hover:bg-[#2D6A4F] transition-colors flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      "Submitting..."
                    ) : (
                      <>
                        <Send size={14} />
                        Submit Feedback
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
