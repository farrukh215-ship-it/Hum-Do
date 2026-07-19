import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMonthRange, getCustomDateRange } from "@/lib/month";
import { formatMonthLabel, formatShortDate, dateInputValue, dateInputToISO } from "@/lib/date";
import { getCategoryMeta } from "@/lib/categories";
import BarRow from "@/components/BarRow";
import BudgetsSection from "@/components/BudgetsSection";

export default async function MonthPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; from?: string; to?: string }>;
}) {
  const { month, from, to } = await searchParams;
  const range = getMonthRange(month);
  const customRange = getCustomDateRange(from, to);

  const startISO = customRange?.startISO ?? range.startISO;
  const endISO = customRange?.endISO ?? range.endISO;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profiles }, { data: monthTx }, { data: budgetsData }] = await Promise.all([
    supabase.from("profiles").select("id, role, household_id"),
    supabase
      .from("transactions")
      .select("user_id, type, amount, category")
      .gte("created_at", startISO)
      .lt("created_at", endISO),
    supabase.from("budgets").select("category, monthly_limit"),
  ]);

  const roleByUser = new Map((profiles ?? []).map((p) => [p.id, p.role]));
  const selfHouseholdId = profiles?.find((p) => p.id === user?.id)?.household_id ?? null;

  let husbandIncome = 0;
  let wifeIncome = 0;
  let husbandExpense = 0;
  let wifeExpense = 0;
  const categoryTotals = new Map<string, number>();

  for (const tx of monthTx ?? []) {
    const role = roleByUser.get(tx.user_id);
    if (tx.type === "income") {
      if (role === "husband") husbandIncome += tx.amount;
      else if (role === "wife") wifeIncome += tx.amount;
    } else {
      if (role === "husband") husbandExpense += tx.amount;
      else if (role === "wife") wifeExpense += tx.amount;
      categoryTotals.set(tx.category, (categoryTotals.get(tx.category) ?? 0) + tx.amount);
    }
  }

  const sortedCategories = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1]);
  const maxCategory = sortedCategories[0]?.[1] ?? 0;
  const maxIncome = Math.max(husbandIncome, wifeIncome, 1);
  const maxExpense = Math.max(husbandExpense, wifeExpense, 1);
  const expenseTotalsRecord = Object.fromEntries(categoryTotals);

  const fromDefault = customRange ? (from as string) : dateInputValue(range.startISO);
  const toDefault = customRange ? (to as string) : dateInputValue(new Date().toISOString());

  return (
    <div className="flex flex-col gap-5 pt-6">
      {customRange ? (
        <div className="flex items-center justify-between">
          <Link
            href="/month"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-stone-500"
            aria-label="Is mahine"
          >
            ✕
          </Link>
          <h1 className="text-base font-extrabold text-stone-800">
            {formatShortDate(dateInputToISO(from!))} – {formatShortDate(dateInputToISO(to!))}
          </h1>
          <div className="h-9 w-9" />
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <Link
            href={`/month?month=${range.prevParam}`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-stone-500"
            aria-label="Pichla mahina"
          >
            ←
          </Link>
          <h1 className="text-lg font-extrabold text-stone-800">{formatMonthLabel(range.startISO)}</h1>
          {range.isCurrentMonth ? (
            <div className="h-9 w-9" />
          ) : (
            <Link
              href={`/month?month=${range.nextParam}`}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-stone-500"
              aria-label="Agla mahina"
            >
              →
            </Link>
          )}
        </div>
      )}

      <form action="/month" className="flex items-end gap-2 rounded-3xl bg-white p-4">
        <div className="flex-1">
          <label className="text-xs text-stone-400">Se</label>
          <input
            type="date"
            name="from"
            defaultValue={fromDefault}
            max={dateInputValue(new Date().toISOString())}
            className="mt-1 w-full rounded-2xl border border-stone-200 px-2 py-2 text-sm text-stone-800 outline-none focus:border-stone-400"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-stone-400">Tak</label>
          <input
            type="date"
            name="to"
            defaultValue={toDefault}
            max={dateInputValue(new Date().toISOString())}
            className="mt-1 w-full rounded-2xl border border-stone-200 px-2 py-2 text-sm text-stone-800 outline-none focus:border-stone-400"
          />
        </div>
        <button
          type="submit"
          className="rounded-2xl bg-stone-800 px-4 py-2.5 text-sm font-semibold text-white transition active:scale-95"
        >
          Dekhein
        </button>
      </form>

      <section className="rounded-3xl bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-500">Kamai</h2>
        <div className="mt-3 flex flex-col gap-3">
          <BarRow label="Husband" emoji="👨" value={husbandIncome} max={maxIncome} colorClass="bg-husband" />
          <BarRow label="Biwi" emoji="👩" value={wifeIncome} max={maxIncome} colorClass="bg-wife" />
        </div>
      </section>

      <section className="rounded-3xl bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-500">Kharcha</h2>
        <div className="mt-3 flex flex-col gap-3">
          <BarRow label="Husband" emoji="👨" value={husbandExpense} max={maxExpense} colorClass="bg-husband" />
          <BarRow label="Biwi" emoji="👩" value={wifeExpense} max={maxExpense} colorClass="bg-wife" />
        </div>
      </section>

      <section className="rounded-3xl bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-500">Paisa kahan gaya?</h2>
        <div className="mt-3 flex flex-col gap-3">
          {sortedCategories.length === 0 && (
            <p className="text-sm text-stone-400">Is arse mein koi kharcha nahi hua</p>
          )}
          {sortedCategories.map(([category, total]) => {
            const meta = getCategoryMeta(category);
            return (
              <BarRow
                key={category}
                label={meta.label}
                emoji={meta.emoji}
                value={total}
                max={maxCategory}
                colorClass="bg-stone-800"
              />
            );
          })}
        </div>
      </section>

      {!customRange && selfHouseholdId && (
        <BudgetsSection
          householdId={selfHouseholdId}
          expenseTotals={expenseTotalsRecord}
          budgets={budgetsData ?? []}
        />
      )}
    </div>
  );
}
