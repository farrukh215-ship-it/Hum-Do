"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    const { error: authError } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({ email: email.trim(), password });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-2 text-center">
      <div>
        <h1 className="text-3xl font-extrabold text-stone-800">Hum Do 💛</h1>
        <p className="mt-1 text-sm text-stone-500">Ghar ka hisaab, saath saath</p>
      </div>

      <div className="grid w-full grid-cols-2 gap-1 rounded-full bg-stone-100 p-1">
        <button
          type="button"
          onClick={() => switchMode("login")}
          className={`rounded-full py-2 text-sm font-semibold transition ${
            mode === "login" ? "bg-white text-stone-800 shadow" : "text-stone-400"
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => switchMode("signup")}
          className={`rounded-full py-2 text-sm font-semibold transition ${
            mode === "signup" ? "bg-white text-stone-800 shadow" : "text-stone-400"
          }`}
        >
          Naya Account
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
        <input
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Aapka email"
          className="w-full rounded-3xl border border-stone-200 bg-white px-4 py-3 text-center text-base text-stone-800 outline-none focus:border-stone-400"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-3xl border border-stone-200 bg-white px-4 py-3 text-center text-base text-stone-800 outline-none focus:border-stone-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-3xl bg-stone-800 px-4 py-3 text-base font-semibold text-white transition active:scale-95 disabled:opacity-50"
        >
          {loading
            ? "Intezaar karein..."
            : mode === "login"
              ? "Login karein"
              : "Account banayein"}
        </button>
      </form>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </main>
  );
}
