"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDocs,
  endAt,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAt,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import BottomNavigation from "@/components/BottomNavigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleBadge from "@/components/ui/RoleBadge";
import UserAvatar from "@/components/ui/UserAvatar";
import { useAuth } from "@/app/context/AuthContext";
import { auth, db } from "@/app/firebase";
import type {
  AppUser,
  CrashLog,
  Report,
  ReportComment,
  SupportMessage,
  SupportTicket,
  UserRole,
  AppSettings,
} from "@/lib/types";
import {
  Ban,
  BarChart3,
  Flag,
  MessageCircle,
  Search,
  Send,
  Shield,
  Trash2,
  UserCog,
  Activity,
  Eye,
  Users,
  Wrench,
  Save,
} from "lucide-react";

const defaultAppSettings: AppSettings = {
  maintenanceMode: false,
  allowAdminsDuringMaintenance: true,
  maintenanceMessage: "Wir führen gerade Wartungsarbeiten durch. Bitte versuche es gleich noch einmal.",
};

function SupportTicketPanel({ ticket }: { ticket: SupportTicket }) {
  const { user, userData } = useAuth();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "supportTickets", ticket.id, "messages"),
      orderBy("createdAt", "asc"),
      limit(80),
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

  async function answerTicket(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !userData) return;
    const text = reply.trim();
    if (text.length < 1) return;

    setSending(true);
    try {
      await addDoc(collection(db, "supportTickets", ticket.id, "messages"), {
        text,
        authorId: user.uid,
        authorName: userData.displayName,
        authorRole: userData.role,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "supportTickets", ticket.id), {
        lastMessage: text,
        lastMessageBy: user.uid,
        status: "answered",
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
      setSending(false);
    }
  }

  async function closeTicket() {
    if (
      !confirm(
        "Ticket wirklich schließen und endgültig löschen? Dadurch werden Ticket und Chatverlauf aus Firestore entfernt.",
      )
    )
      return;

    try {
      const messagesSnap = await getDocs(
        collection(db, "supportTickets", ticket.id, "messages"),
      );
      const batch = writeBatch(db);
      messagesSnap.docs.forEach((messageDoc) => batch.delete(messageDoc.ref));
      batch.delete(doc(db, "supportTickets", ticket.id));
      await batch.commit();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Ticket konnte nicht gelöscht werden.",
      );
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
            {ticket.assignedLabel}
          </p>
          <h3 className="mt-1 break-words text-lg font-black">
            {ticket.subject}
          </h3>
          <p className="mt-1 break-words text-sm text-slate-400">
            von {ticket.createdByName} · {ticket.status}
          </p>
        </div>
        <button
          onClick={closeTicket}
          className="rounded-2xl bg-red-600/80 px-4 py-2 text-xs font-black text-white hover:bg-red-500"
        >
          Schließen & löschen
        </button>
      </div>

      <div className="mt-3 max-h-72 space-y-2 overflow-y-auto rounded-2xl bg-slate-950/80 p-3">
        {messages.map((message) => {
          const own = message.authorId === user?.uid;
          return (
            <div
              key={message.id}
              className={`flex ${own ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3 ${own ? "bg-blue-600" : "bg-slate-800"}`}
              >
                <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
                  <b>{message.authorName}</b>
                  <RoleBadge role={message.authorRole} />
                </div>
                <p className="overflow-wrap-anywhere whitespace-pre-line break-words text-sm">
                  {message.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {ticket.status !== "closed" && (
        <form onSubmit={answerTicket} className="mt-3 flex gap-2">
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Antwort schreiben..."
            className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-950 p-3 text-sm outline-none focus:border-blue-500"
          />
          <button
            disabled={sending}
            className="flex items-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black disabled:opacity-60"
          >
            <Send size={16} /> Senden
          </button>
        </form>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { userData } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [crashLogs, setCrashLogs] = useState<CrashLog[]>([]);
  const [selectedReports, setSelectedReports] = useState<Report[]>([]);
  const [selectedComments, setSelectedComments] = useState<ReportComment[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUid, setSelectedUid] = useState("");
  const [showAllUserActivity, setShowAllUserActivity] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>(defaultAppSettings);
  const [savingSettings, setSavingSettings] = useState(false);

  const cleanSearch = userSearch.trim().toLowerCase().replace(/^@/, "");

  useEffect(() => {
    const usersQuery = cleanSearch
      ? query(
          collection(db, "users"),
          orderBy("username"),
          startAt(cleanSearch),
          endAt(`${cleanSearch}\uf8ff`),
          limit(25),
        )
      : query(collection(db, "users"), orderBy("createdAt", "desc"), limit(25));

    const unsubUsers = onSnapshot(usersQuery, (snap) => {
      const nextUsers = snap.docs.map((item) => item.data() as AppUser);
      setUsers(nextUsers);
      setSelectedUid((current) => {
        if (current && nextUsers.some((item) => item.uid === current)) return current;
        return nextUsers[0]?.uid || "";
      });
    });

    return () => unsubUsers();
  }, [cleanSearch]);

  useEffect(() => {
    const unsubReports = onSnapshot(
      query(
        collection(db, "reports"),
        orderBy("createdAt", "desc"),
        limit(100),
      ),
      (snap) => {
        setReports(
          snap.docs.map((item) => ({ id: item.id, ...item.data() }) as Report),
        );
      },
    );
    return () => unsubReports();
  }, []);

  useEffect(() => {
    if (!userData) return;
    const targetQuery =
      userData.role === "developer"
        ? query(
            collection(db, "supportTickets"),
            orderBy("updatedAt", "desc"),
            limit(30),
          )
        : query(
            collection(db, "supportTickets"),
            where("target", "==", "admin"),
            limit(30),
          );

    const unsubTickets = onSnapshot(targetQuery, (snap) => {
      setTickets(
        snap.docs
          .map((item) => ({ id: item.id, ...item.data() }) as SupportTicket)
          .sort(
            (a, b) =>
              Number((b.updatedAt as { seconds?: number })?.seconds ?? 0) -
              Number((a.updatedAt as { seconds?: number })?.seconds ?? 0),
          ),
      );
    });
    return () => unsubTickets();
  }, [userData]);


  useEffect(() => {
    if (userData?.role !== "developer") return;
    const unsubCrashLogs = onSnapshot(
      query(collection(db, "crashLogs"), orderBy("createdAt", "desc"), limit(25)),
      (snap) => setCrashLogs(snap.docs.map((item) => ({ id: item.id, ...item.data() }) as CrashLog)),
    );
    return () => unsubCrashLogs();
  }, [userData?.role]);

  useEffect(() => {
    if (userData?.role !== "developer") return;
    const unsubSettings = onSnapshot(doc(db, "appSettings", "main"), (snap) => {
      setAppSettings(snap.exists() ? ({ ...defaultAppSettings, ...snap.data() } as AppSettings) : defaultAppSettings);
    });
    return () => unsubSettings();
  }, [userData?.role]);

  useEffect(() => {
    setSelectedReports([]);
    setSelectedComments([]);
    if (!selectedUid) return;

    const activityLimit = showAllUserActivity ? 500 : 20;
    const targetUid = selectedUid;
    let active = true;

    const unsubUserReports = onSnapshot(
      query(collection(db, "reports"), where("authorId", "==", targetUid), limit(activityLimit)),
      (snap) => {
        if (!active) return;
        const nextReports = snap.docs.map((item) => ({ id: item.id, ...item.data() }) as Report);
        nextReports.sort((a, b) => Number((b.createdAt as { seconds?: number })?.seconds ?? 0) - Number((a.createdAt as { seconds?: number })?.seconds ?? 0));
        setSelectedReports(nextReports);
      },
    );

    const unsubUserComments = onSnapshot(
      query(collectionGroup(db, "comments"), where("authorId", "==", targetUid), limit(activityLimit)),
      (snap) => {
        if (!active) return;
        const nextComments = snap.docs.map((item) => ({ id: item.id, ...item.data() }) as ReportComment);
        nextComments.sort((a, b) => Number((b.createdAt as { seconds?: number })?.seconds ?? 0) - Number((a.createdAt as { seconds?: number })?.seconds ?? 0));
        setSelectedComments(nextComments);
      },
    );

    return () => {
      active = false;
      unsubUserReports();
      unsubUserComments();
    };
  }, [selectedUid, showAllUserActivity]);

  const selectedUser = useMemo(
    () => users.find((item) => item.uid === selectedUid),
    [selectedUid, users],
  );
  const flaggedReports = useMemo(
    () => reports.filter((report) => (report.reports ?? []).length > 0),
    [reports],
  );
  const canManageRoles = userData?.role === "admin" || userData?.role === "developer";
  const isDeveloperMode = userData?.role === "developer";
  const todayReports = reports.filter((report) => Number((report.createdAt as { seconds?: number })?.seconds ?? 0) * 1000 > Date.now() - 86400000).length;
  const emergencyReports = reports.filter((report) => report.emergency).length;
  const totalCommentsLoaded = reports.reduce((sum, report) => sum + (report.commentsCount ?? 0), 0);

  async function saveMaintenanceSettings(nextSettings = appSettings) {
    if (userData?.role !== "developer") return alert("Nur Entwickler dürfen den Wartungsmodus ändern.");
    setSavingSettings(true);
    try {
      await setDoc(
        doc(db, "appSettings", "main"),
        {
          maintenanceMode: nextSettings.maintenanceMode === true,
          allowAdminsDuringMaintenance: nextSettings.allowAdminsDuringMaintenance !== false,
          maintenanceMessage: (nextSettings.maintenanceMessage || defaultAppSettings.maintenanceMessage || "").trim(),
          updatedAt: serverTimestamp(),
          updatedBy: userData.uid,
        },
        { merge: true },
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Wartungsmodus konnte nicht gespeichert werden.");
    } finally {
      setSavingSettings(false);
    }
  }

  function buildAdminUserApiUrl(uid?: string) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return uid ? `${origin}/api/admin/users/${encodeURIComponent(uid)}` : `${origin}/api/admin/user-action`;
  }

  async function readApiResult(response: Response) {
    const contentType = response.headers.get("content-type") || "";
    const text = await response.text();

    if (contentType.includes("application/json")) {
      try {
        return JSON.parse(text) as { ok?: boolean; message?: string };
      } catch {
        return { ok: false, message: "Die JSON-Antwort konnte nicht gelesen werden." };
      }
    }

    const cleanText = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 220);
    return {
      ok: false,
      message: response.ok
        ? "Die Server-Antwort konnte nicht gelesen werden."
        : `Serverfehler ${response.status}: ${cleanText || "API-Route nicht erreichbar oder nicht korrekt geladen."}`,
    };
  }

  async function callAdminUserAction(payload: { action: "setRole" | "deleteUser"; uid: string; role?: UserRole }) {
    const token = await auth.currentUser?.getIdToken(true);
    if (!token) throw new Error("Du bist nicht angemeldet.");

    const response = await fetch(buildAdminUserApiUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const result = await readApiResult(response);
    if (!response.ok || !result.ok) {
      throw new Error(result.message || "Admin-Aktion konnte nicht ausgeführt werden.");
    }

    return result;
  }

  async function callLegacyAdminUserApi(uid: string, role?: UserRole) {
    const token = await auth.currentUser?.getIdToken(true);
    if (!token) throw new Error("Du bist nicht angemeldet.");

    const response = await fetch(buildAdminUserApiUrl(uid), {
      method: role ? "PATCH" : "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: role ? JSON.stringify({ role }) : undefined,
      cache: "no-store",
    });

    const result = await readApiResult(response);
    if (!response.ok || !result.ok) {
      throw new Error(result.message || "Admin-Aktion konnte nicht ausgeführt werden.");
    }

    return result;
  }

  async function setRole(uid: string, role: UserRole) {
    if (!canManageRoles) return alert("Nur Admins und Entwickler dürfen Rollen ändern.");

    try {
      try {
        await callAdminUserAction({ action: "setRole", uid, role });
      } catch (apiError) {
        console.warn("Neue Admin-API fehlgeschlagen, versuche Fallback-Route.", apiError);
        try {
          await callLegacyAdminUserApi(uid, role);
        } catch (legacyError) {
          console.warn("Fallback-API fehlgeschlagen, versuche Firestore-Regel-Fallback.", legacyError);
          await updateDoc(doc(db, "users", uid), { role });
        }
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Rolle konnte nicht geändert werden.");
    }
  }
  async function toggleBan(appUser: AppUser) {
    if (appUser.role === "developer")
      return alert("Entwickler können nicht gesperrt werden.");
    await updateDoc(doc(db, "users", appUser.uid), { banned: !appUser.banned });
  }

  async function deleteUserAccount(appUser: AppUser) {
    if (appUser.role === "developer") {
      return alert("Entwickler können nicht gelöscht werden.");
    }

    if (appUser.role === "admin") {
      return alert("Admins können nicht direkt gelöscht werden. Entziehe zuerst die Admin-Rolle.");
    }

    if (!confirm(`Nutzer @${appUser.username} wirklich löschen? Beiträge, Kommentare, Push-Tokens und der Login-Account werden entfernt.`)) {
      return;
    }

    try {
      try {
        await callAdminUserAction({ action: "deleteUser", uid: appUser.uid });
      } catch (apiError) {
        console.warn("Neue Lösch-API fehlgeschlagen, versuche Fallback-Route.", apiError);
        try {
          await callLegacyAdminUserApi(appUser.uid);
        } catch (legacyError) {
          console.warn("Fallback-Lösch-API fehlgeschlagen, lösche App-Daten direkt über Firestore-Regeln.", legacyError);

          const batch = writeBatch(db);
          batch.delete(doc(db, "users", appUser.uid));
          if (appUser.username) batch.delete(doc(db, "usernames", appUser.username));
          await batch.commit();
        }
      }

      setSelectedUid("");
      setSelectedReports([]);
      setSelectedComments([]);
      alert("Nutzer wurde gelöscht.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Nutzer konnte nicht gelöscht werden.");
    }
  }

  async function deleteReport(reportId: string) {
    if (confirm("Meldung löschen?"))
      await deleteDoc(doc(db, "reports", reportId));
  }

  return (
    <ProtectedRoute roles={["admin", "developer"]}>
      <main className="min-h-screen px-5 pb-28 pt-8 text-white">
        <section className="mx-auto max-w-5xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">
                Adminbereich
              </p>
              <h1 className="text-4xl font-black tracking-tight">Dashboard</h1>
              <p className="mt-2 max-w-xl text-sm text-slate-400">
                Nutzer werden nicht mehr alle auf einmal angezeigt. Suche nach
                @Benutzername und bearbeite dann gezielt einen Account.
              </p>
            </div>
            <div className="rounded-3xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-200">
              {isDeveloperMode ? "💻 Entwickler-Modus" : "🛡️ Admin-Modus"}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="glass-card rounded-3xl p-4">
              <Users className="mb-3 text-blue-400" />
              <p className="text-2xl font-black">{users.length}</p>
              <p className="text-sm text-slate-400">geladene Nutzer</p>
            </div>
            <div className="glass-card rounded-3xl p-4">
              <Shield className="mb-3 text-green-400" />
              <p className="text-2xl font-black">{reports.length}</p>
              <p className="text-sm text-slate-400">letzte Meldungen</p>
            </div>
            <div className="glass-card rounded-3xl p-4">
              <Flag className="mb-3 text-yellow-400" />
              <p className="text-2xl font-black">{flaggedReports.length}</p>
              <p className="text-sm text-slate-400">gemeldet</p>
            </div>
            <div className="glass-card rounded-3xl p-4">
              <MessageCircle className="mb-3 text-violet-400" />
              <p className="text-2xl font-black">
                {tickets.filter((ticket) => ticket.status !== "closed").length}
              </p>
              <p className="text-sm text-slate-400">offene Tickets</p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
            <div className="glass-card rounded-3xl p-5">
              <div className="mb-4 flex items-center gap-3">
                <UserCog className="text-blue-400" />
                <div>
                  <h2 className="text-xl font-black">Nutzer suchen</h2>
                  <p className="text-xs text-slate-400">
                    max. 25 Treffer pro Suche
                  </p>
                </div>
              </div>

              <label className="relative block">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  size={18}
                />
                <input
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setSelectedUid("");
                    setShowAllUserActivity(false);
                    setSelectedReports([]);
                    setSelectedComments([]);
                  }}
                  placeholder="@benutzername suchen..."
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 py-4 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500"
                />
              </label>

              <select
                value={selectedUid}
                onChange={(e) => {
                  setSelectedUid(e.target.value);
                  setShowAllUserActivity(false);
                  setSelectedReports([]);
                  setSelectedComments([]);
                }}
                className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm font-bold outline-none focus:border-blue-500"
              >
                {users.length === 0 && (
                  <option value="">Keine Nutzer gefunden</option>
                )}
                {users.map((appUser) => (
                  <option key={appUser.uid} value={appUser.uid}>
                    @{appUser.username} · {appUser.displayName}
                  </option>
                ))}
              </select>

              <div className="mt-4 rounded-2xl bg-slate-950/70 p-4 text-xs leading-relaxed text-slate-400">
                Tipp: Für 10.000+ Nutzer ist Suche besser als eine riesige
                Liste. Die Seite lädt dadurch schneller und bleibt
                übersichtlich.
              </div>
            </div>

            <div className="glass-card rounded-3xl p-5">
              <h2 className="mb-4 text-xl font-black">👥 Nutzerverwaltung</h2>
              <p className="mb-4 rounded-2xl border border-blue-400/15 bg-blue-500/10 p-3 text-xs leading-relaxed text-blue-100">Admins können User zu Admins machen und Admin-Rechte wieder entfernen. Entwickler sind geschützt. Admins müssen vor dem Löschen zuerst wieder zu normalen Usern gemacht werden.</p>
              {!selectedUser ? (
                <p className="rounded-2xl bg-slate-950/60 p-4 text-sm text-slate-400">
                  Suche einen Nutzer oder wähle einen Treffer aus.
                </p>
              ) : (
                <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <UserAvatar src={selectedUser.avatarDataUrl} name={selectedUser.displayName} size="lg" />
                      <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="break-words text-2xl font-black">
                          {selectedUser.displayName}
                        </p>
                        <RoleBadge role={selectedUser.role} />
                      </div>
                      <p className="mt-1 break-all text-sm text-slate-400">
                        @{selectedUser.username}
                      </p>
                      <p className="mt-1 break-all text-xs text-slate-500">
                        {selectedUser.email}
                      </p>
                    </div>
                    </div>
                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-black ${selectedUser.banned ? "bg-red-500/15 text-red-300" : "bg-green-500/15 text-green-300"}`}
                    >
                      {selectedUser.banned ? "Gesperrt" : "Aktiv"}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-900 p-4">
                      <p className="text-2xl font-black">
                        {selectedUser.reportsCount ?? 0}
                      </p>
                      <p className="text-xs text-slate-400">Beiträge</p>
                    </div>
                    <div className="rounded-2xl bg-slate-900 p-4">
                      <p className="text-2xl font-black">
                        {selectedUser.commentsCount ?? 0}
                      </p>
                      <p className="text-xs text-slate-400">Kommentare</p>
                    </div>
                    <div className="rounded-2xl bg-slate-900 p-4">
                      <p className="text-2xl font-black">
                        {selectedUser.trustPoints ?? 0}
                      </p>
                      <p className="text-xs text-slate-400">Trust</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <button
                      disabled={selectedUser.role === "developer"}
                      onClick={() => toggleBan(selectedUser)}
                      className="rounded-2xl bg-red-600 py-4 text-sm font-black transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                    >
                      {selectedUser.role === "developer"
                        ? "Entwickler geschützt"
                        : selectedUser.banned
                          ? "Nutzer entsperren"
                          : "Nutzer sperren"}
                    </button>
                    <select
                      disabled={!canManageRoles || selectedUser.role === "developer"}
                      value={selectedUser.role}
                      onChange={(e) =>
                        setRole(selectedUser.uid, e.target.value as UserRole)
                      }
                      className="rounded-2xl border border-white/10 bg-slate-900 p-4 text-sm font-black outline-none disabled:opacity-40"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      {isDeveloperMode && <option value="developer">Entwickler</option>}
                    </select>
                    <button
                      disabled={selectedUser.role !== "user"}
                      onClick={() => deleteUserAccount(selectedUser)}
                      className="rounded-2xl border border-red-400/30 bg-red-500/10 py-4 text-sm font-black text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500"
                      title={
                        selectedUser.role === "admin"
                          ? "Erst Admin-Rolle entziehen"
                          : selectedUser.role === "developer"
                            ? "Entwickler geschützt"
                            : "Nutzer löschen"
                      }
                    >
                      {selectedUser.role === "admin"
                        ? "Erst Admin entziehen"
                        : selectedUser.role === "developer"
                          ? "Geschützt"
                          : "Nutzer löschen"}
                    </button>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-black">Aktivität des Nutzers</p>
                      <p className="text-xs text-slate-400">{showAllUserActivity ? "Bis zu 500 Beiträge und Kommentare werden geladen." : "Es werden nur die letzten 20 Beiträge und Kommentare geladen."}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedReports([]);
                        setSelectedComments([]);
                        setShowAllUserActivity((value) => !value);
                      }}
                      className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-500"
                    >
                      {showAllUserActivity ? "Nur letzte anzeigen" : "Alle anzeigen"}
                    </button>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl bg-slate-900 p-4">
                      <h3 className="mb-3 flex items-center gap-2 font-black"><Eye size={16} /> {showAllUserActivity ? "Beiträge" : "Letzte Beiträge"} <span className="text-xs text-slate-500">({selectedReports.length})</span></h3>
                      <div className="max-h-72 space-y-2 overflow-y-auto">
                        {selectedReports.length === 0 && <p className="text-sm text-slate-500">Keine Beiträge gefunden.</p>}
                        {selectedReports.map((report) => (
                          <div key={report.id} className="rounded-xl bg-slate-950/70 p-3">
                            <p className="text-xs font-bold text-blue-300">{report.emergency ? "🚨 Eilmeldung" : report.category} · {report.location || "Ohne Ort"}</p>
                            <p className="mt-1 line-clamp-3 break-words text-sm text-slate-300">{report.description || "Audio/Bild-Beitrag"}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-900 p-4">
                      <h3 className="mb-3 flex items-center gap-2 font-black"><MessageCircle size={16} /> {showAllUserActivity ? "Kommentare" : "Letzte Kommentare"} <span className="text-xs text-slate-500">({selectedComments.length})</span></h3>
                      <div className="max-h-72 space-y-2 overflow-y-auto">
                        {selectedComments.length === 0 && <p className="text-sm text-slate-500">Keine Kommentare gefunden.</p>}
                        {selectedComments.map((comment) => (
                          <div key={comment.id} className="rounded-xl bg-slate-950/70 p-3">
                            <p className="line-clamp-4 break-words text-sm text-slate-300">{comment.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {userData?.role === "developer" && (
            <div className="mt-6 glass-card rounded-3xl p-5">
              <div className="mb-4 flex items-center gap-3">
                <Wrench className="text-amber-300" />
                <div>
                  <h2 className="text-xl font-black">Wartungsmodus</h2>
                  <p className="text-sm text-slate-400">Nur Entwickler können die App in Wartung setzen. Entwickler dürfen immer weiterarbeiten.</p>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <div>
                    <p className="font-black">Wartungsmodus aktivieren</p>
                    <p className="mt-1 text-xs text-slate-400">Normale Nutzer sehen dann nur noch die Wartungsseite.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={appSettings.maintenanceMode}
                    onChange={(e) => {
                      const next = { ...appSettings, maintenanceMode: e.target.checked };
                      setAppSettings(next);
                      saveMaintenanceSettings(next);
                    }}
                    className="h-5 w-5 accent-amber-400"
                  />
                </label>

                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <div>
                    <p className="font-black">Admins während Wartung erlauben</p>
                    <p className="mt-1 text-xs text-slate-400">Aus = nur Entwickler kommen während Wartung in die App.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={appSettings.allowAdminsDuringMaintenance !== false}
                    onChange={(e) => {
                      const next = { ...appSettings, allowAdminsDuringMaintenance: e.target.checked };
                      setAppSettings(next);
                      saveMaintenanceSettings(next);
                    }}
                    className="h-5 w-5 accent-blue-500"
                  />
                </label>
              </div>

              <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Wartungstext</label>
                <textarea
                  value={appSettings.maintenanceMessage || ""}
                  onChange={(e) => setAppSettings((current) => ({ ...current, maintenanceMessage: e.target.value }))}
                  rows={3}
                  className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-slate-950 p-3 text-sm outline-none focus:border-amber-400"
                  placeholder="Text, den Nutzer während der Wartung sehen..."
                />
                <button
                  type="button"
                  disabled={savingSettings}
                  onClick={() => saveMaintenanceSettings()}
                  className="mt-3 flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-60"
                >
                  <Save size={16} /> {savingSettings ? "Speichere..." : "Wartungstext speichern"}
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 glass-card rounded-3xl p-5">
            <div className="mb-4 flex items-center gap-3">
              <MessageCircle className="text-violet-300" />
              <div>
                <h2 className="text-xl font-black">💬 Support-Tickets</h2>
                <p className="text-sm text-slate-400">
                  Admins sehen Admin-Support. Entwickler sehen zusätzlich
                  IT-Span Feedback und Bugmeldungen.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {tickets.length === 0 && (
                <p className="rounded-2xl bg-slate-950/60 p-4 text-sm text-slate-400">
                  Keine offenen Support-Tickets. Geschlossene Tickets werden
                  automatisch entfernt, damit die Datenbank schlank bleibt.
                </p>
              )}
              {tickets.map((ticket) => (
                <SupportTicketPanel key={ticket.id} ticket={ticket} />
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
            <div className="glass-card rounded-3xl p-5">
              <h2 className="mb-4 text-xl font-black">🚩 Gemeldete Beiträge</h2>
              <div className="space-y-3">
                {flaggedReports.length === 0 && (
                  <p className="text-sm text-slate-400">
                    Keine gemeldeten Beiträge.
                  </p>
                )}
                {flaggedReports.map((report) => (
                  <div
                    key={report.id}
                    className="rounded-2xl bg-slate-950/60 p-4"
                  >
                    <p className="break-words font-bold">
                      {report.category} · {report.location}
                    </p>
                    <p className="mt-1 line-clamp-2 break-words text-sm text-slate-400">
                      {report.description || "Ohne Beschreibung"}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {(report.reports ?? []).length} Meldungen
                    </p>
                    <button
                      onClick={() => deleteReport(report.id)}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold"
                    >
                      <Trash2 size={15} /> Beitrag löschen
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-3xl p-5">
              <div className="flex items-center gap-3">
                <BarChart3 className="text-blue-400" />
                <div>
                  <h2 className="text-xl font-black">Entwickler Analytics</h2>
                  <p className="text-sm text-slate-400">Live-Auswertung der geladenen Daten.</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-950/70 p-4"><p className="text-2xl font-black">{todayReports}</p><p className="text-xs text-slate-400">Beiträge 24h</p></div>
                <div className="rounded-2xl bg-slate-950/70 p-4"><p className="text-2xl font-black">{emergencyReports}</p><p className="text-xs text-slate-400">Eilmeldungen</p></div>
                <div className="rounded-2xl bg-slate-950/70 p-4"><p className="text-2xl font-black">{totalCommentsLoaded}</p><p className="text-xs text-slate-400">Kommentare geladen</p></div>
                <div className="rounded-2xl bg-slate-950/70 p-4"><p className="text-2xl font-black">{crashLogs.length}</p><p className="text-xs text-slate-400">Crashlogs</p></div>
              </div>
            </div>
          </div>

          {userData?.role === "developer" && (
            <div className="mt-6 glass-card rounded-3xl p-5">
              <div className="mb-4 flex items-center gap-3">
                <Activity className="text-red-300" />
                <div>
                  <h2 className="text-xl font-black">Crashlogs</h2>
                  <p className="text-sm text-slate-400">Automatisch erfasste Browser-Fehler der Nutzer.</p>
                </div>
              </div>
              <div className="space-y-3">
                {crashLogs.length === 0 && <p className="rounded-2xl bg-slate-950/60 p-4 text-sm text-slate-400">Keine Crashlogs vorhanden.</p>}
                {crashLogs.map((log) => (
                  <div key={log.id} className="rounded-2xl bg-slate-950/70 p-4">
                    <p className="break-words font-bold text-red-200">{log.message}</p>
                    <p className="mt-1 break-all text-xs text-slate-500">{log.url}</p>
                    <div className="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
                      <p><b>Quelle:</b> {log.source || "client"}</p>
                      <p><b>Zeile:</b> {log.line || "-"}:{log.column || "-"}</p>
                      <p><b>Seite:</b> {log.pathname || "-"}</p>
                      <p><b>Online:</b> {log.online === false ? "Nein" : "Ja"}</p>
                      <p><b>Viewport:</b> {log.viewport || "-"}</p>
                      <p><b>Letzte Aktion:</b> {log.lastAction || "-"}</p>
                    </div>
                    {log.reason && <p className="mt-2 break-words rounded-xl bg-slate-900 p-3 text-xs text-slate-400"><b>Grund:</b> {log.reason}</p>}
                    {log.stack && <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-black/40 p-3 text-[11px] text-slate-400">{log.stack}</pre>}
                    <button onClick={() => deleteDoc(doc(db, "crashLogs", log.id))} className="mt-3 rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300">Log löschen</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
        <BottomNavigation />
      </main>
    </ProtectedRoute>
  );
}
