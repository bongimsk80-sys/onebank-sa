"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface BetaBannerProps {
  message?: string;
}

/**
 * H4 — Simulation mode / beta banner.
 *
 * Shown at the top of financial pages (payments, overview) to make it
 * explicit to beta users that no real funds move. Dismissible per session
 * via local state (reappears on next visit).
 */
export default function BetaBanner({
  message = "Beta — Simulation Mode: Payments are processed in simulation only. No real funds are transferred.",
}: BetaBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      role="alert"
      className="flex items-start justify-between gap-3 px-4 py-3 rounded-xl
                 bg-amber-50 border border-amber-200 text-amber-800 text-sm
                 mb-5"
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle
          size={15}
          className="text-amber-500 flex-shrink-0 mt-0.5"
        />
        <p className="leading-relaxed">{message}</p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss banner"
        className="text-amber-400 hover:text-amber-600 transition-colors flex-shrink-0"
      >
        <X size={15} />
      </button>
    </div>
  );
}
