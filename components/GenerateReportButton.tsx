"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GenerateReportButton({ month }: { month: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    await fetch(`/api/reports/generate?month=${month}`);
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={generate}
      disabled={loading}
      className="rounded-full bg-[#D8A548] px-5 py-2.5 text-sm font-semibold text-[#124D30] transition active:scale-95 disabled:opacity-50"
    >
      {loading ? "Taiyar ho raha hai..." : "Abhi banao"}
    </button>
  );
}
