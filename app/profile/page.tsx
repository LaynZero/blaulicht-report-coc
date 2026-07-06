"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import BottomNavigation from "@/components/BottomNavigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleBadge from "@/components/ui/RoleBadge";
import { useAuth } from "@/app/context/AuthContext";
import { db } from "@/app/firebase";
import { MessageCircle, Shield, Siren } from "lucide-react";

export default function ProfilePage() {
  const { user, userData, refreshUserData } = useAuth();
  const [bio, setBio] = useState(userData?.bio ?? "");
  const [location, setLocation] = useState(userData?.location ?? "");
  const [saving, setSaving] = useState(false);

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    await updateDoc(doc(db, "users", user.uid), { bio, location });
    await refreshUserData();
    setSaving(false);
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen px-5 pb-28 pt-8 text-white">
        <section className="mx-auto max-w-md">
          <div className="glass-card rounded-3xl p-6 text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-blue-600 blue-glow">
              <Siren size={40} />
            </div>
            <h1 className="text-3xl font-black">{userData?.displayName}</h1>
            <p className="mt-1 text-slate-400">@{userData?.username}</p>
            <div className="mt-3"><RoleBadge role={userData?.role} /></div>
            <div className="mt-6 rounded-2xl bg-slate-950/60 p-4">
              <p className="text-sm text-slate-400">Vertrauenspunkte</p>
              <p className="mt-1 text-3xl font-black text-green-400">{userData?.trustPoints ?? 0}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="glass-card rounded-2xl p-4 text-center"><Siren className="mx-auto mb-2 text-blue-400" size={22} /><p className="text-xl font-bold">{userData?.reportsCount ?? 0}</p><p className="text-xs text-slate-400">Beiträge</p></div>
            <div className="glass-card rounded-2xl p-4 text-center"><Shield className="mx-auto mb-2 text-green-400" size={22} /><p className="text-xl font-bold">{userData?.confirmationsCount ?? 0}</p><p className="text-xs text-slate-400">Bestätigt</p></div>
            <div className="glass-card rounded-2xl p-4 text-center"><MessageCircle className="mx-auto mb-2 text-purple-400" size={22} /><p className="text-xl font-bold">{userData?.commentsCount ?? 0}</p><p className="text-xs text-slate-400">Kommentare</p></div>
          </div>

          <div className="mt-5 glass-card space-y-4 rounded-3xl p-5">
            <h2 className="text-xl font-black">Profil bearbeiten</h2>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 p-4" placeholder="Ort, z.B. Altstrimmig" />
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 p-4" rows={4} placeholder="Kurze Bio" />
            <button onClick={saveProfile} disabled={saving} className="w-full rounded-2xl bg-blue-600 py-3 font-black disabled:opacity-60">{saving ? "Speichert..." : "Speichern"}</button>
          </div>
        </section>
        <BottomNavigation />
      </main>
    </ProtectedRoute>
  );
}
