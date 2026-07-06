"use client";

import { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function register() {
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        displayName,
        email,
        role: "user",
        createdAt: serverTimestamp(),
      });

      alert("Registrierung erfolgreich!");
    } catch (err: any) {
      alert(err.message);
    }
  }

  return (
    <main className="flex flex-col gap-4 max-w-sm mx-auto mt-20">
      <h1 className="text-3xl font-bold">Registrieren</h1>

      <input
        className="border p-2 rounded"
        placeholder="Benutzername"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
      />

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
        onClick={register}
        className="bg-blue-600 text-white rounded p-2"
      >
        Registrieren
      </button>
    </main>
  );
}