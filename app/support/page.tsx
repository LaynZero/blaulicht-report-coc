"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  Bug,
  ChevronRight,
  LifeBuoy,
  Lightbulb,
  MessageCircle,
  Send,
  Shield,
  Sparkles,
} from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleBadge from "@/components/ui/RoleBadge";
import { useAuth } from "@/app/context/AuthContext";
import { db } from "@/app/firebase";
import { formatRelativeTime } from "@/lib/helpers";
import type {
  SupportCategory,
  SupportMessage,
  SupportTarget,
  SupportTicket,
} from "@/lib/types";

const categoryLabels: Record<SupportCategory, string> = {
  question: "Allgemeine Frage",
  report_problem: "Problem mit Meldung/User",
  bug: "Fehler in der App",
  feedback: "Feedback",
  feature: "Verbesserung / neue Funktion",
  other: "Sonstiges",
};

function targetInfo(target: SupportTarget) {
  if (target === "admin") {
    return {
      title: "Admin-Support",
      label: "Admins kontaktieren",
      icon: Shield,
      gradient: "from-blue-500/20 to-cyan-500/10",
      text: "Fragen zu Meldungen, Regeln, gelöschten Beiträgen oder Moderation.",
    };
  }

  return {
    title: "IT-Span Support",
    label: "Entwickler kontaktieren",
    icon: Sparkles,
    gradient: "from-violet-500/20 to-fuchsia-500/10",
    text: "Feedback, Bugs, Verbesserungsvorschläge und Wünsche für neue Funktionen.",
  };
}

