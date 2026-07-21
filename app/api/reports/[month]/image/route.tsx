import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { formatRs } from "@/lib/format";
import { formatMonthLabel } from "@/lib/date";
import { getMonthRange } from "@/lib/month";
import type { MonthlyReportJson } from "@/lib/reports";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ month: string }> },
) {
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

  const { data: reportRow } = await supabase
    .from("monthly_reports")
    .select("report_json, ai_summary")
    .eq("household_id", profile?.household_id ?? "")
    .eq("month", monthDate)
    .maybeSingle();

  const report = reportRow?.report_json as unknown as MonthlyReportJson | undefined;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#124D30",
          color: "#FDF7EA",
          padding: 56,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 34, fontWeight: 800 }}>Mahine ka Sach 🎬</div>
        <div style={{ display: "flex", fontSize: 22, opacity: 0.75, marginTop: 4 }}>
          {formatMonthLabel(getMonthRange(month).startISO)}
        </div>

        {report ? (
          <>
            <div style={{ display: "flex", flexDirection: "column", marginTop: 48 }}>
              <div style={{ fontSize: 20, opacity: 0.7 }}>Is mahine ki bachat</div>
              <div style={{ fontSize: 72, fontWeight: 800, color: "#D8A548" }}>
                {formatRs(report.savings.amount)}
              </div>
            </div>

            {report.mvp && (
              <div style={{ display: "flex", marginTop: 32, fontSize: 24 }}>
                🏆 {report.mvp.name} is mahine ka MVP — sirf {formatRs(report.mvp.expense)} kharcha
              </div>
            )}

            {report.topCategory && (
              <div style={{ display: "flex", marginTop: 20, fontSize: 24 }}>
                {report.topCategory.label} pe {report.topCategory.percentOfTotal}% kharcha hua
              </div>
            )}
          </>
        ) : (
          <div style={{ display: "flex", marginTop: 48, fontSize: 24, opacity: 0.7 }}>
            Report abhi taiyar nahi
          </div>
        )}

        <div style={{ display: "flex", marginTop: "auto", fontSize: 18, opacity: 0.6 }}>
          Hum Do 💚
        </div>
      </div>
    ),
    { width: 1080, height: 1350 },
  );
}
