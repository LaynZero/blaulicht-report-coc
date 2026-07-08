"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { db } from "@/app/firebase";
import { useAuth } from "@/app/context/AuthContext";
import { DEFAULT_GROUP_RULES } from "@/lib/helpers";

export default function RulesGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, userData, loading } = useAuth();
  const [groupRules, setGroupRules] = useState(DEFAULT_GROUP_RULES);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "appSettings", "main"), (snap) => {
      const rules = snap.data()?.groupRules;
      setGroupRules(typeof rules === "string" && rules.trim() ? rules : DEFAULT_GROUP_RULES);
    });
    return () => unsub();
  }, []);

  const allowedPages = pathname === "/login" || pathname === "/register" || pathname === "/info";
  if (loading || !user || !userData || userData.rulesAcceptedAt || allowedPages) return <>{children}</>;

  async function acceptRules() {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { rulesAcceptedAt: serverTimestamp() });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Regeln konnten nicht bestätigt werden.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-8 text-white">
      <section className="glass-card max-w-md rounded-[2rem] p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-3xl bg-blue-500/15 p-4 text-blue-300"><ShieldCheck size={28} /></div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-300">Gruppenregeln</p>
            <h1 className="text-2xl font-black">Bitte bestätigen</h1>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-slate-400">
          Bevor du die App nutzt, musst du die aktuellen Gruppenregeln lesen und akzeptieren.
        </p>
        <div className="mt-4 max-h-[55vh] overflow-y-auto whitespace-pre-line rounded-2xl bg-slate-950/80 p-4 text-sm leading-relaxed text-slate-300">
          {groupRules}
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={acceptRules}
          className="mt-5 w-full rounded-2xl bg-blue-600 py-4 text-sm font-black shadow-lg shadow-blue-600/20 disabled:opacity-60"
        >
          {saving ? "Speichere..." : "Regeln gelesen und akzeptiert"}
        </button>
        <Link href="/info" className="mt-3 block text-center text-sm font-bold text-blue-300">Regeln im Info-Tab öffnen</Link>
      </section>
    </main>
  );
}
