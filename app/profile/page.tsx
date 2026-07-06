"use client";

import { useEffect, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { updatePassword, updateProfile } from "firebase/auth";
import BottomNavigation from "@/components/BottomNavigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleBadge from "@/components/ui/RoleBadge";
import PushNotifications from "@/components/PushNotifications";
import { useAuth } from "@/app/context/AuthContext";
import { db } from "@/app/firebase";
import { MessageCircle, Shield, Siren } from "lucide-react";

export default function ProfilePage() {
  const { user, userData, refreshUserData } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    setDisplayName(userData?.displayName ?? "");
    setBio(userData?.bio ?? "");
    setLocation(userData?.location ?? "");
  }, [userData]);

  async function saveProfile() {
    if (!user) return;
    const cleanName = displayName.trim();

    if (cleanName.length < 2) {
      alert("Der Name muss mindestens 2 Zeichen lang sein.");
      return;
    }

    setSaving(true);
    try {
      await updateProfile(user, { displayName: cleanName });
      await updateDoc(doc(db, "users", user.uid), {
        displayName: cleanName,
        bio: bio.trim(),
        location: location.trim(),
      });
      await refreshUserData();
      alert("Profil gespeichert.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Profil konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  }

  async function savePassword() {
    if (!user) return;
    if (newPassword.length < 6) {
      alert("Das neue Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }

    setPasswordSaving(true);
    try {
      await updatePassword(user, newPassword);
      setNewPassword("");
      alert("Passwort wurde geändert.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Passwort konnte nicht geändert werden.";
      if (message.includes("requires-recent-login")) {
        alert("Bitte logge dich einmal neu ein und ändere danach direkt dein Passwort.");
      } else {
        alert(message);
      }
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen px-5 pb-28 pt-8 text-white">
        <section className="mx-auto max-w-md">
          <div className="glass-card rounded-3xl p-6 text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-blue-600 blue-glow">
              <Siren size={40} />
            </div>
            <h1 className="break-words text-3xl font-black">{userData?.displayName}</h1>
            <p className="mt-1 break-words text-slate-400">@{userData?.username}</p>
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
            <div>
              <h2 className="text-xl font-black">Profil bearbeiten</h2>
              <p className="mt-1 text-sm text-slate-400">Name, Ort und Bio werden öffentlich im Profil angezeigt.</p>
            </div>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 p-4 outline-none focus:border-blue-500" placeholder="Anzeigename" maxLength={40} />
            <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 p-4 outline-none focus:border-blue-500" placeholder="Ort, z.B. Altstrimmig" maxLength={60} />
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 p-4 outline-none focus:border-blue-500" rows={4} placeholder="Kurze Bio" maxLength={240} />
            <button onClick={saveProfile} disabled={saving} className="w-full rounded-2xl bg-blue-600 py-3 font-black disabled:opacity-60">{saving ? "Speichert..." : "Profil speichern"}</button>
          </div>

          <div className="mt-5">
            <PushNotifications />
          </div>

          <div className="mt-5 glass-card space-y-4 rounded-3xl p-5">
            <div>
              <h2 className="text-xl font-black">Passwort ändern</h2>
              <p className="mt-1 text-sm text-slate-400">Bei Google/Apple-Accounts wird das Passwort beim jeweiligen Anbieter verwaltet.</p>
            </div>
            <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 p-4 outline-none focus:border-blue-500" placeholder="Neues Passwort" type="password" minLength={6} />
            <button onClick={savePassword} disabled={passwordSaving || !newPassword} className="w-full rounded-2xl bg-slate-800 py-3 font-black disabled:opacity-60">{passwordSaving ? "Ändert..." : "Passwort ändern"}</button>
          </div>
        </section>
        <BottomNavigation />
      </main>
    </ProtectedRoute>
  );
}
