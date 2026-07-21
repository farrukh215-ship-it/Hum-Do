"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

export default function ReportShareButton({ month }: { month: string }) {
  const [loading, setLoading] = useState(false);

  async function share() {
    setLoading(true);

    try {
      const res = await fetch(`/api/reports/${month}/image`);
      const blob = await res.blob();
      const file = new File([blob], `hum-do-ka-sach-${month}.png`, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Mahine ka Sach" });
      } else {
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      disabled={loading}
      className="flex items-center justify-center gap-2 rounded-full border border-[#FDF7EA]/30 px-5 py-2.5 text-sm font-semibold text-[#FDF7EA] transition active:scale-95 disabled:opacity-50"
    >
      <Share2 className="h-4 w-4" strokeWidth={2} />
      {loading ? "Taiyar ho raha hai..." : "Share karo"}
    </button>
  );
}
