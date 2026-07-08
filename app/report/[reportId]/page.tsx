"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import ReportCard from "@/components/feed/ReportCard";
import { db } from "@/app/firebase";
import type { Report } from "@/lib/types";

export default function ReportDetailPage() {
  const params = useParams<{ reportId: string }>();
  const reportId = params.reportId;
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!reportId) return;
    const unsub = onSnapshot(
      doc(db, "reports", reportId),
      (snap) => {
        setReport(snap.exists() ? ({ id: snap.id, ...snap.data() } as Report) : null);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, [reportId]);

  return (
    <main className="min-h-screen bg-slate-950 pb-28 text-white">
      <AppHeader />
      <section className="mx-auto max-w-md space-y-4 px-5 py-4">
        <Link href="/" className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-slate-200 hover:bg-slate-800">
          <ArrowLeft size={16} /> Zurück zum Feed
        </Link>

        {loading && <p className="rounded-2xl bg-slate-900 p-4 text-slate-400">Meldung wird geladen...</p>}
        {!loading && !report && <p className="rounded-2xl bg-slate-900 p-4 text-slate-400">Diese Meldung wurde nicht gefunden oder gelöscht.</p>}
        {report && <ReportCard report={report} />}
      </section>
      <BottomNavigation />
    </main>
  );
}
