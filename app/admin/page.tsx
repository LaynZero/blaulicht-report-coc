"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  endAt,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAt,
  updateDoc,
} from "firebase/firestore";
import BottomNavigation from "@/components/BottomNavigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleBadge from "@/components/ui/RoleBadge";
import { useAuth } from "@/app/context/AuthContext";
import { db } from "@/app/firebase";
import type { AppUser, Report, UserRole } from "@/lib/types";
import { Ban, BarChart3, Flag, Search, Shield, Trash2, UserCog, Users } from "lucide-react";

export default function AdminPage() {
  const { userData } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUid, setSelectedUid] = useState("");

  const cleanSearch = userSearch.trim().toLowerCase().replace(/^@/, "");

  useEffect(() => {
    const usersQuery = cleanSearch
      ? query(collection(db, "users"), orderBy("username"), startAt(cleanSearch), endAt(`${cleanSearch}\uf8ff`), limit(25))
      : query(collection(db, "users"), orderBy("createdAt", "desc"), limit(25));

    const unsubUsers = onSnapshot(usersQuery, (snap) => {
      const nextUsers = snap.docs.map((item) => item.data() as AppUser);
      setUsers(nextUsers);
      setSelectedUid((current) => current || nextUsers[0]?.uid || "");
    });

    return () => unsubUsers();
  }, [cleanSearch]);

  useEffect(() => {
    const unsubReports = onSnapshot(query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(100)), (snap) => {
      setReports(snap.docs.map((item) => ({ id: item.id, ...item.data() }) as Report));
    });
    return () => unsubReports();
  }, []);

  const selectedUser = useMemo(() => users.find((item) => item.uid === selectedUid) ?? users[0], [selectedUid, users]);
  const flaggedReports = useMemo(() => reports.filter((report) => (report.reports ?? []).length > 0), [reports]);
  const canManageRoles = userData?.role === "developer";

  async function setRole(uid: string, role: UserRole) {
    if (!canManageRoles) return alert("Nur Entwickler dürfen Rollen ändern.");
    await updateDoc(doc(db, "users", uid), { role });
  }

  async function toggleBan(appUser: AppUser) {
    if (appUser.role === "developer") return alert("Entwickler können nicht gesperrt werden.");
    await updateDoc(doc(db, "users", appUser.uid), { banned: !appUser.banned });
  }

  async function deleteReport(reportId: string) {
    if (confirm("Meldung löschen?")) await deleteDoc(doc(db, "reports", reportId));
  }

  return (
    <ProtectedRoute roles={["admin", "developer"]}>
      <main className="min-h-screen px-5 pb-28 pt-8 text-white">
        <section className="mx-auto max-w-5xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">Adminbereich</p>
              <h1 className="text-4xl font-black tracking-tight">Dashboard</h1>
              <p className="mt-2 max-w-xl text-sm text-slate-400">
                Nutzer werden nicht mehr alle auf einmal angezeigt. Suche nach @Benutzername und bearbeite dann gezielt einen Account.
              </p>
            </div>
            <div className="rounded-3xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-200">
              {canManageRoles ? "💻 Entwickler-Modus" : "🛡️ Admin-Modus"}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="glass-card rounded-3xl p-4"><Users className="mb-3 text-blue-400" /><p className="text-2xl font-black">{users.length}</p><p className="text-sm text-slate-400">geladene Nutzer</p></div>
            <div className="glass-card rounded-3xl p-4"><Shield className="mb-3 text-green-400" /><p className="text-2xl font-black">{reports.length}</p><p className="text-sm text-slate-400">letzte Meldungen</p></div>
            <div className="glass-card rounded-3xl p-4"><Flag className="mb-3 text-yellow-400" /><p className="text-2xl font-black">{flaggedReports.length}</p><p className="text-sm text-slate-400">gemeldet</p></div>
            <div className="glass-card rounded-3xl p-4"><Ban className="mb-3 text-red-400" /><p className="text-2xl font-black">{users.filter((u) => u.banned).length}</p><p className="text-sm text-slate-400">gesperrt geladen</p></div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
            <div className="glass-card rounded-3xl p-5">
              <div className="mb-4 flex items-center gap-3">
                <UserCog className="text-blue-400" />
                <div>
                  <h2 className="text-xl font-black">Nutzer suchen</h2>
                  <p className="text-xs text-slate-400">max. 25 Treffer pro Suche</p>
                </div>
              </div>

              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setSelectedUid("");
                  }}
                  placeholder="@benutzername suchen..."
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 py-4 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500"
                />
              </label>

              <select
                value={selectedUser?.uid ?? ""}
                onChange={(e) => setSelectedUid(e.target.value)}
                className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm font-bold outline-none focus:border-blue-500"
              >
                {users.length === 0 && <option value="">Keine Nutzer gefunden</option>}
                {users.map((appUser) => (
                  <option key={appUser.uid} value={appUser.uid}>
                    @{appUser.username} · {appUser.displayName}
                  </option>
                ))}
              </select>

              <div className="mt-4 rounded-2xl bg-slate-950/70 p-4 text-xs leading-relaxed text-slate-400">
                Tipp: Für 10.000+ Nutzer ist Suche besser als eine riesige Liste. Die Seite lädt dadurch schneller und bleibt übersichtlich.
              </div>
            </div>

            <div className="glass-card rounded-3xl p-5">
              <h2 className="mb-4 text-xl font-black">👥 Nutzerverwaltung</h2>
              {!selectedUser ? (
                <p className="rounded-2xl bg-slate-950/60 p-4 text-sm text-slate-400">Suche einen Nutzer oder wähle einen Treffer aus.</p>
              ) : (
                <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="break-words text-2xl font-black">{selectedUser.displayName}</p>
                        <RoleBadge role={selectedUser.role} />
                      </div>
                      <p className="mt-1 break-all text-sm text-slate-400">@{selectedUser.username}</p>
                      <p className="mt-1 break-all text-xs text-slate-500">{selectedUser.email}</p>
                    </div>
                    <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${selectedUser.banned ? "bg-red-500/15 text-red-300" : "bg-green-500/15 text-green-300"}`}>
                      {selectedUser.banned ? "Gesperrt" : "Aktiv"}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-900 p-4"><p className="text-2xl font-black">{selectedUser.reportsCount ?? 0}</p><p className="text-xs text-slate-400">Beiträge</p></div>
                    <div className="rounded-2xl bg-slate-900 p-4"><p className="text-2xl font-black">{selectedUser.commentsCount ?? 0}</p><p className="text-xs text-slate-400">Kommentare</p></div>
                    <div className="rounded-2xl bg-slate-900 p-4"><p className="text-2xl font-black">{selectedUser.trustPoints ?? 0}</p><p className="text-xs text-slate-400">Trust</p></div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <button
                      disabled={selectedUser.role === "developer"}
                      onClick={() => toggleBan(selectedUser)}
                      className="rounded-2xl bg-red-600 py-4 text-sm font-black transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                    >
                      {selectedUser.role === "developer" ? "Entwickler geschützt" : selectedUser.banned ? "Nutzer entsperren" : "Nutzer sperren"}
                    </button>
                    <select
                      disabled={!canManageRoles}
                      value={selectedUser.role}
                      onChange={(e) => setRole(selectedUser.uid, e.target.value as UserRole)}
                      className="rounded-2xl border border-white/10 bg-slate-900 p-4 text-sm font-black outline-none disabled:opacity-40"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="developer">Entwickler</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
            <div className="glass-card rounded-3xl p-5">
              <h2 className="mb-4 text-xl font-black">🚩 Gemeldete Beiträge</h2>
              <div className="space-y-3">
                {flaggedReports.length === 0 && <p className="text-sm text-slate-400">Keine gemeldeten Beiträge.</p>}
                {flaggedReports.map((report) => (
                  <div key={report.id} className="rounded-2xl bg-slate-950/60 p-4">
                    <p className="break-words font-bold">{report.category} · {report.location}</p>
                    <p className="mt-1 line-clamp-2 break-words text-sm text-slate-400">{report.description || "Ohne Beschreibung"}</p>
                    <p className="mt-1 text-sm text-slate-400">{(report.reports ?? []).length} Meldungen</p>
                    <button onClick={() => deleteReport(report.id)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold">
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
                  <h2 className="text-xl font-black">Statistiken</h2>
                  <p className="text-sm text-slate-400">Live aus Firestore: geladene Nutzer, letzte Meldungen und gemeldete Beiträge.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <BottomNavigation />
      </main>
    </ProtectedRoute>
  );
}
