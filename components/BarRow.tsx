import { formatRs } from "@/lib/format";

export default function BarRow({
  label,
  emoji,
  value,
  max,
  colorClass,
}: {
  label: string;
  emoji: string;
  value: number;
  max: number;
  colorClass: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-stone-600">
          {emoji} {label}
        </span>
        <span className="font-semibold text-stone-800">{formatRs(value)}</span>
      </div>
      <div className="mt-1 h-2.5 w-full rounded-full bg-stone-100">
        <div className={`h-2.5 rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
