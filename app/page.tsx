"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import BottomNavigation from "@/components/BottomNavigation";
import AppHeader from "@/components/AppHeader";
import ReportCard from "@/components/feed/ReportCard";
import { db } from "./firebase";
import { isExpiredArchived, reportCategories } from "@/lib/helpers";
import { useAuth } from "@/app/context/AuthContext";
import type { Report, ReportCategory } from "@/lib/types";

export default function Home() {
  const [reports, setReports] = useState<Report[]>([]);
  const [category, setCategory] = useState<ReportCategory | "Alle">("Alle");
  const [loading, setLoading] = useState(true);
  const { userData } = useAuth();

  useEffect(() => {
    const q = query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(50));

    const unsub = onSnapshot(q, (snap) => {
      const allReports = snap.docs
        .map((item) => ({ id: item.id, ...item.data() }) as Report)
        .filter((item) => item.status !== "hidden" && !isExpiredArchived(item.status, item.updatedAt, item.createdAt));
      setReports(category === "Alle" ? allReports : allReports.filter((item) => item.category === category));
      setLoading(false);
    }, () => setLoading(false));

    return () => unsub();
  }, [category]);

  const pinned = useMemo(() => reports.filter((item) => item.pinned), [reports]);
  const normal = useMemo(() => reports.filter((item) => !item.pinned), [reports]);

  return (
    <main className="min-h-screen bg-slate-950 text-white pb-24">
      <AppHeader />

      <section className="mx-auto max-w-md px-5 py-4">
        {userData?.banned ? (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-center text-sm font-bold text-red-200">
            Dein Account ist gesperrt. Du kannst aktuell keine Beiträge erstellen.
          </div>
        ) : (
          <Link href="/report" className="block w-full rounded-2xl bg-blue-600 py-4 text-center font-bold shadow-lg shadow-blue-600/30">
            + Neue Meldung posten
          </Link>
        )}

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          <button onClick={() => setCategory("Alle")} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${category === "Alle" ? "bg-blue-600" : "bg-slate-800"}`}>Alle</button>
          {reportCategories.map((item) => (
            <button key={item.value} onClick={() => setCategory(item.value)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${category === item.value ? "bg-blue-600" : "bg-slate-800"}`}>
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-md space-y-4 px-5">
        {loading && <p className="rounded-2xl bg-slate-900 p-4 text-slate-400">Meldungen werden geladen...</p>}
        {!loading && reports.length === 0 && <p className="rounded-2xl bg-slate-900 p-4 text-slate-400">Noch keine Meldungen vorhanden.</p>}
        {pinned.map((report) => <ReportCard key={report.id} report={report} />)}
        {normal.map((report) => <ReportCard key={report.id} report={report} />)}
      </section>

      <BottomNavigation />
    </main>
  );
}
