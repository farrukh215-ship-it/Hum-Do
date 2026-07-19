import Link from "next/link";
import { formatRs } from "@/lib/format";
import type { Role } from "@/lib/supabase/database.types";

export default function PersonCard({
  label,
  role,
  income,
  expense,
  muted,
  href,
}: {
  label: string;
  role: Role;
  income: number;
  expense: number;
  muted?: boolean;
  href?: string;
}) {
  const bg = role === "husband" ? "bg-husband/10" : "bg-wife/10";
  const text = role === "husband" ? "text-husband" : "text-wife";
  const emoji = role === "husband" ? "👨" : "👩";
  const classes = `block rounded-3xl p-4 transition ${muted ? "bg-stone-100" : bg} ${
    href ? "active:scale-95" : ""
  }`;

  const content = (
    <>
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
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return <div className={classes}>{content}</div>;
}
