"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function currentMonthParam(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function RecurringApplier() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data: rules } = await supabase
        .from("recurring_transactions")
        .select("id, user_id, type, amount, category, note, last_applied_month");
      if (!rules || cancelled) return;

      const thisMonth = currentMonthParam();
      // Transactions RLS only allows inserting rows where user_id = auth.uid(),
      // so each partner's recurring rules can only auto-apply on their own device.
      const due = rules.filter((r) => r.user_id === user.id && r.last_applied_month !== thisMonth);
      if (due.length === 0) return;

      for (const rule of due) {
        await supabase.from("transactions").insert({
          user_id: user.id,
          type: rule.type,
          amount: rule.amount,
          category: rule.category,
          note: rule.note,
        });
        await supabase
          .from("recurring_transactions")
          .update({ last_applied_month: thisMonth })
          .eq("id", rule.id);
      }

      if (!cancelled) router.refresh();
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
