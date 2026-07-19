"use client";

import { useState } from "react";
import { EXPENSE_CATEGORIES, type Category } from "@/lib/categories";
import { formatRs } from "@/lib/format";
import BarRow from "./BarRow";
import BudgetSheet from "./BudgetSheet";

export type BudgetRow = { category: string; monthly_limit: number };

export default function BudgetsSection({
  householdId,
  expenseTotals,
  budgets,
}: {
  householdId: string;
  expenseTotals: Record<string, number>;
  budgets: BudgetRow[];
}) {
  const [editing, setEditing] = useState<{ category: Category; limit: number | null } | null>(null);
  const budgetByCategory = new Map(budgets.map((b) => [b.category, b.monthly_limit]));

  return (
    <section className="rounded-3xl bg-white p-4">
      <h2 className="text-sm font-semibold text-stone-500">Budget (Mahine ki Limit)</h2>
      <div className="mt-3 flex flex-col gap-3">
        {EXPENSE_CATEGORIES.map((cat) => {
          const limit = budgetByCategory.get(cat.value) ?? null;
          const spent = expenseTotals[cat.value] ?? 0;
          const over = limit !== null && spent > limit;

          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => setEditing({ category: cat, limit })}
              className="text-left"
            >
              {limit !== null ? (
                <>
                  <BarRow
                    label={cat.label}
                    emoji={cat.emoji}
                    value={spent}
                    max={limit}
                    colorClass={over ? "bg-red-600" : "bg-husband"}
                  />
                  {over && (
                    <p className="mt-1 text-xs font-semibold text-red-600">
                      ⚠️ Limit se {formatRs(spent - limit)} zyada
                    </p>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-between rounded-2xl bg-stone-50 px-3 py-2 text-sm">
                  <span className="text-stone-500">
                    {cat.emoji} {cat.label}
                  </span>
                  <span className="font-semibold text-stone-400">Limit lagayein +</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <BudgetSheet
        open={!!editing}
        onClose={() => setEditing(null)}
        householdId={householdId}
        category={editing?.category ?? EXPENSE_CATEGORIES[0]}
        existingLimit={editing?.limit ?? null}
      />
    </section>
  );
}
