import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/database.types";
import { getMonthRange } from "./month";
import { getCategoryMeta } from "./categories";

export type MonthlyReportJson = {
  mvp: { userId: string; name: string; expense: number } | null;
  mostExpensiveDay: { date: string; total: number; topNotes: string[] } | null;
  topCategory: { category: string; label: string; amount: number; percentOfTotal: number } | null;
  projection: { category: string; label: string; yearEndEstimate: number } | null;
  savings: {
    amount: number;
    incomeTotal: number;
    expenseTotal: number;
    prevAmount: number | null;
    changePercent: number | null;
  };
  lateNightEntry: {
    time: string;
    categoryLabel: string;
    note: string | null;
    userName: string;
  } | null;
};

/** UTC hour → Pakistan Standard Time hour (UTC+5), independent of server timezone. */
function pktHour(iso: string): number {
  return (new Date(iso).getUTCHours() + 5) % 24;
}

function pktDateKey(iso: string): string {
  const d = new Date(iso);
  const pkt = new Date(d.getTime() + 5 * 60 * 60 * 1000);
  return pkt.toISOString().slice(0, 10);
}

export async function computeMonthlyReport(
  supabase: SupabaseClient<Database>,
  householdId: string,
  monthParam: string,
): Promise<MonthlyReportJson> {
  const range = getMonthRange(monthParam);
  const prevRange = getMonthRange(range.prevParam);

  const [{ data: profiles }, { data: monthTx }, { data: prevTx }] = await Promise.all([
    supabase.from("profiles").select("id, name, role").eq("household_id", householdId),
    supabase
      .from("transactions")
      .select("user_id, type, amount, category, note, created_at")
      .eq("household_id", householdId)
      .gte("created_at", range.startISO)
      .lt("created_at", range.endISO),
    supabase
      .from("transactions")
      .select("type, amount")
      .eq("household_id", householdId)
      .gte("created_at", prevRange.startISO)
      .lt("created_at", prevRange.endISO),
  ]);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const transactions = monthTx ?? [];

  let incomeTotal = 0;
  let expenseTotal = 0;
  const expenseByUser = new Map<string, number>();
  const expenseByCategory = new Map<string, number>();
  const expenseByDay = new Map<string, number>();

  for (const tx of transactions) {
    if (tx.type === "income") {
      incomeTotal += tx.amount;
    } else {
      expenseTotal += tx.amount;
      expenseByUser.set(tx.user_id, (expenseByUser.get(tx.user_id) ?? 0) + tx.amount);
      expenseByCategory.set(tx.category, (expenseByCategory.get(tx.category) ?? 0) + tx.amount);
      const day = pktDateKey(tx.created_at);
      expenseByDay.set(day, (expenseByDay.get(day) ?? 0) + tx.amount);
    }
  }

  // MVP: the partner who spent less this month.
  let mvp: MonthlyReportJson["mvp"] = null;
  if (profileById.size >= 2) {
    let best: { userId: string; amount: number } | null = null;
    for (const [id] of profileById) {
      const amount = expenseByUser.get(id) ?? 0;
      if (!best || amount < best.amount) best = { userId: id, amount };
    }
    if (best) {
      mvp = {
        userId: best.userId,
        name: profileById.get(best.userId)?.name ?? "—",
        expense: best.amount,
      };
    }
  }

  // Sab se mehnga din
  let mostExpensiveDay: MonthlyReportJson["mostExpensiveDay"] = null;
  if (expenseByDay.size > 0) {
    const [date, total] = [...expenseByDay.entries()].sort((a, b) => b[1] - a[1])[0];
    const dayTx = transactions
      .filter((tx) => tx.type === "expense" && pktDateKey(tx.created_at) === date)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 2);
    mostExpensiveDay = {
      date,
      total,
      topNotes: dayTx.map((tx) => tx.note?.trim() || getCategoryMeta(tx.category).label),
    };
  }

  // Top category + projection
  let topCategory: MonthlyReportJson["topCategory"] = null;
  let projection: MonthlyReportJson["projection"] = null;
  if (expenseByCategory.size > 0 && expenseTotal > 0) {
    const [category, amount] = [...expenseByCategory.entries()].sort((a, b) => b[1] - a[1])[0];
    const label = getCategoryMeta(category).label;
    topCategory = { category, label, amount, percentOfTotal: Math.round((amount / expenseTotal) * 100) };

    const now = new Date();
    const isCurrentMonth = range.param === getMonthRange().param;
    const daysInMonth = Math.round(
      (new Date(range.endISO).getTime() - new Date(range.startISO).getTime()) / 86_400_000,
    );
    const daysElapsed = isCurrentMonth ? Math.min(now.getDate(), daysInMonth) : daysInMonth;

    if (daysElapsed > 0) {
      projection = { category, label, yearEndEstimate: Math.round((amount / daysElapsed) * 365) };
    }
  }

  // Bachat
  let prevIncomeTotal = 0;
  let prevExpenseTotal = 0;
  for (const tx of prevTx ?? []) {
    if (tx.type === "income") prevIncomeTotal += tx.amount;
    else prevExpenseTotal += tx.amount;
  }
  const savingsAmount = incomeTotal - expenseTotal;
  const prevSavingsAmount = prevIncomeTotal - prevExpenseTotal;
  const hasPrevData = (prevTx ?? []).length > 0;
  const changePercent =
    hasPrevData && prevSavingsAmount !== 0
      ? Math.round(((savingsAmount - prevSavingsAmount) / Math.abs(prevSavingsAmount)) * 100)
      : null;

  // Fun stat: latest entry after 11 PM PKT
  let lateNightEntry: MonthlyReportJson["lateNightEntry"] = null;
  let bestLateness = -1;
  for (const tx of transactions) {
    const hour = pktHour(tx.created_at);
    if (hour < 23) continue;
    const minute = new Date(tx.created_at).getUTCMinutes();
    const lateness = hour * 60 + minute;
    if (lateness > bestLateness) {
      bestLateness = lateness;
      lateNightEntry = {
        time: `${hour}:${String(minute).padStart(2, "0")}`,
        categoryLabel: getCategoryMeta(tx.category).label,
        note: tx.note,
        userName: profileById.get(tx.user_id)?.name ?? "—",
      };
    }
  }

  return {
    mvp,
    mostExpensiveDay,
    topCategory,
    projection,
    savings: {
      amount: savingsAmount,
      incomeTotal,
      expenseTotal,
      prevAmount: hasPrevData ? prevSavingsAmount : null,
      changePercent,
    },
    lateNightEntry,
  };
}
