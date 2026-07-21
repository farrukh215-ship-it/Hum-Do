import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeMonthlyReport } from "@/lib/reports";
import { generateAiSummary } from "@/lib/ai-summary";
import { sendPushToHousehold } from "@/lib/push";
import { getMonthRange } from "@/lib/month";
import { formatMonthLabel } from "@/lib/date";

export const runtime = "nodejs";

async function generateForHousehold(
  supabase: Parameters<typeof computeMonthlyReport>[0],
  householdId: string,
  monthParam: string,
) {
  const report = await computeMonthlyReport(supabase, householdId, monthParam);
  const aiSummary = await generateAiSummary(report);
  const monthDate = `${getMonthRange(monthParam).startISO.slice(0, 10)}`;

  await supabase.from("monthly_reports").upsert(
    {
      household_id: householdId,
      month: monthDate,
      report_json: report,
      ai_summary: aiSummary,
    },
    { onConflict: "household_id,month" },
  );

  return report;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const monthOverride = searchParams.get("month") ?? undefined;
  const authHeader = request.headers.get("authorization");

  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    const admin = createAdminClient();
    const monthParam = monthOverride ?? getMonthRange().prevParam;

    const { data: households } = await admin.from("households").select("id");

    for (const household of households ?? []) {
      await generateForHousehold(admin, household.id, monthParam);
      await sendPushToHousehold(admin, household.id, {
        title: `${formatMonthLabel(getMonthRange(monthParam).startISO)} ka Sach 🎬`,
        body: "Dekho kya nikla!",
        url: `/report/${monthParam}`,
      });
    }

    return NextResponse.json({ generated: households?.length ?? 0, month: monthParam });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.household_id) {
    return NextResponse.json({ error: "No household" }, { status: 400 });
  }

  const monthParam = monthOverride ?? getMonthRange().param;
  const report = await generateForHousehold(supabase, profile.household_id, monthParam);

  return NextResponse.json({ month: monthParam, report });
}
