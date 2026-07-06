"use client";

import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Flag, MapPin, MessageCircle, Navigation, ShieldCheck, Trash2 } from "lucide-react";
import { db } from "@/app/firebase";
import { useAuth } from "@/app/context/AuthContext";
import { categoryEmoji, formatRelativeTime } from "@/lib/helpers";
import type { Report } from "@/lib/types";
import RoleBadge from "@/components/ui/RoleBadge";

export default function ReportCard({ report }: { report: Report }) {
  const { user, userData } = useAuth();
  const canModerate = userData?.role === "admin" || userData?.role === "developer";
  const confirmed = user ? report.confirmations?.includes(user.uid) : false;
  const flagged = user ? report.reports?.includes(user.uid) : false;

  async function toggleConfirm() {
    if (!user) return alert("Bitte erst einloggen.");
    const confirmations = report.confirmations ?? [];
    const next = confirmed ? confirmations.filter((id) => id !== user.uid) : [...confirmations, user.uid];
    await updateDoc(doc(db, "reports", report.id), {
      confirmations: next,
      status: next.length >= 3 ? "confirmed" : "new",
    });
  }

  async function flagReport() {
    if (!user) return alert("Bitte erst einloggen.");
    if (flagged) return;
    await updateDoc(doc(db, "reports", report.id), { reports: [...(report.reports ?? []), user.uid] });
  }

  async function removeReport() {
    if (!canModerate) return;
    if (confirm("Meldung wirklich löschen?")) await deleteDoc(doc(db, "reports", report.id));
  }

  const statusText = report.status === "confirmed" ? "Bestätigt" : report.status === "expired" ? "Abgelaufen" : "Neu";

  return (
    <article className="glass-card rounded-3xl p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="rounded-full bg-blue-600/20 px-3 py-1 text-sm font-semibold text-blue-300">
          {categoryEmoji(report.category)} {report.category}
        </span>
        <span className="text-xs text-slate-400">{formatRelativeTime(report.createdAt)}</span>
      </div>

      <div className="mb-3 flex items-start gap-2">
        <MapPin size={18} className="mt-1 text-red-400" />
        <div>
          <h2 className="text-lg font-bold">{report.location}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>von {report.authorName}</span>
            <RoleBadge role={report.authorRole} />
          </div>
        </div>
      </div>

      <p className="whitespace-pre-line text-slate-300">{report.description}</p>

      <div className="mt-4 rounded-2xl bg-slate-950/60 p-3 text-sm">
        <div className={report.status === "confirmed" ? "flex items-center gap-2 text-green-400" : "flex items-center gap-2 text-yellow-300"}>
          <ShieldCheck size={17} />
          {statusText} · {(report.confirmations ?? []).length} Bestätigungen
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
        <button onClick={toggleConfirm} className={`rounded-xl py-3 font-bold ${confirmed ? "bg-green-600 text-white" : "bg-slate-800 text-slate-200"}`}>
          ✅ {confirmed ? "Bestätigt" : "Bestätigen"}
        </button>
        <button className="flex items-center justify-center gap-1 rounded-xl bg-slate-800 py-3 text-slate-200">
          <MessageCircle size={16} /> {report.commentsCount ?? 0}
        </button>
        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(report.location)}`} target="_blank" className="flex items-center justify-center gap-1 rounded-xl bg-slate-800 py-3 text-slate-200">
          <Navigation size={16} /> Route
        </a>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2">
        <button onClick={flagReport} disabled={flagged} className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 py-3 text-sm text-red-300 disabled:opacity-50">
          <Flag size={15} /> {flagged ? "Gemeldet" : "Beitrag melden"}
        </button>
        {canModerate && (
          <button onClick={removeReport} className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white">
            <Trash2 size={15} /> Löschen
          </button>
        )}
      </div>
    </article>
  );
}
