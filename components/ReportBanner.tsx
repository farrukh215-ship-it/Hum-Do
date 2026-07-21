"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ReportBanner({ month, label }: { month: string; label: string }) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem("dismissedReportMonth") === month);
  }, [month]);

  if (dismissed) return null;

  function dismiss() {
    localStorage.setItem("dismissedReportMonth", month);
    setDismissed(true);
  }

  return (
    <div className="flex items-center gap-2 rounded-3xl bg-[#124D30] p-4 text-[#FDF7EA] shadow-sm">
      <Link href={`/report/${month}`} className="flex-1">
        <p className="text-sm font-semibold">🎬 {label} ka Sach tayyar hai!</p>
        <p className="text-xs opacity-70">Dekho kya nikla →</p>
      </Link>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Band karo"
        className="text-sm opacity-60"
      >
        ✕
      </button>
    </div>
  );
}
