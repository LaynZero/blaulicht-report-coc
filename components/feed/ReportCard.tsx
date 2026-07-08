"use client";

import Link from "next/link";
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
import { CheckCircle2, Flag, MapPin, MessageCircle, Mic, Navigation, ShieldCheck, Trash2 } from "lucide-react";
import { db } from "@/app/firebase";
import { useAuth } from "@/app/context/AuthContext";
import { categoryEmoji, extractMentions, formatRelativeTime } from "@/lib/helpers";
import type { Report, ReportComment } from "@/lib/types";
import RoleBadge from "@/components/ui/RoleBadge";
import UserAvatar from "@/components/ui/UserAvatar";
import MentionTextarea from "@/components/MentionTextarea";
import MentionedText from "@/components/MentionedText";
import { createMentionNotifications } from "@/lib/notifications";

function getRouteUrl(report: Report) {
  if (typeof report.latitude === "number" && typeof report.longitude === "number") {
    return `https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`;
  }
  if (report.location?.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(report.location)}`;
  }
  return "";
}

export default function ReportCard({ report }: { report: Report }) {
  const { user, userData } = useAuth();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<ReportComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);

  const canModerate = userData?.role === "admin" || userData?.role === "developer";
  const banned = userData?.banned === true;
  const legacyOutdatedBy = report.outdatedBy ?? report.confirmations ?? [];
  const confirmedBy = report.confirmedBy ?? [];
  const markedConfirmed = user ? confirmedBy.includes(user.uid) : false;
  const markedOutdated = user ? legacyOutdatedBy.includes(user.uid) : false;
  const flagged = user ? report.reports?.includes(user.uid) : false;
  const isVoice = Boolean(report.audioDataUrl);
  const isOfficial = Boolean(report.official);
  const isEmergency = Boolean(report.emergency);
  const authorHref = report.authorUsername ? `/u/${report.authorUsername}` : undefined;

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
      alert("Dein Account ist gesperrt. Du kannst keine Beiträge, Kommentare oder Statusmeldungen mehr erstellen.");
      return false;
    }
    return true;
  }

  async function markConfirmed() {
    if (!ensureCanWrite()) return;
    const nextConfirmedBy = markedConfirmed
      ? confirmedBy.filter((id) => id !== user!.uid)
      : [...confirmedBy, user!.uid];
    const nextOutdatedBy = legacyOutdatedBy.filter((id) => id !== user!.uid);
    const nextStatus = nextOutdatedBy.length >= 2 ? "expired" : nextConfirmedBy.length >= 2 ? "confirmed" : "new";

    try {
      await updateDoc(doc(db, "reports", report.id), {
        confirmedBy: nextConfirmedBy,
        outdatedBy: nextOutdatedBy,
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "users", user!.uid), {
        confirmationsCount: increment(markedConfirmed ? -1 : 1),
        trustPoints: increment(markedConfirmed ? -1 : 1),
      });
    } catch {
      alert("Aktion nicht erlaubt. Falls dein Account gerade gesperrt wurde, lade die App bitte neu.");
    }
  }

  async function markOutdated() {
    if (!ensureCanWrite()) return;
    const nextOutdatedBy = markedOutdated
      ? legacyOutdatedBy.filter((id) => id !== user!.uid)
      : [...legacyOutdatedBy, user!.uid];
    const nextConfirmedBy = confirmedBy.filter((id) => id !== user!.uid);
    const nextStatus = canModerate || nextOutdatedBy.length >= 2 ? "expired" : nextConfirmedBy.length >= 2 ? "confirmed" : "new";

    try {
      await updateDoc(doc(db, "reports", report.id), {
        confirmedBy: nextConfirmedBy,
        outdatedBy: nextOutdatedBy,
        // Legacy-Feld leeren, damit nach dem Update keine alte Auswahl mehr als "nicht mehr aktuell" zählt.
        confirmations: [],
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "users", user!.uid), {
        trustPoints: increment(markedOutdated ? -1 : 1),
      });
    } catch {
      alert("Aktion nicht erlaubt. Falls dein Account gerade gesperrt wurde, lade die App bitte neu.");
    }
  }

  async function flagReport() {
    if (!ensureCanWrite()) return;
    if (flagged) return;
    try {
      await updateDoc(doc(db, "reports", report.id), { reports: [...(report.reports ?? []), user!.uid] });
    } catch {
      alert("Aktion nicht erlaubt. Falls dein Account gerade gesperrt wurde, lade die App bitte neu.");
    }
  }

  async function sendComment(event: React.FormEvent) {
    event.preventDefault();
    if (!canModerate) return alert("Kommentare können nur von Admins und Entwicklern geschrieben werden.");
    if (!ensureCanWrite() || !userData) return;
    const text = commentText.trim();
    if (text.length < 2) return alert("Kommentar ist zu kurz.");

    setSendingComment(true);
    try {
      const commentRef = await addDoc(collection(db, "reports", report.id, "comments"), {
        text,
        mentions: extractMentions(text),
        authorId: user!.uid,
        authorName: userData.displayName,
        authorRole: userData.role,
        authorUsername: userData.username,
        authorAvatarDataUrl: userData.avatarDataUrl || "",
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "reports", report.id), { commentsCount: increment(1), updatedAt: serverTimestamp() });
      await createMentionNotifications({
        mentions: extractMentions(text),
        actorId: user!.uid,
        actorName: userData.displayName,
        text,
        reportId: report.id,
        source: "comment",
      });
      fetch("/api/push/comment-created", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: report.id, commentId: commentRef.id, authorId: user!.uid }),
      }).catch(() => undefined);
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

  async function removeComment(comment: ReportComment) {
    if (!canModerate) return;
    if (!confirm("Kommentar wirklich löschen?")) return;
    await deleteDoc(doc(db, "reports", report.id, "comments", comment.id));
    await updateDoc(doc(db, "reports", report.id), { commentsCount: increment(-1), updatedAt: serverTimestamp() });
    if (comment.authorId) await updateDoc(doc(db, "users", comment.authorId), { commentsCount: increment(-1) }).catch(() => undefined);
  }

  const statusText = report.status === "expired" ? "Nicht mehr aktuell" : report.status === "confirmed" ? "Bestätigt" : "Aktiv";
  const officialText = report.authorRole === "developer" ? "Entwickler-Post" : "Admin-Post";

  return (
    <>
    <article className={`glass-card overflow-hidden rounded-3xl p-5 ${report.status === "expired" ? "opacity-70 grayscale-[0.25]" : ""} ${isEmergency ? "border-red-400/70 shadow-lg shadow-red-600/10" : isOfficial ? "border-blue-400/40" : ""}`}>
      {isEmergency && (
        <div className="mb-4 rounded-2xl border border-red-400/40 bg-red-600/20 p-3 text-sm font-black text-red-100">
          🚨 EILMELDUNG · Wichtige Warnung
        </div>
      )}

      {isOfficial && !isEmergency && (
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

      <div className="mb-3 flex items-start gap-3">
        {authorHref ? (
          <Link href={authorHref} className="rounded-full transition hover:scale-105" aria-label={`Profil von ${report.authorName} öffnen`}>
            <UserAvatar src={report.authorAvatarDataUrl} name={report.authorName} size="md" />
          </Link>
        ) : (
          <UserAvatar src={report.authorAvatarDataUrl} name={report.authorName} size="md" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <MapPin size={18} className="mt-1 shrink-0 text-red-400" />
            <h2 className="min-w-0 break-words text-lg font-bold">{report.location || "Ohne Ortsangabe"}</h2>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            {authorHref ? (
              <Link href={authorHref} className="min-w-0 break-words font-bold text-slate-200 hover:text-blue-300">
                {report.authorName} <span className="font-normal text-slate-500">@{report.authorUsername}</span>
              </Link>
            ) : (
              <span className="min-w-0 break-words font-bold text-slate-200">{report.authorName}</span>
            )}
            <RoleBadge role={report.authorRole} />
          </div>
        </div>
      </div>

      {report.mentions?.includes(userData?.username || "") && (
        <div className="mb-3 rounded-2xl border border-blue-300/25 bg-blue-500/10 p-3 text-sm font-bold text-blue-100">
          @DuDu wurdest in dieser Meldung erwähnt.
        </div>
      )}

      {report.description && (
        <p className="overflow-wrap-anywhere whitespace-pre-line break-words text-slate-300">
          <MentionedText text={report.description} currentUsername={userData?.username} />
        </p>
      )}

      {report.imageDataUrl && (
        <button
          type="button"
          onClick={() => setImagePreviewOpen(true)}
          className="mt-4 block w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40 text-left transition hover:border-blue-400/50"
          aria-label="Beitragsfoto in voller Größe öffnen"
        >
          <img src={report.imageDataUrl} alt="Beitragsfoto" className="max-h-[420px] w-full object-cover" loading="lazy" />
          <span className="block px-3 py-2 text-xs font-bold text-slate-400">Zum Vergrößern antippen</span>
        </button>
      )}

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
        <div className={report.status === "expired" ? "flex items-center gap-2 text-slate-400" : "flex items-center gap-2 text-green-400"}>
          <ShieldCheck size={17} />
          {isEmergency ? "Eilmeldung" : statusText} · {confirmedBy.length}× bestätigt · {legacyOutdatedBy.length}× nicht mehr aktuell
        </div>
      </div>

      {banned && (
        <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm font-bold text-red-200">
          Dein Account ist gesperrt. Du kannst nur noch lesen.
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <button onClick={markConfirmed} disabled={banned || report.status === "expired"} className={`flex items-center justify-center gap-1 rounded-xl py-3 font-bold disabled:opacity-40 ${markedConfirmed ? "bg-green-600 text-white" : "bg-slate-800 text-slate-200"}`}>
          <CheckCircle2 size={16} /> {markedConfirmed ? "Bestätigt" : "Bestätigen"}
        </button>
        <button onClick={markOutdated} disabled={banned || report.status === "expired"} className={`rounded-xl py-3 font-bold disabled:opacity-40 ${markedOutdated || report.status === "expired" ? "bg-slate-600 text-white" : "bg-slate-800 text-slate-200"}`}>
          ⏱️ {report.status === "expired" ? "Nicht mehr aktuell" : markedOutdated ? "Gemeldet" : "Nicht mehr aktuell"}
        </button>
        <button onClick={() => setCommentsOpen((value) => !value)} className="flex items-center justify-center gap-1 rounded-xl bg-slate-800 py-3 text-slate-200">
          <MessageCircle size={16} /> {report.commentsCount ?? 0}
        </button>
        {getRouteUrl(report) ? (
          <a href={getRouteUrl(report)} target="_blank" className="flex items-center justify-center gap-1 rounded-xl bg-slate-800 py-3 text-slate-200">
            <Navigation size={16} /> Route
          </a>
        ) : (
          <button disabled className="flex items-center justify-center gap-1 rounded-xl bg-slate-800 py-3 text-slate-500 opacity-60">
            <Navigation size={16} /> Kein Ort
          </button>
        )}
      </div>

      {commentsOpen && (
        <div className="mt-4 space-y-3 rounded-2xl bg-slate-950/50 p-3">
          <h3 className="font-black">Kommentare</h3>
          {comments.length === 0 && <p className="text-sm text-slate-400">Noch keine Kommentare.</p>}
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-2xl bg-slate-900/80 p-3">
              <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
                {comment.authorUsername ? (
                  <Link href={`/u/${comment.authorUsername}`} className="shrink-0 rounded-full transition hover:scale-105" aria-label={`Profil von ${comment.authorName} öffnen`}>
                    <UserAvatar src={comment.authorAvatarDataUrl} name={comment.authorName} size="sm" />
                  </Link>
                ) : (
                  <UserAvatar src={comment.authorAvatarDataUrl} name={comment.authorName} size="sm" />
                )}
                <div className="min-w-0 flex flex-wrap items-center gap-2">
                  {comment.authorUsername ? (
                    <Link href={`/u/${comment.authorUsername}`} className="break-words font-bold text-slate-200 hover:text-blue-300">
                      {comment.authorName}
                    </Link>
                  ) : (
                    <span className="break-words font-bold text-slate-200">{comment.authorName}</span>
                  )}
                  <RoleBadge role={comment.authorRole} />
                  <span>{formatRelativeTime(comment.createdAt)}</span>
                </div>
              </div>
              {canModerate && (
                <button
                  type="button"
                  onClick={() => removeComment(comment)}
                  className="mb-2 rounded-xl bg-red-600/80 px-3 py-2 text-xs font-black text-white hover:bg-red-500"
                >
                  Kommentar löschen
                </button>
              )}
              {comment.mentions?.includes(userData?.username || "") && (
                <div className="mb-2 rounded-xl border border-blue-300/20 bg-blue-500/10 px-3 py-2 text-xs font-bold text-blue-100">
                  Du wurdest hier erwähnt.
                </div>
              )}
              <p className="overflow-wrap-anywhere whitespace-pre-line break-words text-sm text-slate-200">
                <MentionedText text={comment.text} currentUsername={userData?.username} />
              </p>
            </div>
          ))}

          {!canModerate && (
            <p className="rounded-2xl border border-white/10 bg-slate-900/80 p-3 text-sm text-slate-400">
              🔒 Kommentare können nur von Admins und Entwicklern geschrieben werden.
            </p>
          )}

          {!banned && user && canModerate && (
            <form onSubmit={sendComment} className="flex gap-2">
              <div className="min-w-0 flex-1">
                <MentionTextarea
                  value={commentText}
                  onChange={setCommentText}
                  rows={1}
                  className="min-h-[48px] w-full resize-none rounded-xl border border-white/10 bg-slate-950 p-3 text-sm outline-none focus:border-blue-500"
                  placeholder="Kommentar schreiben... @username"
                />
              </div>
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

    {imagePreviewOpen && report.imageDataUrl && (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
        onClick={() => setImagePreviewOpen(false)}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={() => setImagePreviewOpen(false)}
          className="absolute right-4 top-4 rounded-full bg-white/10 px-4 py-2 text-2xl font-black text-white backdrop-blur hover:bg-white/20"
          aria-label="Bild schließen"
        >
          ×
        </button>
        <img
          src={report.imageDataUrl}
          alt="Beitragsfoto in voller Größe"
          className="max-h-[90vh] max-w-full rounded-2xl object-contain shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        />
      </div>
    )}
    </>
  );
}
