"use client";

import { useState } from "react";
import BottomNav from "./BottomNav";
import TransactionSheet from "./TransactionSheet";
import RealtimeRefresher from "./RealtimeRefresher";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <RealtimeRefresher />
      <div className="flex-1 pb-24">{children}</div>
      <BottomNav onAddClick={() => setAddOpen(true)} />
      <TransactionSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}
