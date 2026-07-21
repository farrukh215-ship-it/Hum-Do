import Link from "next/link";
import { PiggyBank, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getMonthRange, getCustomDateRange } from "@/lib/month";
import { formatMonthLabel, formatShortDate, dateInputValue, dateInputToISO } from "@/lib/date";
import { formatRs } from "@/lib/format";
import { getCategoryMeta } from "@/lib/categories";
import BarRow from "@/components/BarRow";
import BudgetsSection from "@/components/BudgetsSection";
import MonthPicker from "@/components/MonthPicker";
import Card from "@/components/Card";
import Confetti from "@/components/Confetti";

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
  const prevRange = customRange ? null : getMonthRange(range.prevParam);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profiles }, { data: monthTx }, { data: budgetsData }, { data: prevTx }] =
    await Promise.all([
      supabase.from("profiles").select("id, role, household_id"),
      supabase
        .from("transactions")
        .select("user_id, type, amount, category")
        .gte("created_at", startISO)
        .lt("created_at", endISO),
      supabase.from("budgets").select("category, monthly_limit"),
      prevRange
        ? supabase
            .from("transactions")
            .select("type, amount, category")
            .gte("created_at", prevRange.startISO)
            .lt("created_at", prevRange.endISO)
        : Promise.resolve({ data: [] as { type: string; amount: number; category: string }[] }),
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

  let prevExpense = 0;
  const prevCategoryTotals = new Map<string, number>();
  for (const tx of prevTx ?? []) {
    if (tx.type !== "income") {
      prevExpense += tx.amount;
      prevCategoryTotals.set(tx.category, (prevCategoryTotals.get(tx.category) ?? 0) + tx.amount);
    }
  }

  const totalIncome = husbandIncome + wifeIncome;
  const totalExpense = husbandExpense + wifeExpense;
  const savings = totalIncome - totalExpense;
  const expenseChangePct =
    prevRange && prevExpense > 0 ? Math.round(((totalExpense - prevExpense) / prevExpense) * 100) : null;

  const sortedCategories = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1]);
  const maxCategory = sortedCategories[0]?.[1] ?? 0;
  const maxIncome = Math.max(husbandIncome, wifeIncome, 1);
  const maxExpense = Math.max(husbandExpense, wifeExpense, 1);
  const expenseTotalsRecord = Object.fromEntries(categoryTotals);

  const topCategory = sortedCategories[0];
  let insight: string | null = null;
  if (topCategory && totalExpense > 0) {
    const [catValue, catTotal] = topCategory;
    const catMeta = getCategoryMeta(catValue);
    const pct = Math.round((catTotal / totalExpense) * 100);
    let text = `${catMeta.label} pe ${pct}% kharcha hua`;
    if (prevRange) {
      const prevAmt = prevCategoryTotals.get(catValue) ?? 0;
      const diff = catTotal - prevAmt;
      if (diff !== 0) {
        text += ` — pichle mahine se ${formatRs(Math.abs(diff))} ${diff > 0 ? "zyada" : "kam"}`;
      }
    }
    insight = text;
  }

  const isCompletedMonth = !customRange && !range.isCurrentMonth;

  const nearLimitCategories = (budgetsData ?? [])
    .map((b) => {
      const spent = expenseTotalsRecord[b.category] ?? 0;
      const ratio = b.monthly_limit > 0 ? spent / b.monthly_limit : 0;
      return { ...b, spent, ratio };
    })
    .filter((b) => b.ratio >= 0.9)
    .sort((a, b) => b.ratio - a.ratio);

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

      {!customRange && <MonthPicker currentParam={range.param} />}

      {insight && <p className="px-1 text-sm text-stone-500">{insight}</p>}

      {isCompletedMonth && savings > 0 && (
        <div className="relative overflow-hidden rounded-3xl border border-husband/20 bg-husband/5 p-4 text-center shadow-sm">
          <Confetti />
          <p className="text-sm font-semibold text-husband">🎉 Bachat Report</p>
          <p className="mt-1 text-sm text-stone-600">
            Is mahine <span className="font-bold text-stone-800">{formatRs(savings)}</span> bachat
            hui — shabash!
          </p>
        </div>
      )}

      {nearLimitCategories.length > 0 && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-sm font-semibold text-amber-700">⚠️ Hadd ke qareeb</p>
          <div className="mt-2 flex flex-col gap-1">
            {nearLimitCategories.map((b) => {
              const meta = getCategoryMeta(b.category);
              const pct = Math.round(b.ratio * 100);
              return (
                <p key={b.category} className="text-xs text-amber-700">
                  {meta.label} ki hadd {pct}% ho chuki hai
                </p>
              );
            })}
          </div>
        </div>
      )}

      <form action="/month" className="flex items-end gap-2 rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
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

      <Card>
        <h2 className="text-sm font-semibold text-stone-500">Kamai</h2>
        {totalIncome === 0 ? (
          <div className="mt-3 flex flex-col items-center gap-2 py-4 text-center">
            <PiggyBank className="h-8 w-8 text-stone-300" strokeWidth={1.5} />
            <p className="text-sm text-stone-400">
              Abhi tak koi kamai nahi — neeche + button se pehli entry add karein
            </p>
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            <BarRow label="Husband" icon={User} value={husbandIncome} max={maxIncome} colorClass="bg-husband" />
            <BarRow label="Biwi" icon={User} value={wifeIncome} max={maxIncome} colorClass="bg-wife" />
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-500">Kharcha</h2>
          {expenseChangePct !== null && (
            <span
              className={`text-xs font-bold ${expenseChangePct > 0 ? "text-red-600" : "text-husband"}`}
            >
              {expenseChangePct > 0 ? "▲" : "▼"} {Math.abs(expenseChangePct)}% pichle mahine se
            </span>
          )}
        </div>
        <div className="mt-3 flex flex-col gap-3">
          <BarRow label="Husband" icon={User} value={husbandExpense} max={maxExpense} colorClass="bg-husband" />
          <BarRow label="Biwi" icon={User} value={wifeExpense} max={maxExpense} colorClass="bg-wife" />
        </div>
      </Card>

      <Card>
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
                icon={meta.icon}
                value={total}
                max={maxCategory}
                colorClass="bg-stone-800"
              />
            );
          })}
        </div>
      </Card>

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
