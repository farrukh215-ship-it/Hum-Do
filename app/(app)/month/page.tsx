import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMonthRange } from "@/lib/month";
import { formatMonthLabel } from "@/lib/date";
import { getCategoryMeta } from "@/lib/categories";
import BarRow from "@/components/BarRow";

export default async function MonthPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const range = getMonthRange(month);

  const supabase = await createClient();

  const [{ data: profiles }, { data: monthTx }] = await Promise.all([
    supabase.from("profiles").select("id, role"),
    supabase
      .from("transactions")
      .select("user_id, type, amount, category")
      .gte("created_at", range.startISO)
      .lt("created_at", range.endISO),
  ]);

  const roleByUser = new Map((profiles ?? []).map((p) => [p.id, p.role]));

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

  return (
    <div className="flex flex-col gap-5 pt-6">
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
            <p className="text-sm text-stone-400">Is mahine koi kharcha nahi hua</p>
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
    </div>
  );
}
