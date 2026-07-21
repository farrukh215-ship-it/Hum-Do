import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { formatRs } from "@/lib/format";
import { formatShortDate } from "@/lib/date";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 6);
  weekAgo.setHours(0, 0, 0, 0);

  const [{ data: profiles }, { data: tx }] = await Promise.all([
    supabase.from("profiles").select("id, name, role"),
    supabase
      .from("transactions")
      .select("user_id, type, amount")
      .gte("created_at", weekAgo.toISOString()),
  ]);

  const roleByUser = new Map((profiles ?? []).map((p) => [p.id, p.role]));

  let husbandIncome = 0;
  let wifeIncome = 0;
  let husbandExpense = 0;
  let wifeExpense = 0;

  for (const t of tx ?? []) {
    const role = roleByUser.get(t.user_id);
    if (t.type === "income") {
      if (role === "husband") husbandIncome += t.amount;
      else if (role === "wife") wifeIncome += t.amount;
    } else {
      if (role === "husband") husbandExpense += t.amount;
      else if (role === "wife") wifeExpense += t.amount;
    }
  }

  const totalIncome = husbandIncome + wifeIncome;
  const totalExpense = husbandExpense + wifeExpense;
  const savings = totalIncome - totalExpense;
  const selfRole = user ? roleByUser.get(user.id) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#16A34A",
          padding: 48,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", color: "white" }}>
          <div style={{ fontSize: 30, fontWeight: 800 }}>Hum Do ki Hafta Warri Report</div>
          <div style={{ fontSize: 20, opacity: 0.85, marginTop: 4 }}>
            {formatShortDate(weekAgo.toISOString())} – {formatShortDate(now.toISOString())}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 36,
            background: "white",
            borderRadius: 32,
            padding: 40,
            flex: 1,
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#57534e" }}>
              <span>Aaya</span>
              <span style={{ fontWeight: 800, color: "#16A34A" }}>{formatRs(totalIncome)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#57534e" }}>
              <span>Gaya</span>
              <span style={{ fontWeight: 800, color: "#e11d48" }}>{formatRs(totalExpense)}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 24,
                color: "#57534e",
                borderTop: "2px solid #f5f5f4",
                paddingTop: 20,
              }}
            >
              <span>Husband kharcha</span>
              <span style={{ fontWeight: 700 }}>{formatRs(husbandExpense)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#57534e" }}>
              <span>Biwi kharcha</span>
              <span style={{ fontWeight: 700 }}>{formatRs(wifeExpense)}</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 24 }}>
            <div style={{ fontSize: 18, color: "#a8a29e" }}>Is hafte ki bachat</div>
            <div style={{ fontSize: 52, fontWeight: 800, color: "#292524" }}>{formatRs(savings)}</div>
          </div>
        </div>

        {selfRole && (
          <div style={{ display: "flex", color: "white", opacity: 0.8, fontSize: 16, marginTop: 20 }}>
            Hum Do app se
          </div>
        )}
      </div>
    ),
    { width: 1080, height: 1080 },
  );
}
