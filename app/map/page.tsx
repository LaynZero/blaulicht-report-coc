"use client";

import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import BottomNavigation from "@/components/BottomNavigation";
import { db } from "@/app/firebase";
import { categoryEmoji, formatRelativeTime } from "@/lib/helpers";
import type { Report } from "@/lib/types";

export default function MapPage() {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(30)), (snap) => {
      setReports(snap.docs.map((item) => ({ id: item.id, ...item.data() }) as Report));
    });
    return () => unsub();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-5 pb-28 pt-8 text-white">
      <section className="mx-auto max-w-md">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">Karte</p>
        <h1 className="text-3xl font-black">🗺️ Live-Übersicht</h1>
        <div className="mt-5 glass-card flex h-72 items-center justify-center rounded-3xl p-6 text-center">
          <div>
            <p className="text-5xl">🗺️</p>
            <p className="mt-3 font-bold">Kartenansicht vorbereitet</p>
            <p className="mt-2 text-sm text-slate-400">Die Route-Buttons öffnen bereits Google Maps. Eine echte Marker-Karte kann später mit Mapbox/Google Maps ergänzt werden.</p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {reports.map((report) => (
            <a key={report.id} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(report.location)}`} target="_blank" className="block rounded-2xl bg-slate-900 p-4">
              <div className="flex justify-between gap-3"><p className="font-bold">{categoryEmoji(report.category)} {report.location}</p><p className="text-xs text-slate-500">{formatRelativeTime(report.createdAt)}</p></div>
              <p className="mt-1 text-sm text-slate-400">{report.category}</p>
            </a>
          ))}
        </div>
      </section>
      <BottomNavigation />
    </main>
  );
}
