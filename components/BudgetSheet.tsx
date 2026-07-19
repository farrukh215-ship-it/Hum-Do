"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/lib/categories";

export default function BudgetSheet({
  open,
  onClose,
  householdId,
  category,
  existingLimit,
}: {
  open: boolean;
  onClose: () => void;
  householdId: string;
  category: Category;
  existingLimit: number | null;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setAmount(existingLimit ? String(existingLimit) : "");
    setError(null);
  }, [open, existingLimit]);

  async function handleSave() {
    const value = Number(amount);
    if (!value || value <= 0) {
      setError("Limit likhein");
      return;
    }

    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: upsertError } = await supabase
      .from("budgets")
      .upsert(
        { household_id: householdId, category: category.value, monthly_limit: value },
        { onConflict: "household_id,category" },
      );

    setSaving(false);

    if (upsertError) {
      setError(upsertError.message);
      return;
    }

    onClose();
    router.refresh();
  }

  async function handleRemove() {
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("budgets")
      .delete()
      .eq("household_id", householdId)
      .eq("category", category.value);

    setSaving(false);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    onClose();
    router.refresh();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="max-h-[85vh] w-full max-w-[430px] overflow-y-auto rounded-t-3xl bg-background p-5 pb-8">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-stone-300" />

        <p className="text-center text-sm font-semibold text-stone-500">
          {category.emoji} {category.label} ki mahine ki limit
        </p>

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

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex gap-3">
          {existingLimit !== null ? (
            <button
              type="button"
              onClick={handleRemove}
              disabled={saving}
              className="flex-1 rounded-3xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition active:scale-95 disabled:opacity-50"
            >
              Hata dein
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
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
            {saving ? "Save ho raha hai..." : "Save karo ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}
