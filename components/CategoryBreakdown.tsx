"use client";

import { useState } from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { formatRs } from "@/lib/format";
import { formatDateLabel, formatTimeLabel } from "@/lib/date";
import type { Role } from "@/lib/supabase/database.types";

export type CategoryEntry = {
  id: string;
  amount: number;
  note: string | null;
  created_at: string;
  personName: string;
  personRole: Role | null;
};

export type CategoryBucket = {
  category: string;
  label: string;
  icon: LucideIcon;
  total: number;
  entries: CategoryEntry[];
};

export default function CategoryBreakdown({
  categories,
  max,
}: {
  categories: CategoryBucket[];
  max: number;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(category: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {categories.map((bucket) => {
        const Icon = bucket.icon;
        const pct = max > 0 ? Math.min(100, Math.round((bucket.total / max) * 100)) : 0;
        const isOpen = expanded.has(bucket.category);

        return (
          <div key={bucket.category}>
            <button
              type="button"
              onClick={() => toggle(bucket.category)}
              className="w-full text-left"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-stone-600">
                  <ChevronRight
                    className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`}
                    strokeWidth={2.5}
                  />
                  <Icon className="h-4 w-4" strokeWidth={2} />
                  {bucket.label}
                </span>
                <span className="font-semibold text-stone-800">{formatRs(bucket.total)}</span>
              </div>
              <div className="mt-1 h-2.5 w-full rounded-full bg-stone-100">
                <div className="h-2.5 rounded-full bg-stone-800" style={{ width: `${pct}%` }} />
              </div>
            </button>

            {isOpen && (
              <div className="mt-2 flex flex-col gap-1 rounded-2xl bg-stone-50 p-2">
                {bucket.entries.map((entry) => {
                  const personColor =
                    entry.personRole === "husband" ? "text-husband" : "text-wife";
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between border-b border-stone-100 px-2 py-2 text-xs last:border-0"
                    >
                      <div>
                        <p className="text-stone-500">
                          {formatDateLabel(entry.created_at)} · {formatTimeLabel(entry.created_at)}
                        </p>
                        <p className="text-stone-400">
                          <span className={personColor}>{entry.personName}</span>
                          {entry.note ? ` · ${entry.note}` : ""}
                        </p>
                      </div>
                      <span className="font-semibold text-stone-700">{formatRs(entry.amount)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
