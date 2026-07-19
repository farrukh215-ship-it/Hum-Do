import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMonthStartISO } from "@/lib/month";
import { formatRs } from "@/lib/format";
import PersonCard from "@/components/PersonCard";
import TransactionList, { type PersonMeta } from "@/components/TransactionList";
import type { Role } from "@/lib/supabase/database.types";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const monthStart = getMonthStartISO();

  const [{ data: profiles }, { data: monthTx }, { data: recentTx }] = await Promise.all([
    supabase.from("profiles").select("id, name, role, household_id"),
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

  let inviteCode: string | null = null;
  if (!other && self?.household_id) {
    const { data: household } = await supabase
      .from("households")
      .select("invite_code")
      .eq("id", self.household_id)
      .maybeSingle();
    inviteCode = household?.invite_code ?? null;
  }

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

  const profileByIdRecord: Record<string, PersonMeta> = {};
  for (const p of profiles ?? []) {
    profileByIdRecord[p.id] = { name: p.name, role: p.role };
  }

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
        <PersonCard
          label="Aap"
          role={selfRole}
          income={selfIncome}
          expense={selfExpense}
          href={user ? `/person/${user.id}` : undefined}
        />
        <PersonCard
          label={otherLabel}
          role={otherRole}
          income={otherIncome}
          expense={otherExpense}
          muted={!other}
          href={other ? `/person/${other.id}` : undefined}
        />
      </div>

      {!other && inviteCode && (
        <div className="rounded-3xl bg-stone-100 p-4 text-center text-sm text-stone-600">
          Partner abhi shamil nahi hue. Ghar ka code bhejein:{" "}
          <span className="font-bold tracking-widest text-stone-800">{inviteCode}</span>
        </div>
      )}

      <TransactionList
        transactions={recentTx ?? []}
        profileById={profileByIdRecord}
        currentUserId={user?.id}
      />

      <Link
        href="/history"
        className="rounded-3xl bg-white py-3 text-center text-sm font-semibold text-stone-500"
      >
        Poori history dekhein →
      </Link>
    </div>
  );
}
