"use client";

import { useRouter } from "next/navigation";
import { formatMonthLabel } from "@/lib/date";

const MONTHS_BACK = 12;

function buildMonthOptions(): { param: string; label: string }[] {
  const now = new Date();
  const options: { param: string; label: string }[] = [];

  for (let i = 0; i < MONTHS_BACK; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const param = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    options.push({ param, label: formatMonthLabel(d.toISOString()) });
  }

  return options;
}

export default function MonthPicker({ currentParam }: { currentParam: string }) {
  const router = useRouter();
  const options = buildMonthOptions();

  return (
    <select
      value={currentParam}
      onChange={(e) => router.push(`/month?month=${e.target.value}`)}
      className="w-full rounded-3xl bg-white px-4 py-3 text-center text-sm font-semibold text-stone-800 outline-none"
      aria-label="Mahina chunein"
    >
      {options.map((opt) => (
        <option key={opt.param} value={opt.param}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
