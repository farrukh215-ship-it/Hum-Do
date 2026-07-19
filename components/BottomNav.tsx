"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav({ onAddClick }: { onAddClick: () => void }) {
  const pathname = usePathname();

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center">
      <div className="flex w-full max-w-[430px] items-center justify-between bg-white px-10 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
        <Link
          href="/"
          className={`flex flex-col items-center gap-0.5 text-xs font-semibold ${
            pathname === "/" ? "text-stone-800" : "text-stone-400"
          }`}
        >
          <span className="text-2xl">🏠</span>
          Ghar
        </Link>

        <button
          type="button"
          onClick={onAddClick}
          aria-label="Add transaction"
          className="-mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-stone-800 text-3xl leading-none text-white shadow-lg transition active:scale-95"
        >
          +
        </button>

        <Link
          href="/month"
          className={`flex flex-col items-center gap-0.5 text-xs font-semibold ${
            pathname === "/month" ? "text-stone-800" : "text-stone-400"
          }`}
        >
          <span className="text-2xl">📊</span>
          Mahina
        </Link>
      </div>
    </div>
  );
}
