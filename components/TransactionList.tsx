"use client";

import { useState } from "react";
import { getCategoryMeta } from "@/lib/categories";
import { formatRs } from "@/lib/format";
import { formatDateLabel, formatTimeLabel } from "@/lib/date";
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

function groupNet(items: TxRow[]): number {
  let net = 0;
  for (const tx of items) {
    net += tx.type === "income" ? tx.amount : -tx.amount;
  }
  return net;
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
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const groups = groupByDate(transactions);

  function toggle(index: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {transactions.length === 0 && (
          <p className="rounded-3xl bg-white p-4 text-center text-sm text-stone-400">
            Abhi tak koi entry nahi
          </p>
        )}
        {groups.map((group, index) => {
          const isToday = group.label === "Aaj";
          const isOpen = isToday || expanded.has(index);
          const net = groupNet(group.items);

          return (
            <div key={`${group.label}-${index}`}>
              {isToday ? (
                <p className="mb-2 px-1 text-xs font-semibold text-stone-400">{group.label}</p>
              ) : (
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  className="mb-2 flex w-full items-center justify-between px-1 text-left"
                >
                  <span className="flex items-center gap-1 text-xs font-semibold text-stone-400">
                    <span className={`transition-transform ${isOpen ? "rotate-90" : ""}`}>›</span>
                    {group.label}
                  </span>
                  <span className={`text-xs font-bold ${net >= 0 ? "text-husband" : "text-red-600"}`}>
                    {net >= 0 ? "+" : "−"}
                    {formatRs(Math.abs(net))}
                  </span>
                </button>
              )}
              {isOpen && (
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
                        <div className="text-right">
                          <p className={`text-sm font-bold ${isIncome ? "text-husband" : "text-red-600"}`}>
                            {isIncome ? "+" : "−"}
                            {formatRs(tx.amount)}
                          </p>
                          <p className="text-[10px] text-stone-300">{formatTimeLabel(tx.created_at)}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
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
