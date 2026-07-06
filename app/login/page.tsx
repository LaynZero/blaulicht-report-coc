"use client";

import { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function login() {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (err: any) {
      alert(err.message);
    }
  }

  return (
    <main className="flex flex-col gap-4 max-w-sm mx-auto mt-20">
      <h1 className="text-3xl font-bold">Einloggen</h1>

      <input
        className="border p-2 rounded"
        placeholder="E-Mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="border p-2 rounded"
        placeholder="Passwort"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        onClick={login}
        className="bg-blue-600 text-white rounded p-2"
      >
        Einloggen
      </button>
    </main>
  );
}