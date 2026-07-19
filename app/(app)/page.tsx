import { createClient } from "@/lib/supabase/server";
import { getMonthStartISO } from "@/lib/month";
import { formatRs } from "@/lib/format";
import { getCategoryMeta } from "@/lib/categories";
import PersonCard from "@/components/PersonCard";
import type { Role } from "@/lib/supabase/database.types";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const monthStart = getMonthStartISO();

  const [{ data: profiles }, { data: monthTx }, { data: recentTx }] = await Promise.all([
    supabase.from("profiles").select("id, name, role"),
    supabase.from("transactions").select("user_id, type, amount").gte("created_at", monthStart),
    supabase
      .from("transactions")
      .select("id, user_id, type, amount, category, note, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const self = user ? profileById.get(user.id) : undefined;
  const other = (profiles ?? []).find((p) => p.id !== user?.id);

  let totalIncome = 0;
  let totalExpense = 0;
  let selfIncome = 0;
  let selfExpense = 0;
  let otherIncome = 0;
  let otherExpense = 0;

  for (const tx of monthTx ?? []) {
    if (tx.type === "income") {
      totalIncome += tx.amount;
      if (tx.user_id === user?.id) selfIncome += tx.amount;
      else if (tx.user_id === other?.id) otherIncome += tx.amount;
    } else {
      totalExpense += tx.amount;
      if (tx.user_id === user?.id) selfExpense += tx.amount;
      else if (tx.user_id === other?.id) otherExpense += tx.amount;
    }
  }

  const savings = totalIncome - totalExpense;
  const selfRole: Role = self?.role ?? "husband";
  const otherRole: Role = other?.role ?? (selfRole === "husband" ? "wife" : "husband");
  const otherLabel = other ? (otherRole === "husband" ? "Husband" : "Biwi") : "Abhi shamil nahi";

  return (
    <div className="flex flex-col gap-5 pt-6">
      <div className="rounded-3xl bg-husband p-5 text-white">
        <p className="text-sm opacity-90">Is mahine ki bachat</p>
        <p className="mt-1 text-3xl font-extrabold">{formatRs(savings)}</p>
        <div className="mt-3 flex justify-between text-sm opacity-90">
          <span>⬆️ Aaya: {formatRs(totalIncome)}</span>
          <span>⬇️ Gaya: {formatRs(totalExpense)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <PersonCard label="Aap" role={selfRole} income={selfIncome} expense={selfExpense} />
        <PersonCard
          label={otherLabel}
          role={otherRole}
          income={otherIncome}
          expense={otherExpense}
          muted={!other}
        />
      </div>

      <div className="rounded-3xl bg-white p-2">
        {(recentTx ?? []).length === 0 && (
          <p className="p-4 text-center text-sm text-stone-400">Abhi tak koi entry nahi</p>
        )}
        {(recentTx ?? []).map((tx) => {
          const meta = getCategoryMeta(tx.category);
          const person = profileById.get(tx.user_id);
          const personColor = person?.role === "husband" ? "text-husband" : "text-wife";
          const isIncome = tx.type === "income";

          return (
            <div
              key={tx.id}
              className="flex items-center gap-3 border-b border-stone-100 px-3 py-3 last:border-0"
            >
              <span className="text-2xl">{meta.emoji}</span>
              <div className="flex-1 text-left">
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
