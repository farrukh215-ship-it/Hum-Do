import { formatRs } from "@/lib/format";
import type { Role } from "@/lib/supabase/database.types";

export default function PersonCard({
  label,
  role,
  income,
  expense,
  muted,
}: {
  label: string;
  role: Role;
  income: number;
  expense: number;
  muted?: boolean;
}) {
  const bg = role === "husband" ? "bg-husband/10" : "bg-wife/10";
  const text = role === "husband" ? "text-husband" : "text-wife";
  const emoji = role === "husband" ? "👨" : "👩";

  return (
    <div className={`rounded-3xl p-4 ${muted ? "bg-stone-100" : bg}`}>
      <div className="flex items-center gap-2">
        <span className="text-2xl">{emoji}</span>
        <span className={`text-sm font-bold ${muted ? "text-stone-400" : text}`}>{label}</span>
      </div>
      <div className="mt-3 space-y-1 text-xs text-stone-500">
        <p>
          Kamaya: <span className="font-semibold text-stone-700">{formatRs(income)}</span>
        </p>
        <p>
          Kharch kiya: <span className="font-semibold text-stone-700">{formatRs(expense)}</span>
        </p>
      </div>
    </div>
  );
}
