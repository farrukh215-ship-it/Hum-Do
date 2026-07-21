import Link from "next/link";
import { ArrowUp, ArrowDown, PiggyBank, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getMonthRange } from "@/lib/month";
import { formatMonthLabel } from "@/lib/date";
import { formatRs } from "@/lib/format";
import { getCategoryMeta } from "@/lib/categories";
import BarRow from "@/components/BarRow";
import Card from "@/components/Card";
import TransactionList, { type PersonMeta } from "@/components/TransactionList";

export default async function PersonPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { id } = await params;
  const { month } = await searchParams;
  const range = getMonthRange(month);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: monthTx }, { data: recentTx }] = await Promise.all([
    supabase.from("profiles").select("id, name, role").eq("id", id).maybeSingle(),
    supabase
      .from("transactions")
      .select("type, amount, category")
      .eq("user_id", id)
      .gte("created_at", range.startISO)
      .lt("created_at", range.endISO),
    supabase
      .from("transactions")
      .select("id, user_id, type, amount, category, note, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (!profile) {
    return (
      <div className="flex flex-col gap-4 pt-6">
        <Link href="/" className="text-sm text-stone-500">
          ← Wapis
        </Link>
        <p className="rounded-3xl bg-white p-4 text-center text-sm text-stone-400">
          Yeh profile nahi mili
        </p>
      </div>
    );
  }

  let income = 0;
  let expense = 0;
  const categoryTotals = new Map<string, number>();

  for (const tx of monthTx ?? []) {
    if (tx.type === "income") {
      income += tx.amount;
    } else {
      expense += tx.amount;
      categoryTotals.set(tx.category, (categoryTotals.get(tx.category) ?? 0) + tx.amount);
    }
  }

  const sortedCategories = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1]);
  const maxCategory = sortedCategories[0]?.[1] ?? 0;
  const roleColor = profile.role === "husband" ? "text-husband" : "text-wife";

  const profileById: Record<string, PersonMeta> = {
    [profile.id]: { name: profile.name, role: profile.role },
  };

  return (
    <div className="flex flex-col gap-5 pt-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-stone-500"
          aria-label="Wapis"
        >
          ←
        </Link>
        <h1 className="flex items-center gap-2 text-lg font-extrabold text-stone-800">
          <User className={`h-5 w-5 ${roleColor}`} strokeWidth={2} />
          {profile.name ?? "—"}
        </h1>
        <div className="h-9 w-9" />
      </div>

      <div className="flex items-center justify-between">
        <Link
          href={`/person/${id}?month=${range.prevParam}`}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-stone-500"
          aria-label="Pichla mahina"
        >
          ←
        </Link>
        <p className="text-sm font-semibold text-stone-500">{formatMonthLabel(range.startISO)}</p>
        {range.isCurrentMonth ? (
          <div className="h-9 w-9" />
        ) : (
          <Link
            href={`/person/${id}?month=${range.nextParam}`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-stone-500"
            aria-label="Agla mahina"
          >
            →
          </Link>
        )}
      </div>

      <Card className="flex flex-col gap-1 text-sm text-stone-500">
        <p className="flex items-center gap-1.5">
          <ArrowUp className="h-4 w-4 text-husband" strokeWidth={2} /> Kamaya:{" "}
          <span className="font-semibold text-stone-800">{formatRs(income)}</span>
        </p>
        <p className="flex items-center gap-1.5">
          <ArrowDown className="h-4 w-4 text-red-600" strokeWidth={2} /> Kharch kiya:{" "}
          <span className="font-semibold text-stone-800">{formatRs(expense)}</span>
        </p>
        <p className="flex items-center gap-1.5">
          <PiggyBank className="h-4 w-4 text-stone-400" strokeWidth={2} /> Bachat:{" "}
          <span className="font-semibold text-stone-800">{formatRs(income - expense)}</span>
        </p>
      </Card>

      <Card>
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
                icon={meta.icon}
                value={total}
                max={maxCategory}
                colorClass="bg-stone-800"
              />
            );
          })}
        </div>
      </Card>

      <TransactionList
        transactions={recentTx ?? []}
        profileById={profileById}
        currentUserId={user?.id}
      />
    </div>
  );
}
