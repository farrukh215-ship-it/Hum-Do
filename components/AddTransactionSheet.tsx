"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/categories";
import type { TransactionType } from "@/lib/supabase/database.types";

export default function AddTransactionSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  function selectType(next: TransactionType) {
    setType(next);
    setCategory(null);
  }

  function handleClose() {
    setAmount("");
    setCategory(null);
    setNote("");
    setType("expense");
    setError(null);
    onClose();
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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      setError("Dobara login karein");
      return;
    }

    const { error: insertError } = await supabase.from("transactions").insert({
      user_id: user.id,
      type,
      amount: amountNumber,
      category,
      note: note.trim() || null,
    });

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    handleClose();
    router.refresh();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="max-h-[85vh] w-full max-w-[430px] overflow-y-auto rounded-t-3xl bg-background p-5 pb-8">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-stone-300" />

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => selectType("income")}
            className={`rounded-3xl p-3 text-sm font-semibold transition ${
              type === "income" ? "bg-husband text-white" : "bg-husband/10 text-husband"
            }`}
          >
            ⬆️ Paisa Aaya
          </button>
          <button
            type="button"
            onClick={() => selectType("expense")}
            className={`rounded-3xl p-3 text-sm font-semibold transition ${
              type === "expense" ? "bg-wife text-white" : "bg-wife/10 text-wife"
            }`}
          >
            ⬇️ Paisa Gaya
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

        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                category === c.value ? "bg-stone-800 text-white" : "bg-stone-100 text-stone-600"
              }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional)"
          className="mt-4 w-full rounded-3xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
        />

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 rounded-3xl bg-stone-100 px-4 py-3 text-sm font-semibold text-stone-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-3xl bg-stone-800 px-4 py-3 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-50"
          >
            {saving ? "Save ho raha hai..." : "Save karo ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}
