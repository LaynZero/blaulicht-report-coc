"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, doc, increment, serverTimestamp, updateDoc } from "firebase/firestore";
import BottomNavigation from "@/components/BottomNavigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/app/context/AuthContext";
import { db } from "@/app/firebase";
import { reportCategories } from "@/lib/helpers";
import type { ReportCategory } from "@/lib/types";

export default function ReportPage() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [category, setCategory] = useState<ReportCategory>("Verkehrskontrolle");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function createReport(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !userData) return;
    if (location.trim().length < 3) return alert("Bitte gib einen Ort ein.");
    if (description.trim().length < 5) return alert("Bitte beschreibe kurz, was los ist.");

    setLoading(true);
    try {
      await addDoc(collection(db, "reports"), {
        category,
        location: location.trim(),
        description: description.trim(),
        authorId: user.uid,
        authorName: userData.displayName,
        authorRole: userData.role,
        confirmations: [user.uid],
        reports: [],
        commentsCount: 0,
        status: "new",
        pinned: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "users", user.uid), {
        reportsCount: increment(1),
        trustPoints: increment(5),
      });
      router.push("/");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Meldung konnte nicht erstellt werden.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-slate-950 px-5 pb-28 pt-8 text-white">
        <form onSubmit={createReport} className="mx-auto max-w-md space-y-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">Neue Meldung</p>
            <h1 className="text-3xl font-black">🚨 Was ist los?</h1>
            <p className="mt-2 text-sm text-slate-400">Bitte nur echte, aktuelle und hilfreiche Meldungen posten.</p>
          </div>

          <div>
            <label className="mb-2 block font-bold">Kategorie</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as ReportCategory)} className="w-full rounded-2xl border border-slate-700 bg-slate-900 p-4">
              {reportCategories.map((item) => <option key={item.value} value={item.value}>{item.icon} {item.label}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-bold">Ort</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-900 p-4" placeholder="z.B. Cochem B49, Zell Brücke" />
          </div>

          <div>
            <label className="mb-2 block font-bold">Beschreibung</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} className="w-full rounded-2xl border border-slate-700 bg-slate-900 p-4" placeholder="Was ist passiert? Richtung? Besonderheiten?" />
          </div>

          <button disabled={loading} className="w-full rounded-2xl bg-blue-600 py-4 text-lg font-black shadow-lg shadow-blue-600/30 disabled:opacity-60">
            {loading ? "Wird veröffentlicht..." : "Meldung veröffentlichen"}
          </button>
        </form>
        <BottomNavigation />
      </main>
    </ProtectedRoute>
  );
}
