"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/lib/supabase/database.types";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [savingRole, setSavingRole] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function chooseRole(role: Role) {
    if (!name.trim()) {
      setError("Pehle apna naam likhein");
      return;
    }

    setError(null);
    setSavingRole(role);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, name: name.trim(), role });

    if (error) {
      setError(error.message);
      setSavingRole(null);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-2 text-center">
      <div>
        <h1 className="text-2xl font-extrabold text-stone-800">Aap kaun ho?</h1>
        <p className="mt-1 text-sm text-stone-500">Apna naam likhein aur role chunein</p>
      </div>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Aapka naam"
        className="w-full rounded-3xl border border-stone-200 bg-white px-4 py-3 text-center text-base text-stone-800 outline-none focus:border-stone-400"
      />

      <div className="grid w-full grid-cols-2 gap-3">
        <button
          type="button"
          disabled={savingRole !== null}
          onClick={() => chooseRole("husband")}
          className="flex flex-col items-center gap-2 rounded-3xl bg-husband/10 p-6 transition active:scale-95 disabled:opacity-50"
        >
          <span className="text-5xl">👨</span>
          <span className="text-sm font-semibold text-husband">Husband</span>
        </button>
        <button
          type="button"
          disabled={savingRole !== null}
          onClick={() => chooseRole("wife")}
          className="flex flex-col items-center gap-2 rounded-3xl bg-wife/10 p-6 transition active:scale-95 disabled:opacity-50"
        >
          <span className="text-5xl">👩</span>
          <span className="text-sm font-semibold text-wife">Biwi</span>
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </main>
  );
}
