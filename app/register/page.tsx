"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { isReservedUsername, normalizeUsername } from "@/lib/helpers";

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function register(event: React.FormEvent) {
    event.preventDefault();
    const cleanUsername = normalizeUsername(username || displayName);

    if (displayName.trim().length < 2)
      return alert("Bitte gib einen Namen ein.");
    if (cleanUsername.length < 3 || cleanUsername.length > 20)
      return alert(
        "Benutzername: 3–20 Zeichen, nur Buchstaben, Zahlen, _ und .",
      );
    if (isReservedUsername(cleanUsername))
      return alert("Dieser Benutzername ist reserviert.");
    if (password.length < 6)
      return alert("Das Passwort muss mindestens 6 Zeichen haben.");

    setLoading(true);
    try {
      const usernameRef = doc(db, "usernames", cleanUsername);
      const usernameSnap = await getDoc(usernameRef);
      if (usernameSnap.exists()) {
        alert("Dieser Benutzername ist bereits vergeben.");
        return;
      }

      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: displayName.trim() });

      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        displayName: displayName.trim(),
        username: cleanUsername,
        email,
        role: "user",
        bio: "",
        location: "",
        trustPoints: 0,
        reportsCount: 0,
        confirmationsCount: 0,
        commentsCount: 0,
        banned: false,
        createdAt: serverTimestamp(),
      });

      await setDoc(usernameRef, {
        uid: cred.user.uid,
        createdAt: serverTimestamp(),
      });
      router.push("/");
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Registrierung fehlgeschlagen.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <form
        onSubmit={register}
        className="mx-auto max-w-md space-y-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl"
      >
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-400">
            Blaulicht Report
          </p>
          <h1 className="mt-2 text-3xl font-black">Account erstellen</h1>
          <p className="mt-2 text-sm text-slate-400">
            Melde dich mit Namen und eindeutigem @Benutzernamen an.
          </p>
        </div>

        <input
          className="w-full rounded-2xl border border-white/10 bg-slate-950 p-4 outline-none focus:border-blue-500"
          placeholder="Anzeigename"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <input
          className="w-full rounded-2xl border border-white/10 bg-slate-950 p-4 outline-none focus:border-blue-500"
          placeholder="Benutzername, z. B. max_muster"
          value={username}
          onChange={(e) => setUsername(normalizeUsername(e.target.value))}
        />
        <input
          className="w-full rounded-2xl border border-white/10 bg-slate-950 p-4 outline-none focus:border-blue-500"
          placeholder="E-Mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full rounded-2xl border border-white/10 bg-slate-950 p-4 outline-none focus:border-blue-500"
          placeholder="Passwort"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          disabled={loading}
          className="w-full rounded-2xl bg-blue-600 py-4 font-black shadow-lg shadow-blue-600/30 disabled:opacity-60"
        >
          {loading ? "Wird erstellt..." : "Registrieren"}
        </button>

        <p className="text-center text-sm text-slate-400">
          Schon einen Account?{" "}
          <Link href="/login" className="font-bold text-blue-400">
            Einloggen
          </Link>
        </p>
      </form>
    </main>
  );
}
