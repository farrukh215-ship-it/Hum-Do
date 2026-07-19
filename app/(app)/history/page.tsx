import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TransactionList, { type PersonMeta } from "@/components/TransactionList";

type Who = "all" | "self" | "other";
type Kind = "all" | "income" | "expense";

function buildHref(who: Who, kind: Kind) {
  const params = new URLSearchParams();
  if (who !== "all") params.set("who", who);
  if (kind !== "all") params.set("type", kind);
  const qs = params.toString();
  return qs ? `/history?${qs}` : "/history";
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ who?: string; type?: string }>;
}) {
  const params = await searchParams;
  const who: Who = params.who === "self" || params.who === "other" ? params.who : "all";
  const kind: Kind = params.type === "income" || params.type === "expense" ? params.type : "all";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profiles } = await supabase.from("profiles").select("id, name, role");
  const other = (profiles ?? []).find((p) => p.id !== user?.id);

  let query = supabase
    .from("transactions")
    .select("id, user_id, type, amount, category, note, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (kind !== "all") query = query.eq("type", kind);
  if (who === "self" && user) query = query.eq("user_id", user.id);
  if (who === "other" && other) query = query.eq("user_id", other.id);

  const { data: transactions } = await query;

  const profileById: Record<string, PersonMeta> = {};
  for (const p of profiles ?? []) {
    profileById[p.id] = { name: p.name, role: p.role };
  }

  return (
    <div className="flex flex-col gap-4 pt-6">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-stone-500"
          aria-label="Wapis"
        >
          ←
        </Link>
        <h1 className="text-lg font-extrabold text-stone-800">Poori History</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "Sab"],
            ["self", "Aap"],
            ["other", "Partner"],
          ] as [Who, string][]
        ).map(([value, label]) => (
          <Link
            key={value}
            href={buildHref(value, kind)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              who === value ? "bg-stone-800 text-white" : "bg-white text-stone-500"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "Sab"],
            ["income", "⬆️ Aaya"],
            ["expense", "⬇️ Gaya"],
          ] as [Kind, string][]
        ).map(([value, label]) => (
          <Link
            key={value}
            href={buildHref(who, value)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              kind === value ? "bg-stone-800 text-white" : "bg-white text-stone-500"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <TransactionList
        transactions={transactions ?? []}
        profileById={profileById}
        currentUserId={user?.id}
      />
    </div>
  );
}
