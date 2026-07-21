"use client";

import { useState } from "react";
import { Repeat } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getCategoryMeta } from "@/lib/categories";
import { formatRs } from "@/lib/format";
import Card from "./Card";

export type RecurringRule = {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  note: string | null;
};

export default function RecurringList({ rules }: { rules: RecurringRule[] }) {
  const router = useRouter();
  const [removingId, setRemovingId] = useState<string | null>(null);

  if (rules.length === 0) return null;

  async function stop(id: string) {
    setRemovingId(id);
    const supabase = createClient();
    await supabase.from("recurring_transactions").delete().eq("id", id);
    setRemovingId(null);
    router.refresh();
  }

  return (
    <Card>
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-stone-500">
        <Repeat className="h-4 w-4" strokeWidth={2} />
        Recurring
      </h2>
      <div className="mt-3 flex flex-col gap-2">
        {rules.map((rule) => {
          const meta = getCategoryMeta(rule.category);
          const Icon = meta.icon;
          return (
            <div key={rule.id} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-stone-600">
                <Icon className="h-4 w-4" strokeWidth={2} />
                {meta.label}
                {rule.note ? ` · ${rule.note}` : ""}
              </span>
              <div className="flex items-center gap-2">
                <span className={rule.type === "income" ? "text-husband" : "text-red-600"}>
                  {rule.type === "income" ? "+" : "−"}
                  {formatRs(rule.amount)}
                </span>
                <button
                  type="button"
                  onClick={() => stop(rule.id)}
                  disabled={removingId === rule.id}
                  className="text-xs font-semibold text-stone-400 underline disabled:opacity-50"
                >
                  band karo
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
