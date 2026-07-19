"use client";

import { useState } from "react";
import BottomNav from "./BottomNav";
import AddTransactionSheet from "./AddTransactionSheet";
import RealtimeRefresher from "./RealtimeRefresher";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <RealtimeRefresher />
      <div className="flex-1 pb-24">{children}</div>
      <BottomNav onAddClick={() => setAddOpen(true)} />
      <AddTransactionSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}
