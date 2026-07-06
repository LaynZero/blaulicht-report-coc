import { Code2, Shield, Star } from "lucide-react";
import type { UserRole } from "@/lib/types";

export default function RoleBadge({ role }: { role?: UserRole }) {
  if (role === "developer") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/30 bg-violet-500/15 px-2.5 py-1 text-xs font-black uppercase tracking-wide text-violet-200">
        <Code2 size={13} /> Entwickler
      </span>
    );
  }

  if (role === "admin") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-400/30 bg-red-500/15 px-2.5 py-1 text-xs font-black uppercase tracking-wide text-red-200">
        <Shield size={13} /> Admin
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-500/20 bg-slate-500/10 px-2.5 py-1 text-xs font-bold text-slate-300">
      <Star size={13} /> Mitglied
    </span>
  );
}
