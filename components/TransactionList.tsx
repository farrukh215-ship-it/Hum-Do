"use client";

import { useState } from "react";
import { getCategoryMeta } from "@/lib/categories";
import { formatRs } from "@/lib/format";
import { formatDateLabel } from "@/lib/date";
import TransactionSheet from "./TransactionSheet";
import type { Role, TransactionType } from "@/lib/supabase/database.types";

export type TxRow = {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  category: string;
  note: string | null;
  created_at: string;
};

export type PersonMeta = { name: string | null; role: Role | null };

type DateGroup = { label: string; items: TxRow[] };

function groupByDate(transactions: TxRow[]): DateGroup[] {
  const groups: DateGroup[] = [];

  for (const tx of transactions) {
    const label = formatDateLabel(tx.created_at);
    const lastGroup = groups[groups.length - 1];

    if (lastGroup && lastGroup.label === label) {
      lastGroup.items.push(tx);
    } else {
      groups.push({ label, items: [tx] });
    }
  }

  return groups;
}

export default function TransactionList({
  transactions,
  profileById,
  currentUserId,
}: {
  transactions: TxRow[];
  profileById: Record<string, PersonMeta>;
  currentUserId?: string;
}) {
  const [editing, setEditing] = useState<TxRow | null>(null);
  const groups = groupByDate(transactions);

  return (
    <>
      <div className="flex flex-col gap-4">
        {transactions.length === 0 && (
          <p className="rounded-3xl bg-white p-4 text-center text-sm text-stone-400">
            Abhi tak koi entry nahi
          </p>
        )}
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-1 text-xs font-semibold text-stone-400">{group.label}</p>
            <div className="rounded-3xl bg-white p-2">
              {group.items.map((tx) => {
                const meta = getCategoryMeta(tx.category);
                const person = profileById[tx.user_id];
                const personColor = person?.role === "husband" ? "text-husband" : "text-wife";
                const isIncome = tx.type === "income";
                const isMine = tx.user_id === currentUserId;

                return (
                  <button
                    key={tx.id}
                    type="button"
                    disabled={!isMine}
                    onClick={() => isMine && setEditing(tx)}
                    className={`flex w-full items-center gap-3 border-b border-stone-100 px-3 py-3 text-left last:border-0 ${
                      isMine ? "active:bg-stone-50" : ""
                    }`}
                  >
                    <span className="text-2xl">{meta.emoji}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-stone-800">{meta.label}</p>
                      <p className="text-xs text-stone-400">
                        <span className={personColor}>{person?.name ?? "—"}</span>
                        {tx.note ? ` · ${tx.note}` : ""}
                      </p>
                    </div>
                    <p className={`text-sm font-bold ${isIncome ? "text-husband" : "text-red-600"}`}>
                      {isIncome ? "+" : "−"}
                      {formatRs(tx.amount)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <TransactionSheet
        open={!!editing}
        onClose={() => setEditing(null)}
        editing={
          editing
            ? {
                id: editing.id,
                type: editing.type,
                amount: editing.amount,
                category: editing.category,
                note: editing.note,
                created_at: editing.created_at,
              }
            : null
        }
      />
    </>
  );
}
