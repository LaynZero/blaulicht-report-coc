import BottomNavigation from "@/components/BottomNavigation";
import { Shield, Code2, Star, MessageCircle, Siren } from "lucide-react";

export default function ProfilePage() {
  const user = {
    name: "Leon",
    role: "developer",
    points: 1452,
    reports: 38,
    confirmations: 214,
    comments: 87,
  };

  const roleBadge = {
    developer: {
      label: "Entwickler",
      icon: <Code2 size={16} />,
      className: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    },
    admin: {
      label: "Admin",
      icon: <Shield size={16} />,
      className: "bg-red-500/20 text-red-300 border-red-500/30",
    },
    user: {
      label: "Mitglied",
      icon: <Star size={16} />,
      className: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    },
  };

  const badge = roleBadge[user.role as keyof typeof roleBadge];

  return (
    <main className="min-h-screen px-5 pb-28 pt-8 text-white">
      <section className="mx-auto max-w-md">
        <div className="glass-card rounded-3xl p-6 text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-blue-600 blue-glow">
            <Siren size={40} />
          </div>

          <h1 className="text-3xl font-black">{user.name}</h1>

          <div
            className={`mx-auto mt-3 flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${badge.className}`}
          >
            {badge.icon}
            {badge.label}
          </div>

          <div className="mt-6 rounded-2xl bg-slate-950/60 p-4">
            <p className="text-sm text-slate-400">Vertrauenspunkte</p>
            <p className="mt-1 text-3xl font-black text-green-400">
              {user.points}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="glass-card rounded-2xl p-4 text-center">
            <Siren className="mx-auto mb-2 text-blue-400" size={22} />
            <p className="text-xl font-bold">{user.reports}</p>
            <p className="text-xs text-slate-400">Beiträge</p>
          </div>

          <div className="glass-card rounded-2xl p-4 text-center">
            <Shield className="mx-auto mb-2 text-green-400" size={22} />
            <p className="text-xl font-bold">{user.confirmations}</p>
            <p className="text-xs text-slate-400">Bestätigt</p>
          </div>

          <div className="glass-card rounded-2xl p-4 text-center">
            <MessageCircle className="mx-auto mb-2 text-purple-400" size={22} />
            <p className="text-xl font-bold">{user.comments}</p>
            <p className="text-xs text-slate-400">Kommentare</p>
          </div>
        </div>
      </section>

      <BottomNavigation />
    </main>
  );
}