"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/categories";
import { dateInputToISO, dateInputValue } from "@/lib/date";
import Confetti from "./Confetti";
import type { TransactionType } from "@/lib/supabase/database.types";

export type EditableTransaction = {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  note: string | null;
  created_at: string;
};

const QUICK_AMOUNTS = [100, 500, 1000];

export default function TransactionSheet({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing?: EditableTransaction | null;
}) {
  const router = useRouter();
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => dateInputValue(new Date().toISOString()));
  const [recurring, setRecurring] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setJustSaved(false);

    if (editing) {
      setType(editing.type);
      setAmount(String(editing.amount));
      setCategory(editing.category);
      setNote(editing.note ?? "");
      setDate(dateInputValue(editing.created_at));
      setRecurring(false);
    } else {
      const lastCategory = localStorage.getItem("lastCategory:expense");
      setType("expense");
      setAmount("");
      setCategory(lastCategory);
      setNote("");
      setDate(dateInputValue(new Date().toISOString()));
      setRecurring(false);
    }
    setError(null);
  }, [open, editing]);

  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  function selectType(next: TransactionType) {
    setType(next);
    setCategory(localStorage.getItem(`lastCategory:${next}`));
  }

  function handleClose() {
    setError(null);
    onClose();
  }

  function celebrateAndClose() {
    if (navigator.vibrate) navigator.vibrate(15);
    setJustSaved(true);
    setTimeout(() => {
      handleClose();
      router.refresh();
    }, 650);
  }

  async function handleSave() {
    const amountNumber = Number(amount);
    if (!amountNumber || amountNumber <= 0) {
      setError("Amount likhein");
      return;
    }
    if (!category) {
      setError("Category chunein");
      return;
    }

    setSaving(true);
    setError(null);

    const supabase = createClient();

    if (editing) {
      // Only override created_at if the date was actually changed — otherwise
      // keep the original real time-of-day instead of snapping it to noon.
      const dateChanged = date !== dateInputValue(editing.created_at);

      const { error: updateError } = await supabase
        .from("transactions")
        .update({
          type,
          amount: amountNumber,
          category,
          note: note.trim() || null,
          ...(dateChanged ? { created_at: dateInputToISO(date) } : {}),
        })
        .eq("id", editing.id);

      setSaving(false);
      if (updateError) {
        setError(updateError.message);
        return;
      }
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setSaving(false);
        setError("Dobara login karein");
        return;
      }

      // Only set created_at if the date was moved off today — a fresh entry
      // left on today's date keeps its real current time-of-day (DB default).
      const dateChanged = date !== dateInputValue(new Date().toISOString());
      const todayValue = dateInputValue(new Date().toISOString());

      const { error: insertError } = await supabase.from("transactions").insert({
        user_id: user.id,
        type,
        amount: amountNumber,
        category,
        note: note.trim() || null,
        ...(dateChanged ? { created_at: dateInputToISO(date) } : {}),
      });

      setSaving(false);
      if (insertError) {
        setError(insertError.message);
        return;
      }

      localStorage.setItem(`lastCategory:${type}`, category);

      if (recurring) {
        const [, monthStr, dayStr] = todayValue.split("-");
        await supabase.from("recurring_transactions").insert({
          user_id: user.id,
          type,
          amount: amountNumber,
          category,
          note: note.trim() || null,
          day_of_month: Number(dayStr),
          last_applied_month: `${todayValue.slice(0, 4)}-${monthStr}`,
        });
      }
    }

    celebrateAndClose();
  }

  async function handleDelete() {
    if (!editing) return;

    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: deleteError } = await supabase.from("transactions").delete().eq("id", editing.id);

    setSaving(false);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    handleClose();
    router.refresh();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="relative max-h-[85vh] w-full max-w-[430px] overflow-y-auto rounded-t-3xl bg-background p-5 pb-8">
        {justSaved && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-t-3xl bg-background">
            <Confetti />
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-husband text-white">
              <Check className="h-9 w-9" strokeWidth={3} />
            </div>
            <p className="text-sm font-semibold text-stone-600">
              {editing ? "Update ho gaya" : "Save ho gaya"}
            </p>
          </div>
        )}

        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-stone-300" />

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => selectType("income")}
            className={`flex items-center justify-center gap-1.5 rounded-3xl p-3 text-sm font-semibold transition ${
              type === "income" ? "bg-husband text-white" : "bg-husband/10 text-husband"
            }`}
          >
            <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
            Paisa Aaya
          </button>
          <button
            type="button"
            onClick={() => selectType("expense")}
            className={`flex items-center justify-center gap-1.5 rounded-3xl p-3 text-sm font-semibold transition ${
              type === "expense" ? "bg-wife text-white" : "bg-wife/10 text-wife"
            }`}
          >
            <ArrowDown className="h-4 w-4" strokeWidth={2.5} />
            Paisa Gaya
          </button>
        </div>

        <div className="mt-4 flex items-center rounded-3xl border border-stone-200 bg-white px-4 py-3">
          <span className="text-lg font-bold text-stone-400">Rs</span>
          <input
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="0"
            autoFocus
            className="ml-2 w-full bg-transparent text-2xl font-extrabold text-stone-800 outline-none"
          />
        </div>

        <div className="mt-2 flex gap-2">
          {QUICK_AMOUNTS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setAmount(String(value))}
              className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-600 transition active:scale-95"
            >
              Rs {value.toLocaleString("en-US")}
            </button>
          ))}
        </div>

        <input
          type="date"
          value={date}
          max={dateInputValue(new Date().toISOString())}
          onChange={(e) => setDate(e.target.value)}
          className="mt-4 w-full rounded-3xl border border-stone-200 bg-white px-4 py-3 text-center text-sm text-stone-800 outline-none focus:border-stone-400"
        />

        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition ${
                  category === c.value ? "bg-stone-800 text-white" : "bg-stone-100 text-stone-600"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
                {c.label}
              </button>
            );
          })}
        </div>

        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional)"
          className="mt-4 w-full rounded-3xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
        />

        {!editing && (
          <label className="mt-4 flex items-center gap-2 rounded-3xl bg-stone-100 px-4 py-3 text-sm text-stone-600">
            <input
              type="checkbox"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
              className="h-4 w-4 accent-stone-800"
            />
            Har mahine repeat karo
          </label>
        )}

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex gap-3">
          {editing ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="flex-1 rounded-3xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition active:scale-95 disabled:opacity-50"
            >
              Delete karo
            </button>
          ) : (
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-3xl bg-stone-100 px-4 py-3 text-sm font-semibold text-stone-500"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-3xl bg-stone-800 px-4 py-3 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-50"
          >
            {saving ? "Save ho raha hai..." : editing ? "Update karo ✓" : "Save karo ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}
