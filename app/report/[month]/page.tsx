import Link from "next/link";
import { Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getMonthRange } from "@/lib/month";
import { formatMonthLabel, formatShortDate } from "@/lib/date";
import { formatRs } from "@/lib/format";
import type { MonthlyReportJson } from "@/lib/reports";
import MotionSection from "@/components/MotionSection";
import GenerateReportButton from "@/components/GenerateReportButton";
import ReportShareButton from "@/components/ReportShareButton";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ month: string }>;
}) {
  const { month } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const monthDate = getMonthRange(month).startISO.slice(0, 10);

  const { data: reportRow } = profile?.household_id
    ? await supabase
        .from("monthly_reports")
        .select("report_json, ai_summary")
        .eq("household_id", profile.household_id)
        .eq("month", monthDate)
        .maybeSingle()
    : { data: null };

  const report = reportRow?.report_json as unknown as MonthlyReportJson | undefined;
  const monthLabel = formatMonthLabel(getMonthRange(month).startISO);

  if (!report) {
    return (
      <div className="-mx-4 -mb-8 flex min-h-screen flex-col items-center justify-center gap-4 bg-[#124D30] px-6 py-10 text-center text-[#FDF7EA]">
        <p className="text-2xl font-extrabold">Mahine ka Sach 🎬</p>
        <p className="text-sm opacity-70">{monthLabel} ka report abhi taiyar nahi hua</p>
        <GenerateReportButton month={month} />
        <Link href="/" className="mt-4 text-sm underline opacity-70">
          Ghar wapis jayein
        </Link>
      </div>
    );
  }

  return (
    <div className="-mx-4 -mb-8 flex min-h-screen flex-col gap-8 bg-[#124D30] px-6 py-10 text-[#FDF7EA]">
      <MotionSection index={0}>
        <p className="text-3xl font-extrabold">Mahine ka Sach 🎬</p>
        <p className="mt-1 text-sm opacity-70">{monthLabel}</p>
      </MotionSection>

      <MotionSection index={1}>
        <p className="text-xs uppercase tracking-wide opacity-60">Is mahine ki bachat</p>
        <p className="mt-1 text-6xl font-extrabold text-[#D8A548]">
          {formatRs(report.savings.amount)}
        </p>
        {report.savings.changePercent !== null && (
          <p className="mt-1 text-sm opacity-70">
            {report.savings.changePercent >= 0 ? "▲" : "▼"}{" "}
            {Math.abs(report.savings.changePercent)}% pichle mahine se
          </p>
        )}
      </MotionSection>

      {report.mvp && (
        <MotionSection
          index={2}
          className="rounded-3xl border border-[#FDF7EA]/15 bg-[#FDF7EA]/5 p-5"
        >
          <p className="flex items-center gap-2 text-sm font-semibold opacity-80">
            <Trophy className="h-5 w-5 text-[#D8A548]" strokeWidth={2} />
            Is mahine ka MVP
          </p>
          <p className="mt-2 text-lg font-bold">{report.mvp.name}</p>
          <p className="text-sm opacity-70">
            Sirf {formatRs(report.mvp.expense)} kharcha kiya — shabash!
          </p>
        </MotionSection>
      )}

      {report.mostExpensiveDay && (
        <MotionSection
          index={3}
          className="rounded-3xl border border-[#FDF7EA]/15 bg-[#FDF7EA]/5 p-5"
        >
          <p className="text-sm font-semibold opacity-80">😄 Sab se mehnga din</p>
          <p className="mt-2 text-lg font-bold">
            {formatShortDate(report.mostExpensiveDay.date)} — {formatRs(report.mostExpensiveDay.total)}
          </p>
          <p className="text-sm opacity-70">{report.mostExpensiveDay.topNotes.join(" · ")}</p>
        </MotionSection>
      )}

      {report.topCategory && (
        <MotionSection index={4}>
          <p className="text-sm opacity-80">
            <span className="font-semibold">{report.topCategory.label}</span> pe{" "}
            {report.topCategory.percentOfTotal}% kharcha hua
          </p>
          {report.projection && (
            <p className="mt-1 text-xs opacity-60">
              Isi raftar se saal ke aakhir tak ~{formatRs(report.projection.yearEndEstimate)} ban
              sakta hai
            </p>
          )}
          {report.lateNightEntry && (
            <p className="mt-1 text-xs opacity-60">
              🌙 Sab se late-night entry: {report.lateNightEntry.categoryLabel} (
              {report.lateNightEntry.userName}, {report.lateNightEntry.time})
            </p>
          )}
        </MotionSection>
      )}

      {reportRow?.ai_summary && (
        <MotionSection
          index={5}
          className="rounded-3xl border border-[#D8A548]/30 bg-[#D8A548]/10 p-5"
        >
          <p className="text-sm italic leading-relaxed opacity-90">“{reportRow.ai_summary}”</p>
        </MotionSection>
      )}

      <MotionSection index={6} className="mt-auto flex flex-col items-center gap-4 pt-6">
        <ReportShareButton month={month} />
        <p className="text-xs opacity-50">Hum Do 💚</p>
        <Link href="/" className="text-xs underline opacity-50">
          Ghar wapis jayein
        </Link>
      </MotionSection>
    </div>
  );
}
