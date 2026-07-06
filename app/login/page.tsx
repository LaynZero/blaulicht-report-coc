"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { auth } from "../firebase";
import {
  GoogleAuthProvider,
  OAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Login fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  async function loginWithGoogle() {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      router.push("/");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Google Login fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  async function loginWithApple() {
    setLoading(true);
    try {
      const provider = new OAuthProvider("apple.com");
      provider.addScope("email");
      provider.addScope("name");
      await signInWithPopup(auth, provider);
      router.push("/");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Apple Login fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    if (!email) return alert("Gib zuerst deine E-Mail ein.");
    await sendPasswordResetEmail(auth, email);
    alert("Passwort-Reset wurde gesendet.");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <form onSubmit={login} className="mx-auto max-w-md space-y-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl">
        <div className="text-center">
          <Image src="/logo.png" alt="Blaulicht Report COC" width={120} height={120} className="mx-auto mb-3 rounded-3xl" priority />
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-400">COC Live</p>
          <h1 className="mt-2 text-3xl font-black">Einloggen</h1>
          <p className="mt-2 text-sm text-slate-400">Willkommen zurück im Blaulicht Report.</p>
        </div>

        <button type="button" onClick={loginWithGoogle} disabled={loading} className="w-full rounded-2xl border border-white/10 bg-white py-3 font-black text-slate-950 disabled:opacity-60">
          Mit Google einloggen
        </button>

        <button type="button" onClick={loginWithApple} disabled={loading} className="w-full rounded-2xl border border-white/10 bg-black py-3 font-black text-white disabled:opacity-60">
          Mit Apple einloggen
        </button>

        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
          <span className="h-px flex-1 bg-white/10" />
          oder
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <input className="w-full rounded-2xl border border-white/10 bg-slate-950 p-4 outline-none focus:border-blue-500" placeholder="E-Mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full rounded-2xl border border-white/10 bg-slate-950 p-4 outline-none focus:border-blue-500" placeholder="Passwort" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

        <button disabled={loading} className="w-full rounded-2xl bg-blue-600 py-4 font-black shadow-lg shadow-blue-600/30 disabled:opacity-60">
          {loading ? "Lädt..." : "Einloggen"}
        </button>

        <button type="button" onClick={resetPassword} className="w-full rounded-2xl bg-slate-800 py-3 text-sm font-bold text-slate-200">
          Passwort vergessen
        </button>

        <p className="text-center text-sm text-slate-400">
          Noch keinen Account? <Link href="/register" className="font-bold text-blue-400">Registrieren</Link>
        </p>
      </form>
    </main>
  );
}
