import BottomNavigation from "@/components/BottomNavigation";
import {
  Users,
  Shield,
  Ban,
  Flag,
  Trash2,
  UserPlus,
  BarChart3,
} from "lucide-react";

export default function AdminPage() {
  const stats = [
    { label: "Nutzer", value: "10.247", icon: <Users size={22} /> },
    { label: "Aktive Meldungen", value: "27", icon: <Shield size={22} /> },
    { label: "Gemeldet", value: "8", icon: <Flag size={22} /> },
    { label: "Gesperrt", value: "3", icon: <Ban size={22} /> },
  ];

  const users = [
    { name: "Leon", role: "💻 Entwickler", status: "Aktiv" },
    { name: "Max", role: "🛡️ Admin", status: "Aktiv" },
    { name: "Tim", role: "👤 Mitglied", status: "Verwarnung" },
  ];

  const reports = [
    {
      title: "Verkehrskontrolle Cochem B49",
      reason: "Mehrfach als nicht aktuell gemeldet",
    },
    {
      title: "Unfall Zell Brücke",
      reason: "Unpassender Kommentar gemeldet",
    },
  ];

  return (
    <main className="min-h-screen px-5 pb-28 pt-8 text-white">
      <section className="mx-auto max-w-md">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">
            Adminbereich
          </p>
          <h1 className="text-3xl font-black">Dashboard</h1>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {stats.map((item) => (
            <div key={item.label} className="glass-card rounded-3xl p-4">
              <div className="mb-3 text-blue-400">{item.icon}</div>
              <p className="text-2xl font-black">{item.value}</p>
              <p className="text-sm text-slate-400">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 glass-card rounded-3xl p-5">
          <h2 className="mb-4 text-xl font-bold">👥 Nutzerverwaltung</h2>

          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.name}
                className="rounded-2xl bg-slate-950/60 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">{user.name}</p>
                    <p className="text-sm text-slate-400">{user.role}</p>
                  </div>

                  <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs text-green-300">
                    {user.status}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold">
                    <UserPlus size={15} />
                    Admin geben
                  </button>

                  <button className="flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold">
                    <Ban size={15} />
                    Sperren
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 glass-card rounded-3xl p-5">
          <h2 className="mb-4 text-xl font-bold">🚩 Gemeldete Beiträge</h2>

          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.title}
                className="rounded-2xl bg-slate-950/60 p-4"
              >
                <p className="font-bold">{report.title}</p>
                <p className="mt-1 text-sm text-slate-400">{report.reason}</p>

                <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold">
                  <Trash2 size={15} />
                  Beitrag löschen
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 glass-card rounded-3xl p-5">
          <div className="flex items-center gap-3">
            <BarChart3 className="text-blue-400" />
            <div>
              <h2 className="text-xl font-bold">Statistiken</h2>
              <p className="text-sm text-slate-400">
                Später: aktive Nutzer, Meldungen pro Tag, Kategorien.
              </p>
            </div>
          </div>
        </div>
      </section>

      <BottomNavigation />
    </main>
  );
}