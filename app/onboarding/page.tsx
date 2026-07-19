"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/lib/supabase/database.types";

type Step = "name" | "path" | "code" | "role" | "invite-reveal";
type Path = "create" | "join";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("name");
  const [path, setPath] = useState<Path | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [takenRoles, setTakenRoles] = useState<Role[]>([]);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [savingRole, setSavingRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function goToPath(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Pehle apna naam likhein");
      return;
    }
    setError(null);
    setStep("path");
  }

  function choosePath(next: Path) {
    setPath(next);
    setError(null);
    setStep(next === "create" ? "role" : "code");
  }

  async function submitCode(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase
      .rpc("find_household_by_invite_code", { p_code: code.trim() })
      .single();

    setLoading(false);

    if (rpcError || !data?.household_id) {
      setError("Invite code sahi nahi hai");
      return;
    }

    setTakenRoles(data.taken_roles ?? []);
    setStep("role");
  }

  async function chooseRole(role: Role) {
    if (takenRoles.includes(role)) return;

    setSavingRole(role);
    setError(null);

    const supabase = createClient();

    if (path === "create") {
      const { data, error: rpcError } = await supabase
        .rpc("create_household", { p_name: name.trim(), p_role: role })
        .single();

      setSavingRole(null);

      if (rpcError) {
        setError(rpcError.message);
        return;
      }

      setInviteCode(data?.invite_code ?? null);
      setStep("invite-reveal");
      return;
    }

    const { error: rpcError } = await supabase
      .rpc("join_household", { p_code: code.trim(), p_name: name.trim(), p_role: role })
      .single();

    setSavingRole(null);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  function copyInviteCode() {
    if (inviteCode) navigator.clipboard.writeText(inviteCode);
  }

  function finish() {
    router.replace("/");
    router.refresh();
  }

  const bothRolesTaken = path === "join" && takenRoles.length >= 2;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-2 text-center">
      {step === "name" && (
        <>
          <div>
            <h1 className="text-2xl font-extrabold text-stone-800">Aap kaun ho?</h1>
            <p className="mt-1 text-sm text-stone-500">Pehle apna naam likhein</p>
          </div>
          <form onSubmit={goToPath} className="flex w-full flex-col gap-3">
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Aapka naam"
              className="w-full rounded-3xl border border-stone-200 bg-white px-4 py-3 text-center text-base text-stone-800 outline-none focus:border-stone-400"
            />
            <button
              type="submit"
              className="w-full rounded-3xl bg-stone-800 px-4 py-3 text-base font-semibold text-white transition active:scale-95"
            >
              Aage badhein →
            </button>
          </form>
        </>
      )}

      {step === "path" && (
        <>
          <div>
            <h1 className="text-2xl font-extrabold text-stone-800">Ghar shuru karein</h1>
            <p className="mt-1 text-sm text-stone-500">Naya ghar banayein ya partner ke ghar mein shamil hon</p>
          </div>
          <div className="flex w-full flex-col gap-3">
            <button
              type="button"
              onClick={() => choosePath("create")}
              className="flex items-center gap-3 rounded-3xl bg-stone-100 p-4 text-left transition active:scale-95"
            >
              <span className="text-3xl">🏠</span>
              <span>
                <span className="block text-sm font-semibold text-stone-800">Naya Ghar Banayein</span>
                <span className="block text-xs text-stone-500">Main pehla partner hoon</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => choosePath("join")}
              className="flex items-center gap-3 rounded-3xl bg-stone-100 p-4 text-left transition active:scale-95"
            >
              <span className="text-3xl">🔗</span>
              <span>
                <span className="block text-sm font-semibold text-stone-800">Ghar Join Karein</span>
                <span className="block text-xs text-stone-500">Partner ne pehle se ghar banaya hai</span>
              </span>
            </button>
          </div>
          <button
            type="button"
            onClick={() => setStep("name")}
            className="text-xs text-stone-400 underline"
          >
            ← Wapis
          </button>
        </>
      )}

      {step === "code" && (
        <>
          <div>
            <h1 className="text-2xl font-extrabold text-stone-800">Invite code daalein</h1>
            <p className="mt-1 text-sm text-stone-500">Partner ne jo code bheja hai wo yahan likhein</p>
          </div>
          <form onSubmit={submitCode} className="flex w-full flex-col gap-3">
            <input
              type="text"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="CODE"
              className="w-full rounded-3xl border border-stone-200 bg-white px-4 py-3 text-center text-base tracking-[0.3em] text-stone-800 outline-none focus:border-stone-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-3xl bg-stone-800 px-4 py-3 text-base font-semibold text-white transition active:scale-95 disabled:opacity-50"
            >
              {loading ? "Check kar rahe hain..." : "Aage badhein →"}
            </button>
          </form>
          <button
            type="button"
            onClick={() => setStep("path")}
            className="text-xs text-stone-400 underline"
          >
            ← Wapis
          </button>
        </>
      )}

      {step === "role" && (
        <>
          <div>
            <h1 className="text-2xl font-extrabold text-stone-800">Aap kaun ho?</h1>
            <p className="mt-1 text-sm text-stone-500">Apna role chunein</p>
          </div>

          {bothRolesTaken ? (
            <>
              <p className="text-sm text-stone-500">
                Yeh ghar mein husband aur biwi dono pehle se hain.
              </p>
              <button
                type="button"
                onClick={() => setStep("code")}
                className="text-xs text-stone-400 underline"
              >
                ← Dusra code try karein
              </button>
            </>
          ) : (
            <>
              <div className="grid w-full grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={savingRole !== null || takenRoles.includes("husband")}
                  onClick={() => chooseRole("husband")}
                  className="flex flex-col items-center gap-2 rounded-3xl bg-husband/10 p-6 transition active:scale-95 disabled:opacity-40"
                >
                  <span className="text-5xl">👨</span>
                  <span className="text-sm font-semibold text-husband">Husband</span>
                  {takenRoles.includes("husband") && (
                    <span className="text-[10px] text-stone-400">Partner ne le liya</span>
                  )}
                </button>
                <button
                  type="button"
                  disabled={savingRole !== null || takenRoles.includes("wife")}
                  onClick={() => chooseRole("wife")}
                  className="flex flex-col items-center gap-2 rounded-3xl bg-wife/10 p-6 transition active:scale-95 disabled:opacity-40"
                >
                  <span className="text-5xl">👩</span>
                  <span className="text-sm font-semibold text-wife">Biwi</span>
                  {takenRoles.includes("wife") && (
                    <span className="text-[10px] text-stone-400">Partner ne le liya</span>
                  )}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setStep(path === "create" ? "path" : "code")}
                className="text-xs text-stone-400 underline"
              >
                ← Wapis
              </button>
            </>
          )}
        </>
      )}

      {step === "invite-reveal" && inviteCode && (
        <>
          <div>
            <h1 className="text-2xl font-extrabold text-stone-800">Ghar ban gaya! 🎉</h1>
            <p className="mt-1 text-sm text-stone-500">Yeh code apne partner ko bhejein</p>
          </div>
          <p className="w-full rounded-3xl bg-husband/10 py-5 text-3xl font-extrabold tracking-[0.3em] text-husband">
            {inviteCode}
          </p>
          <div className="flex w-full flex-col gap-3">
            <button
              type="button"
              onClick={copyInviteCode}
              className="w-full rounded-3xl bg-stone-100 px-4 py-3 text-sm font-semibold text-stone-600"
            >
              Copy karein
            </button>
            <button
              type="button"
              onClick={finish}
              className="w-full rounded-3xl bg-stone-800 px-4 py-3 text-base font-semibold text-white transition active:scale-95"
            >
              Chalein →
            </button>
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </main>
  );
}
