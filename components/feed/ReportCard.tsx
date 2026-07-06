"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { Flag, MapPin, MessageCircle, Mic, Navigation, ShieldCheck, Trash2 } from "lucide-react";
import { db } from "@/app/firebase";
import { useAuth } from "@/app/context/AuthContext";
import { categoryEmoji, formatRelativeTime } from "@/lib/helpers";
import type { Report, ReportComment } from "@/lib/types";
import RoleBadge from "@/components/ui/RoleBadge";

export default function ReportCard({ report }: { report: Report }) {
  const { user, userData } = useAuth();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<ReportComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  const canModerate = userData?.role === "admin" || userData?.role === "developer";
  const banned = userData?.banned === true;
  const confirmed = user ? report.confirmations?.includes(user.uid) : false;
  const flagged = user ? report.reports?.includes(user.uid) : false;
  const isVoice = Boolean(report.audioDataUrl);
  const isOfficial = Boolean(report.official);

  useEffect(() => {
    if (!commentsOpen) return;
    const q = query(collection(db, "reports", report.id, "comments"), orderBy("createdAt", "asc"), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map((item) => ({ id: item.id, reportId: report.id, ...item.data() }) as ReportComment));
    });
    return () => unsub();
  }, [commentsOpen, report.id]);

  function ensureCanWrite() {
    if (!user) {
      alert("Bitte erst einloggen.");
      return false;
    }
    if (banned) {
      alert("Dein Account ist gesperrt. Du kannst keine Beiträge, Kommentare oder Bestätigungen mehr erstellen.");
      return false;
    }
    return true;
  }

  async function toggleConfirm() {
    if (!ensureCanWrite()) return;
    const confirmations = report.confirmations ?? [];
    const next = confirmed ? confirmations.filter((id) => id !== user!.uid) : [...confirmations, user!.uid];
    await updateDoc(doc(db, "reports", report.id), {
      confirmations: next,
      status: next.length >= 3 ? "confirmed" : "new",
    });
  }

  async function flagReport() {
    if (!ensureCanWrite()) return;
    if (flagged) return;
    await updateDoc(doc(db, "reports", report.id), { reports: [...(report.reports ?? []), user!.uid] });
  }

  async function sendComment(event: React.FormEvent) {
    event.preventDefault();
    if (!ensureCanWrite() || !userData) return;
    const text = commentText.trim();
    if (text.length < 2) return alert("Kommentar ist zu kurz.");

    setSendingComment(true);
    try {
      await addDoc(collection(db, "reports", report.id, "comments"), {
        text,
        authorId: user!.uid,
        authorName: userData.displayName,
        authorRole: userData.role,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "reports", report.id), { commentsCount: increment(1), updatedAt: serverTimestamp() });
      await updateDoc(doc(db, "users", user!.uid), { commentsCount: increment(1), trustPoints: increment(1) });
      setCommentText("");
      setCommentsOpen(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Kommentar konnte nicht gesendet werden.");
    } finally {
      setSendingComment(false);
    }
  }

  async function removeReport() {
    if (!canModerate) return;
    if (confirm("Meldung wirklich löschen?")) await deleteDoc(doc(db, "reports", report.id));
  }

  const statusText = report.status === "confirmed" ? "Bestätigt" : report.status === "expired" ? "Abgelaufen" : "Neu";
  const officialText = report.authorRole === "developer" ? "Entwickler-Post" : "Admin-Post";

  return (
    <article className={`glass-card overflow-hidden rounded-3xl p-5 ${isOfficial ? "border-blue-400/40" : ""}`}>
      {isOfficial && (
        <div className="mb-4 rounded-2xl border border-blue-400/30 bg-blue-600/15 p-3 text-sm font-black text-blue-200">
          📢 Offizieller {officialText}
        </div>
      )}

      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="rounded-full bg-blue-600/20 px-3 py-1 text-sm font-semibold text-blue-300">
          {categoryEmoji(report.category)} {report.category}
        </span>
        <span className="text-xs text-slate-400">{formatRelativeTime(report.createdAt)}</span>
      </div>

      <div className="mb-3 flex items-start gap-2">
        <MapPin size={18} className="mt-1 text-red-400" />
        <div>
          <h2 className="break-words text-lg font-bold">{report.location}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="min-w-0 break-words">von {report.authorName}</span>
            <RoleBadge role={report.authorRole} />
          </div>
        </div>
      </div>

      {report.description && <p className="overflow-wrap-anywhere whitespace-pre-line break-words text-slate-300">{report.description}</p>}

      {isVoice && (
        <div className="mt-4 rounded-2xl border border-violet-400/20 bg-violet-500/10 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-black text-violet-200">
            <Mic size={16} /> Sprachnachricht
          </div>
          <audio src={report.audioDataUrl} controls className="w-full" />
          {report.audioDurationSeconds ? <p className="mt-2 text-xs text-slate-400">Länge: ca. {report.audioDurationSeconds}s</p> : null}
        </div>
      )}

      <div className="mt-4 rounded-2xl bg-slate-950/60 p-3 text-sm">
        <div className={report.status === "confirmed" ? "flex items-center gap-2 text-green-400" : "flex items-center gap-2 text-yellow-300"}>
          <ShieldCheck size={17} />
          {statusText} · {(report.confirmations ?? []).length} Bestätigungen
        </div>
      </div>

      {banned && (
        <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm font-bold text-red-200">
          Dein Account ist gesperrt. Du kannst nur noch lesen.
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
        <button onClick={toggleConfirm} disabled={banned} className={`rounded-xl py-3 font-bold disabled:opacity-40 ${confirmed ? "bg-green-600 text-white" : "bg-slate-800 text-slate-200"}`}>
          ✅ {confirmed ? "Bestätigt" : "Bestätigen"}
        </button>
        <button onClick={() => setCommentsOpen((value) => !value)} className="flex items-center justify-center gap-1 rounded-xl bg-slate-800 py-3 text-slate-200">
          <MessageCircle size={16} /> {report.commentsCount ?? 0}
        </button>
        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(report.location)}`} target="_blank" className="flex items-center justify-center gap-1 rounded-xl bg-slate-800 py-3 text-slate-200">
          <Navigation size={16} /> Route
        </a>
      </div>

      {commentsOpen && (
        <div className="mt-4 space-y-3 rounded-2xl bg-slate-950/50 p-3">
          <h3 className="font-black">Kommentare</h3>
          {comments.length === 0 && <p className="text-sm text-slate-400">Noch keine Kommentare.</p>}
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-2xl bg-slate-900/80 p-3">
              <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="break-words font-bold text-slate-200">{comment.authorName}</span>
                <RoleBadge role={comment.authorRole} />
                <span>{formatRelativeTime(comment.createdAt)}</span>
              </div>
              <p className="overflow-wrap-anywhere whitespace-pre-line break-words text-sm text-slate-200">{comment.text}</p>
            </div>
          ))}

          {!banned && user && (
            <form onSubmit={sendComment} className="flex gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950 p-3 text-sm outline-none focus:border-blue-500"
                placeholder="Kommentar schreiben..."
              />
              <button disabled={sendingComment} className="rounded-xl bg-blue-600 px-4 text-sm font-black disabled:opacity-60">
                Senden
              </button>
            </form>
          )}
        </div>
      )}

      <div className="mt-3 grid grid-cols-1 gap-2">
        <button onClick={flagReport} disabled={flagged || banned} className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 py-3 text-sm text-red-300 disabled:opacity-50">
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
