"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Step = "email" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStep("otp");
  }

  async function verifyCode(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });

    setLoading(false);
    if (error) {
      setError(error.message);
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

      {step === "email" ? (
        <form onSubmit={sendCode} className="flex w-full flex-col gap-3">
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Aapka email"
            className="w-full rounded-3xl border border-stone-200 bg-white px-4 py-3 text-center text-base text-stone-800 outline-none focus:border-stone-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-3xl bg-stone-800 px-4 py-3 text-base font-semibold text-white transition active:scale-95 disabled:opacity-50"
          >
            {loading ? "Bhej rahe hain..." : "Code bhejein"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="flex w-full flex-col gap-3">
          <p className="text-sm text-stone-500">Code {email} pe bheja gaya hai</p>
          <input
            type="text"
            inputMode="numeric"
            required
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6-digit code"
            className="w-full rounded-3xl border border-stone-200 bg-white px-4 py-3 text-center text-base tracking-[0.3em] text-stone-800 outline-none focus:border-stone-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-3xl bg-stone-800 px-4 py-3 text-base font-semibold text-white transition active:scale-95 disabled:opacity-50"
          >
            {loading ? "Check kar rahe hain..." : "Login karein"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setError(null);
            }}
            className="text-xs text-stone-400 underline"
          >
            Email badlein
          </button>
        </form>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </main>
  );
}
