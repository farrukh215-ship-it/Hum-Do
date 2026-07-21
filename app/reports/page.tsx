import Link from "next/link";
import { Film } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatMonthLabel } from "@/lib/date";
import { formatRs } from "@/lib/format";
import type { MonthlyReportJson } from "@/lib/reports";

export default async function ReportsHistoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const { data: reports } = profile?.household_id
    ? await supabase
        .from("monthly_reports")
        .select("month, report_json")
        .eq("household_id", profile.household_id)
        .order("month", { ascending: false })
    : { data: null };

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
        <h1 className="text-lg font-extrabold text-stone-800">Mahine ka Sach — Sab Reports</h1>
      </div>

      {(!reports || reports.length === 0) && (
        <div className="rounded-3xl border border-black/5 bg-white p-4 text-center text-sm text-stone-400 shadow-sm">
          Abhi tak koi report nahi bana
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {(reports ?? []).map((row) => {
          const report = row.report_json as unknown as MonthlyReportJson;
          const monthParam = row.month.slice(0, 7);
          return (
            <Link
              key={row.month}
              href={`/report/${monthParam}`}
              className="rounded-3xl border border-black/5 bg-[#124D30] p-4 text-[#FDF7EA] shadow-sm transition active:scale-95"
            >
              <Film className="h-5 w-5 text-[#D8A548]" strokeWidth={2} />
              <p className="mt-2 text-sm font-semibold">{formatMonthLabel(row.month)}</p>
              <p className="mt-1 text-lg font-extrabold text-[#D8A548]">
                {formatRs(report.savings.amount)}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
