"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, serverTimestamp, updateDoc, writeBatch } from "firebase/firestore";
import { updatePassword, updateProfile } from "firebase/auth";
import BottomNavigation from "@/components/BottomNavigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleBadge from "@/components/ui/RoleBadge";
import UserAvatar from "@/components/ui/UserAvatar";
import PushNotifications from "@/components/PushNotifications";
import { useAuth } from "@/app/context/AuthContext";
import { db } from "@/app/firebase";
import { isReservedUsername, normalizeUsername } from "@/lib/helpers";
import { uploadAvatarImage } from "@/lib/upload";
import { AlertTriangle, Camera, HelpCircle, Loader2, MessageCircle, Shield, Siren, Trash2 } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, userData, refreshUserData } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [trustHelpOpen, setTrustHelpOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  async function deleteAccount() {
    if (!user || !userData) return;
    if (userData.role === "admin" || userData.role === "developer") {
      alert("Admin-/Entwickler-Accounts können nicht selbst gelöscht werden. Bitte wende dich an ein anderes Teammitglied, um deine Rolle zu übergeben.");
      return;
    }

    const confirmed = confirm(
      `Möchtest du deinen Account @${userData.username} wirklich unwiderruflich löschen?\n\nAlle deine Meldungen, Kommentare und Daten werden entfernt. Das kann nicht rückgängig gemacht werden.`,
    );
    if (!confirmed) return;

    setDeletingAccount(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const rawText = await response.text();
      let data: { ok?: boolean; message?: string };
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(`Serverfehler (Status ${response.status}). Bitte versuche es später erneut.`);
      }
      if (!response.ok || !data.ok) throw new Error(data.message || "Account konnte nicht gelöscht werden.");

      alert("Dein Account wurde gelöscht.");
      router.push("/login");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Account konnte nicht gelöscht werden.");
    } finally {
      setDeletingAccount(false);
    }
  }

  useEffect(() => {
    setDisplayName(userData?.displayName ?? "");
    setUsername(userData?.username ?? "");
    setBio(userData?.bio ?? "");
    setLocation(userData?.location ?? "");
    setAvatarUrl(userData?.avatarDataUrl ?? "");
  }, [userData]);

  async function handleAvatarSelect(file: File) {
    if (!user) return;
    setAvatarUploading(true);
    try {
      const url = await uploadAvatarImage(file, user.uid);
      setAvatarUrl(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Bild konnte nicht hochgeladen werden.");
    } finally {
      setAvatarUploading(false);
    }
  }

  async function saveProfile() {
    if (!user || !userData) return;
    const cleanName = displayName.trim();
    const cleanUsername = normalizeUsername(username);
    const oldUsername = userData.username;

    if (cleanName.length < 2) return alert("Der Name muss mindestens 2 Zeichen lang sein.");
    if (cleanUsername.length < 3 || cleanUsername.length > 20) return alert("Benutzername: 3–20 Zeichen, nur Buchstaben, Zahlen, _ und .");
    if (isReservedUsername(cleanUsername)) return alert("Dieser Benutzername ist reserviert.");
    if (avatarUploading) return alert("Bitte warte, bis der Bild-Upload abgeschlossen ist.");

    setSaving(true);
    try {
      if (cleanUsername !== oldUsername) {
        const newUsernameRef = doc(db, "usernames", cleanUsername);
        const newUsernameSnap = await getDoc(newUsernameRef);
        if (newUsernameSnap.exists()) return alert("Dieser @Benutzername ist bereits vergeben.");

        const batch = writeBatch(db);
        batch.set(newUsernameRef, { uid: user.uid, createdAt: serverTimestamp() });
        if (oldUsername) batch.delete(doc(db, "usernames", oldUsername));
        batch.update(doc(db, "users", user.uid), {
          displayName: cleanName,
          username: cleanUsername,
          bio: bio.trim(),
          location: location.trim(),
          // Field name kept for backwards compatibility; now holds a Firebase
          // Storage download URL instead of a base64 data URL.
          avatarDataUrl: avatarUrl,
        });
        await batch.commit();
      } else {
        await updateDoc(doc(db, "users", user.uid), {
          displayName: cleanName,
          bio: bio.trim(),
          location: location.trim(),
          avatarDataUrl: avatarUrl,
        });
      }

      await updateProfile(user, { displayName: cleanName });
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
    if (newPassword.length < 6) return alert("Das neue Passwort muss mindestens 6 Zeichen lang sein.");

    setPasswordSaving(true);
    try {
      await updatePassword(user, newPassword);
      setNewPassword("");
      alert("Passwort wurde geändert.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Passwort konnte nicht geändert werden.";
      if (message.includes("requires-recent-login")) alert("Bitte logge dich einmal neu ein und ändere danach direkt dein Passwort.");
      else alert(message);
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen px-5 pb-28 pt-8 text-white">
        <section className="mx-auto max-w-md">
          <div className="glass-card rounded-3xl p-6 text-center">
            <div className="mx-auto mb-4 flex justify-center">
              <UserAvatar src={avatarUrl || userData?.avatarDataUrl} name={userData?.displayName} size="xl" className="blue-glow" />
            </div>
            <h1 className="break-words text-3xl font-black">{userData?.displayName}</h1>
            <p className="mt-1 break-words text-slate-400">@{userData?.username}</p>
            <div className="mt-3"><RoleBadge role={userData?.role} /></div>
            <div className="mt-6 rounded-2xl bg-slate-950/60 p-4">
              <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                <span>Vertrauenspunkte</span>
                <button onClick={() => setTrustHelpOpen(true)} className="rounded-full p-1 text-blue-300 hover:bg-blue-500/10" aria-label="Vertrauenspunkte erklären">
                  <HelpCircle size={17} />
                </button>
              </div>
              <p className="mt-1 text-3xl font-black text-green-400">{userData?.trustPoints ?? 0}</p>
            </div>
          </div>

          {trustHelpOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5">
              <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
                <h2 className="text-2xl font-black">Was sind Vertrauenspunkte?</h2>
                <p className="mt-2 text-sm text-slate-400">Vertrauenspunkte zeigen, wie aktiv und hilfreich ein Mitglied in der Community ist.</p>
                <div className="mt-5 space-y-3 text-sm">
                  <div className="rounded-2xl bg-slate-900 p-3">🚨 Eigene Meldung erstellen: <b>+5 Punkte</b></div>
                  <div className="rounded-2xl bg-slate-900 p-3">✅ Meldung bestätigen: <b>+2 Punkte</b></div>
                  <div className="rounded-2xl bg-slate-900 p-3">💬 Kommentar schreiben: <b>+1 Punkt</b></div>
                  <div className="rounded-2xl bg-slate-900 p-3">📢 Offizieller Admin/Entwickler-Post: <b>+8 Punkte</b></div>
                </div>
                <p className="mt-4 text-xs text-slate-500">Bei Missbrauch können Admins Beiträge entfernen oder Accounts sperren. Punkte sind kein offizieller Status, sondern ein Community-Signal.</p>
                <button onClick={() => setTrustHelpOpen(false)} className="mt-5 w-full rounded-2xl bg-blue-600 py-3 font-black">Verstanden</button>
              </div>
            </div>
          )}

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="glass-card rounded-2xl p-4 text-center"><Siren className="mx-auto mb-2 text-blue-400" size={22} /><p className="text-xl font-bold">{userData?.reportsCount ?? 0}</p><p className="text-xs text-slate-400">Beiträge</p></div>
            <div className="glass-card rounded-2xl p-4 text-center"><Shield className="mx-auto mb-2 text-green-400" size={22} /><p className="text-xl font-bold">{userData?.confirmationsCount ?? 0}</p><p className="text-xs text-slate-400">Bestätigungen</p></div>
            <div className="glass-card rounded-2xl p-4 text-center"><MessageCircle className="mx-auto mb-2 text-purple-400" size={22} /><p className="text-xl font-bold">{userData?.commentsCount ?? 0}</p><p className="text-xs text-slate-400">Kommentare</p></div>
          </div>

          <div className="mt-5 glass-card space-y-4 rounded-3xl p-5">
            <div>
              <h2 className="text-xl font-black">Profil bearbeiten</h2>
              <p className="mt-1 text-sm text-slate-400">Name, @Benutzername, Ort und Bio werden öffentlich im Profil angezeigt.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <label className="mb-3 block text-sm font-bold text-slate-300">Profilbild</label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <UserAvatar src={avatarUrl} name={displayName} size="lg" />
                  {avatarUploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-950/60">
                      <Loader2 size={18} className="animate-spin" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black hover:bg-blue-500">
                    <Camera size={16} /> Bild auswählen
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={avatarUploading}
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (!file) return;
                        await handleAvatarSelect(file);
                      }}
                    />
                  </label>
                  {avatarUrl && (
                    <button type="button" onClick={() => setAvatarUrl("")} disabled={avatarUploading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-slate-200 disabled:opacity-50">
                      <Trash2 size={15} /> Entfernen
                    </button>
                  )}
                  <p className="text-xs text-slate-500">Das Bild wird automatisch zugeschnitten und in Firebase Storage hochgeladen.</p>
                </div>
              </div>
            </div>
                        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 p-4 outline-none focus:border-blue-500" placeholder="Anzeigename" maxLength={40} />
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-300">@Benutzername</label>
              <input value={username} onChange={(e) => setUsername(normalizeUsername(e.target.value))} className="w-full rounded-2xl border border-white/10 bg-slate-950 p-4 outline-none focus:border-blue-500" placeholder="z.B. coc112" maxLength={20} />
            </div>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 p-4 outline-none focus:border-blue-500" placeholder="Ort, z.B. Altstrimmig" maxLength={60} />
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 p-4 outline-none focus:border-blue-500" rows={4} placeholder="Kurze Bio" maxLength={240} />
            <button onClick={saveProfile} disabled={saving || avatarUploading} className="w-full rounded-2xl bg-blue-600 py-3 font-black disabled:opacity-60">{saving ? "Speichert..." : "Profil speichern"}</button>
          </div>

          <div className="mt-5"><PushNotifications /></div>

          <div className="mt-5 glass-card space-y-4 rounded-3xl p-5">
            <div>
              <h2 className="text-xl font-black">Passwort ändern</h2>
              <p className="mt-1 text-sm text-slate-400">Bei Google-Accounts wird das Passwort beim jeweiligen Anbieter verwaltet.</p>
            </div>
            <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 p-4 outline-none focus:border-blue-500" placeholder="Neues Passwort" type="password" minLength={6} />
            <button onClick={savePassword} disabled={passwordSaving || !newPassword} className="w-full rounded-2xl bg-slate-800 py-3 font-black disabled:opacity-60">{passwordSaving ? "Ändert..." : "Passwort ändern"}</button>
          </div>
          <div className="mt-5 rounded-3xl border border-red-500/30 bg-red-500/5 p-5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-red-400" size={20} />
              <h2 className="text-lg font-black text-red-200">Account löschen</h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-red-100/70">
              Löscht deinen Account sowie alle deine Meldungen, Kommentare und Daten unwiderruflich. Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            {(userData?.role === "admin" || userData?.role === "developer") && (
              <p className="mt-2 text-xs text-red-100/50">Admin-/Entwickler-Accounts müssen ihre Rolle zuerst an ein anderes Teammitglied übergeben.</p>
            )}
            <button
              onClick={deleteAccount}
              disabled={deletingAccount}
              className="mt-4 w-full rounded-2xl bg-red-600 py-3 font-black text-white transition hover:bg-red-500 disabled:opacity-60"
            >
              {deletingAccount ? "Wird gelöscht..." : "Account unwiderruflich löschen"}
            </button>
          </div>
        </section>
        <BottomNavigation />
      </main>
    </ProtectedRoute>
  );
}
