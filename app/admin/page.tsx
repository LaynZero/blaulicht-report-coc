"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, limit, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import BottomNavigation from "@/components/BottomNavigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleBadge from "@/components/ui/RoleBadge";
import { useAuth } from "@/app/context/AuthContext";
import { db } from "@/app/firebase";
import type { AppUser, Report, UserRole } from "@/lib/types";
import { Ban, BarChart3, Flag, Shield, Trash2, Users } from "lucide-react";

export default function AdminPage() {
  const { userData } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    const unsubUsers = onSnapshot(query(collection(db, "users"), limit(100)), (snap) => {
      setUsers(snap.docs.map((item) => item.data() as AppUser));
    });
    const unsubReports = onSnapshot(query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(100)), (snap) => {
      setReports(snap.docs.map((item) => ({ id: item.id, ...item.data() }) as Report));
    });
    return () => { unsubUsers(); unsubReports(); };
  }, []);

  const flaggedReports = useMemo(() => reports.filter((report) => (report.reports ?? []).length > 0), [reports]);
  const canManageRoles = userData?.role === "developer";

  async function setRole(uid: string, role: UserRole) {
    if (!canManageRoles) return alert("Nur Entwickler dürfen Rollen ändern.");
    await updateDoc(doc(db, "users", uid), { role });
  }

  async function toggleBan(appUser: AppUser) {
    await updateDoc(doc(db, "users", appUser.uid), { banned: !appUser.banned });
  }

  async function deleteReport(reportId: string) {
    if (confirm("Meldung löschen?")) await deleteDoc(doc(db, "reports", reportId));
  }

  return (
    <ProtectedRoute roles={["admin", "developer"]}>
      <main className="min-h-screen px-5 pb-28 pt-8 text-white">
        <section className="mx-auto max-w-md">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">Adminbereich</p>
            <h1 className="text-3xl font-black">Dashboard</h1>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card rounded-3xl p-4"><Users className="mb-3 text-blue-400" /><p className="text-2xl font-black">{users.length}</p><p className="text-sm text-slate-400">Nutzer</p></div>
            <div className="glass-card rounded-3xl p-4"><Shield className="mb-3 text-green-400" /><p className="text-2xl font-black">{reports.length}</p><p className="text-sm text-slate-400">Meldungen</p></div>
            <div className="glass-card rounded-3xl p-4"><Flag className="mb-3 text-yellow-400" /><p className="text-2xl font-black">{flaggedReports.length}</p><p className="text-sm text-slate-400">Gemeldet</p></div>
            <div className="glass-card rounded-3xl p-4"><Ban className="mb-3 text-red-400" /><p className="text-2xl font-black">{users.filter((u) => u.banned).length}</p><p className="text-sm text-slate-400">Gesperrt</p></div>
          </div>

          <div className="mt-6 glass-card rounded-3xl p-5">
            <h2 className="mb-4 text-xl font-bold">👥 Nutzerverwaltung</h2>
            <div className="space-y-3">
              {users.map((appUser) => (
                <div key={appUser.uid} className="rounded-2xl bg-slate-950/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">{appUser.displayName}</p>
                      <p className="text-sm text-slate-400">@{appUser.username}</p>
                      <div className="mt-2"><RoleBadge role={appUser.role} /></div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs ${appUser.banned ? "bg-red-500/15 text-red-300" : "bg-green-500/15 text-green-300"}`}>
                      {appUser.banned ? "Gesperrt" : "Aktiv"}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button onClick={() => toggleBan(appUser)} className="rounded-xl bg-red-600 py-3 text-sm font-bold">{appUser.banned ? "Entsperren" : "Sperren"}</button>
                    <select disabled={!canManageRoles} value={appUser.role} onChange={(e) => setRole(appUser.uid, e.target.value as UserRole)} className="rounded-xl bg-slate-800 p-3 text-sm font-bold disabled:opacity-40">
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="developer">Entwickler</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 glass-card rounded-3xl p-5">
            <h2 className="mb-4 text-xl font-bold">🚩 Gemeldete Beiträge</h2>
            <div className="space-y-3">
              {flaggedReports.length === 0 && <p className="text-sm text-slate-400">Keine gemeldeten Beiträge.</p>}
              {flaggedReports.map((report) => (
                <div key={report.id} className="rounded-2xl bg-slate-950/60 p-4">
                  <p className="font-bold">{report.category} · {report.location}</p>
                  <p className="mt-1 text-sm text-slate-400">{(report.reports ?? []).length} Meldungen</p>
                  <button onClick={() => deleteReport(report.id)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold">
                    <Trash2 size={15} /> Beitrag löschen
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 glass-card rounded-3xl p-5"><div className="flex items-center gap-3"><BarChart3 className="text-blue-400" /><div><h2 className="text-xl font-bold">Statistiken</h2><p className="text-sm text-slate-400">Live aus Firestore: Nutzer, Meldungen, gemeldete Beiträge.</p></div></div></div>
        </section>
        <BottomNavigation />
      </main>
    </ProtectedRoute>
  );
}
