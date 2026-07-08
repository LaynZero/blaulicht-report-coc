"use client";

import { useEffect, useState } from "react";
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
import { Camera, HelpCircle, MessageCircle, Shield, Siren, Trash2 } from "lucide-react";

function resizeImageToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Bitte wähle ein Bild aus."));
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      reject(new Error("Das Bild ist zu groß. Bitte wähle ein Bild unter 4 MB."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Bild konnte nicht gelesen werden."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Bild konnte nicht verarbeitet werden."));
      img.onload = () => {
        const size = 320;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Bild konnte nicht verarbeitet werden."));
          return;
        }

        const sourceSize = Math.min(img.width, img.height);
        const sx = (img.width - sourceSize) / 2;
        const sy = (img.height - sourceSize) / 2;
        ctx.drawImage(img, sx, sy, sourceSize, sourceSize, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const { user, userData, refreshUserData } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [avatarDataUrl, setAvatarDataUrl] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [trustHelpOpen, setTrustHelpOpen] = useState(false);

  useEffect(() => {
    setDisplayName(userData?.displayName ?? "");
    setUsername(userData?.username ?? "");
    setBio(userData?.bio ?? "");
    setLocation(userData?.location ?? "");
    setAvatarDataUrl(userData?.avatarDataUrl ?? "");
  }, [userData]);

  async function saveProfile() {
    if (!user || !userData) return;
    const cleanName = displayName.trim();
    const cleanUsername = normalizeUsername(username);
    const oldUsername = userData.username;

    if (cleanName.length < 2) return alert("Der Name muss mindestens 2 Zeichen lang sein.");
    if (cleanUsername.length < 3 || cleanUsername.length > 20) return alert("Benutzername: 3–20 Zeichen, nur Buchstaben, Zahlen, _ und .");
    if (isReservedUsername(cleanUsername)) return alert("Dieser Benutzername ist reserviert.");

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
          avatarDataUrl,
        });
        await batch.commit();
      } else {
        await updateDoc(doc(db, "users", user.uid), {
          displayName: cleanName,
          bio: bio.trim(),
          location: location.trim(),
          avatarDataUrl,
        });
      }

      // Profilbilder speichern wir in Firestore. Firebase Auth photoURL darf keine langen Base64-Bilder enthalten.
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
              <UserAvatar src={avatarDataUrl || userData?.avatarDataUrl} name={userData?.displayName} size="xl" className="blue-glow" />
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
            <div className="glass-card rounded-2xl p-4 text-center"><Shield className="mx-auto mb-2 text-green-400" size={22} /><p className="text-xl font-bold">{userData?.confirmationsCount ?? 0}</p><p className="text-xs text-slate-400">Bestätigt</p></div>
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
                <UserAvatar src={avatarDataUrl} name={displayName} size="lg" />
                <div className="min-w-0 flex-1 space-y-2">
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black hover:bg-blue-500">
                    <Camera size={16} /> Bild auswählen
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        try {
                          setAvatarDataUrl(await resizeImageToDataUrl(file));
                        } catch (err) {
                          alert(err instanceof Error ? err.message : "Bild konnte nicht geladen werden.");
                        } finally {
                          event.target.value = "";
                        }
                      }}
                    />
                  </label>
                  {avatarDataUrl && (
                    <button type="button" onClick={() => setAvatarDataUrl("")} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-slate-200">
                      <Trash2 size={15} /> Entfernen
                    </button>
                  )}
                  <p className="text-xs text-slate-500">Das Bild wird automatisch verkleinert, damit Firestore speichersparend bleibt.</p>
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
            <button onClick={saveProfile} disabled={saving} className="w-full rounded-2xl bg-blue-600 py-3 font-black disabled:opacity-60">{saving ? "Speichert..." : "Profil speichern"}</button>
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
        </section>
        <BottomNavigation />
      </main>
    </ProtectedRoute>
  );
}