function TicketMessages({ ticket }: { ticket: SupportTicket }) {
  const { userData } = useAuth();
  const [messages, setMessages] = useState<SupportMessage[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "supportTickets", ticket.id, "messages"),
      orderBy("createdAt", "asc"),
      limit(100),
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(
        snap.docs.map(
          (item) =>
            ({
              id: item.id,
              ticketId: ticket.id,
              ...item.data(),
            }) as SupportMessage,
        ),
      );
    });
    return () => unsub();
  }, [ticket.id]);

  return (
    <div className="mt-3 space-y-3 rounded-3xl bg-slate-950/60 p-4">
      {messages.length === 0 && (
        <p className="text-sm text-slate-400">Noch keine Nachrichten.</p>
      )}
      {messages.map((message) => {
        const own = message.authorId === userData?.uid;
        return (
          <div
            key={message.id}
            className={`flex ${own ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-3xl p-3 ${own ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-100"}`}
            >
              <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] opacity-80">
                <b>{message.authorName}</b>
                <RoleBadge role={message.authorRole} />
                <span>{formatRelativeTime(message.createdAt)}</span>
              </div>
              <p className="overflow-wrap-anywhere whitespace-pre-line break-words text-sm leading-relaxed">
                {message.text}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SupportPage() {
  const { user, userData } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [target, setTarget] = useState<SupportTarget>("admin");
  const [category, setCategory] = useState<SupportCategory>("question");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [creating, setCreating] = useState(false);
  const [replying, setReplying] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);

  function startQuickRequest(nextCategory: SupportCategory, subjectPrefix: string) {
    setTarget("developer");
    setCategory(nextCategory);
    if (!subject.trim()) setSubject(subjectPrefix);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      const input = subjectRef.current;
      if (!input) return;
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }, 300);
  }

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "supportTickets"),
      where("createdBy", "==", user.uid),
      limit(25),
    );
    const unsub = onSnapshot(q, (snap) => {
      const next = snap.docs
        .map((item) => ({ id: item.id, ...item.data() }) as SupportTicket)
        .filter((ticket) => ticket.status !== "closed")
        .sort(
          (a, b) =>
            Number((b.updatedAt as { seconds?: number })?.seconds ?? 0) -
            Number((a.updatedAt as { seconds?: number })?.seconds ?? 0),
        );
      setTickets(next);
      setSelectedTicketId((current) => current || next[0]?.id || "");
    });
    return () => unsub();
  }, [user]);

  const selectedTicket = useMemo(
    () => tickets.find((item) => item.id === selectedTicketId) ?? tickets[0],
    [tickets, selectedTicketId],
  );
  const selectedTarget = targetInfo(target);
  const TargetIcon = selectedTarget.icon;
  const banned = userData?.banned === true;

  async function createTicket(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !userData) return alert("Bitte erst einloggen.");
    if (banned)
      return alert(
        "Dein Account ist gesperrt. Du kannst aktuell keine Support-Anfragen erstellen.",
      );

    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();
    if (cleanSubject.length < 2)
      return alert("Bitte gib einen kurzen Betreff ein.");
    if (cleanMessage.length < 1) return alert("Bitte gib eine Nachricht ein.");

    setCreating(true);
    try {
      const payload = {
        target,
        category,
        subject: cleanSubject,
        initialMessage: cleanMessage,
        status: "open",
        createdBy: user.uid,
        createdByName: userData.displayName,
        createdByRole: userData.role,
        assignedLabel: target === "admin" ? "Admin-Support" : "IT-Span Support",
        lastMessage: cleanMessage,
        lastMessageBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
      };
      const ticketRef = await addDoc(collection(db, "supportTickets"), payload);
      await addDoc(collection(db, "supportTickets", ticketRef.id, "messages"), {
        text: cleanMessage,
        authorId: user.uid,
        authorName: userData.displayName,
        authorRole: userData.role,
        createdAt: serverTimestamp(),
      });
      setSubject("");
      setMessage("");
      setSelectedTicketId(ticketRef.id);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Support-Anfrage konnte nicht erstellt werden.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function sendReply(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !userData || !selectedTicket) return;
    if (banned)
      return alert("Dein Account ist gesperrt. Du kannst nicht antworten.");
    const text = reply.trim();
    if (text.length < 1) return;

    setReplying(true);
    try {
      await addDoc(
        collection(db, "supportTickets", selectedTicket.id, "messages"),
        {
          text,
          authorId: user.uid,
          authorName: userData.displayName,
          authorRole: userData.role,
          createdAt: serverTimestamp(),
        },
      );
      await updateDoc(doc(db, "supportTickets", selectedTicket.id), {
        lastMessage: text,
        lastMessageBy: user.uid,
        status: "open",
        updatedAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
      });
      setReply("");
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Antwort konnte nicht gesendet werden.",
      );
    } finally {
      setReplying(false);
    }
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-slate-950 px-5 pb-28 pt-8 text-white">
        <section className="mx-auto max-w-md space-y-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">
              Hilfe & Kontakt
            </p>
            <h1 className="mt-1 text-4xl font-black tracking-tight">Support</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Stelle Fragen an die Admins oder sende Feedback und
              Verbesserungsvorschläge direkt an IT-Span.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(["admin", "developer"] as SupportTarget[]).map((item) => {
              const info = targetInfo(item);
              const Icon = info.icon;
              const active = target === item;
              return (
                <button
                  key={item}
                  onClick={() => setTarget(item)}
                  className={`rounded-3xl border p-4 text-left transition ${active ? "border-blue-400 bg-blue-500/15" : "border-white/10 bg-slate-900/70 hover:border-white/20"}`}
                >
                  <Icon
                    className={active ? "text-blue-300" : "text-slate-400"}
                  />
                  <p className="mt-3 text-sm font-black">{info.title}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                    {info.text}
                  </p>
                </button>
              );
            })}
          </div>

          {banned && (
            <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-bold text-red-200">
              Dein Account ist gesperrt. Du kannst vorhandene Support-Tickets
              lesen, aber keine neuen Anfragen erstellen.
            </div>
          )}

          <form
            ref={formRef}
            onSubmit={createTicket}
            className={`glass-card rounded-[2rem] bg-gradient-to-br ${selectedTarget.gradient} p-5`}
          >
            <div className="mb-4 flex items-start gap-3">
              <div className="rounded-2xl bg-slate-950/70 p-3">
                <TargetIcon className="text-blue-300" />
              </div>
              <div>
                <h2 className="text-xl font-black">Neue Anfrage</h2>
                <p className="text-sm text-slate-400">
                  an {selectedTarget.title}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SupportCategory)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm font-bold outline-none focus:border-blue-500"
              >
                {(Object.keys(categoryLabels) as SupportCategory[]).map(
                  (item) => (
                    <option key={item} value={item}>
                      {categoryLabels[item]}
                    </option>
                  ),
                )}
              </select>
              <input
                ref={subjectRef}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Betreff, z. B. Push funktioniert nicht"
                className="w-full rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm outline-none focus:border-blue-500"
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Nachricht schreiben..."
                rows={4}
                className="w-full resize-none rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm outline-none focus:border-blue-500"
              />
              <button
                disabled={creating || banned}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-sm font-black shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={17} /> Anfrage senden
              </button>
            </div>
          </form>

          <div className="glass-card rounded-[2rem] p-5">
            <div className="mb-4 flex items-center gap-3">
              <MessageCircle className="text-blue-300" />
              <div>
                <h2 className="text-xl font-black">Meine Unterhaltungen</h2>
                <p className="text-xs text-slate-400">
                  Antworten von Admins und Entwicklern erscheinen hier.
                </p>
              </div>
            </div>

            {tickets.length === 0 ? (
              <p className="rounded-2xl bg-slate-950/60 p-4 text-sm text-slate-400">
                Noch keine Support-Anfragen vorhanden.
              </p>
            ) : (
              <>
                <select
                  value={selectedTicket?.id ?? ""}
                  onChange={(e) => setSelectedTicketId(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm font-bold outline-none focus:border-blue-500"
                >
                  {tickets.map((ticket) => (
                    <option key={ticket.id} value={ticket.id}>
                      {ticket.assignedLabel} · {ticket.subject}
                    </option>
                  ))}
                </select>

                {selectedTicket && (
                  <div className="mt-4 rounded-3xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
                          {selectedTicket.assignedLabel}
                        </p>
                        <h3 className="mt-1 break-words text-lg font-black">
                          {selectedTicket.subject}
                        </h3>
                        <p className="mt-1 text-xs text-slate-400">
                          {categoryLabels[selectedTicket.category]} ·{" "}
                          {formatRelativeTime(selectedTicket.updatedAt)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-black ${selectedTicket.status === "closed" ? "bg-slate-700 text-slate-300" : selectedTicket.status === "answered" ? "bg-green-500/15 text-green-300" : "bg-yellow-500/15 text-yellow-300"}`}
                      >
                        {selectedTicket.status === "closed"
                          ? "Geschlossen"
                          : selectedTicket.status === "answered"
                            ? "Beantwortet"
                            : "Offen"}
                      </span>
                    </div>
                    <TicketMessages ticket={selectedTicket} />
                    {selectedTicket.status !== "closed" && !banned && (
                      <form onSubmit={sendReply} className="mt-3 flex gap-2">
                        <input
                          value={reply}
                          onChange={(e) => setReply(e.target.value)}
                          placeholder="Antwort schreiben..."
                          className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-950 p-3 text-sm outline-none focus:border-blue-500"
                        />
                        <button
                          disabled={replying}
                          className="rounded-2xl bg-blue-600 px-4 text-sm font-black disabled:opacity-60"
                        >
                          Senden
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="grid gap-3">
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
              <div className="flex items-center gap-3">
                <LifeBuoy className="text-blue-300" />
                <b>FAQ</b>
              </div>
              <div className="mt-3 space-y-2 text-sm text-slate-300">
                <details className="group rounded-2xl bg-slate-950/50 p-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-bold">
                    Wie melde ich einen Blitzer oder AVK?{" "}
                    <ChevronRight
                      className="transition group-open:rotate-90"
                      size={16}
                    />
                  </summary>
                  <p className="mt-2 text-slate-400">
                    Tippe unten auf das Plus, wähle die passende Kategorie und
                    schreibe kurz, was los ist. Auch kurze Hinweise wie „AVK“
                    oder „Blitzer B49“ reichen aus.
                  </p>
                </details>
                <details className="group rounded-2xl bg-slate-950/50 p-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-bold">
                    Wofür ist Admin-Support?{" "}
                    <ChevronRight
                      className="transition group-open:rotate-90"
                      size={16}
                    />
                  </summary>
                  <p className="mt-2 text-slate-400">
                    Für Fragen zu Regeln, gelöschten Beiträgen, Sperren,
                    falschen Meldungen oder Problemen mit anderen Nutzern.
                  </p>
                </details>
                <details className="group rounded-2xl bg-slate-950/50 p-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-bold">
                    Wofür ist IT-Span Support?{" "}
                    <ChevronRight
                      className="transition group-open:rotate-90"
                      size={16}
                    />
                  </summary>
                  <p className="mt-2 text-slate-400">
                    Für Bugs, technische Probleme, Push-Benachrichtigungen,
                    Feedback und neue Funktionswünsche.
                  </p>
                </details>
                <details className="group rounded-2xl bg-slate-950/50 p-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-bold">
                    Was passiert mit geschlossenen Tickets?{" "}
                    <ChevronRight
                      className="transition group-open:rotate-90"
                      size={16}
                    />
                  </summary>
                  <p className="mt-2 text-slate-400">
                    Geschlossene Tickets werden entfernt, damit Firestore
                    schlank bleibt und die App auch bei vielen Nutzern schnell
                    bleibt.
                  </p>
                </details>
                <details className="group rounded-2xl bg-slate-950/50 p-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-bold">
                    Warum wurde mein Beitrag gelöscht?{" "}
                    <ChevronRight
                      className="transition group-open:rotate-90"
                      size={16}
                    />
                  </summary>
                  <p className="mt-2 text-slate-400">
                    Beiträge können gelöscht werden, wenn sie falsch, doppelt,
                    beleidigend oder datenschutzkritisch sind. Frage dazu
                    einfach den Admin-Support.
                  </p>
                </details>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => startQuickRequest("bug", "Bug: ")}
                className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 text-left transition hover:border-red-400/40 hover:bg-red-500/10"
              >
                <Bug className="mb-2 text-red-300" />
                <p className="text-sm font-black">Bug melden</p>
                <p className="mt-1 text-xs text-slate-400">an IT-Span</p>
              </button>
              <button
                type="button"
                onClick={() => startQuickRequest("feature", "Idee: ")}
                className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 text-left transition hover:border-yellow-400/40 hover:bg-yellow-500/10"
              >
                <Lightbulb className="mb-2 text-yellow-300" />
                <p className="text-sm font-black">Idee senden</p>
                <p className="mt-1 text-xs text-slate-400">neue Features</p>
              </button>
            </div>
          </div>
        </section>
        <BottomNavigation />
      </main>
    </ProtectedRoute>
  );
}
