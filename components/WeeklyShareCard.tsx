"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import Card from "./Card";

export default function WeeklyShareCard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function share() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/share/weekly");
      const blob = await res.blob();
      const file = new File([blob], "hum-do-hafta-warri-report.png", { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Hum Do ki Hafta Warri Report",
        });
      } else {
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
      }
    } catch {
      setError("Share nahi ho saka, dobara koshish karein");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <button
        type="button"
        onClick={share}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 text-sm font-semibold text-stone-600 disabled:opacity-50"
      >
        <Share2 className="h-4 w-4" strokeWidth={2} />
        {loading ? "Taiyar ho raha hai..." : "Hafta warri report share karein"}
      </button>
      {error && <p className="mt-2 text-center text-xs text-red-600">{error}</p>}
    </Card>
  );
}
