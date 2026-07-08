"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, doc, increment, serverTimestamp, updateDoc } from "firebase/firestore";
import { Camera, Mic, Siren, Square, Trash2 } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import MentionTextarea from "@/components/MentionTextarea";
import { useAuth } from "@/app/context/AuthContext";
import { db } from "@/app/firebase";
import { extractMentions, reportCategories, resizeImageToDataUrl } from "@/lib/helpers";
import { createMentionNotifications } from "@/lib/notifications";
import type { ReportCategory, ReportPostType } from "@/lib/types";

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function ReportPage() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [category, setCategory] = useState<ReportCategory>("Verkehrskontrolle");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [official, setOfficial] = useState(false);
  const [emergency, setEmergency] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioDataUrl, setAudioDataUrl] = useState("");
  const [audioMimeType, setAudioMimeType] = useState("");
  const [audioDurationSeconds, setAudioDurationSeconds] = useState(0);
  const recordingStartedAtRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const canMakeOfficialPost = userData?.role === "admin" || userData?.role === "developer";
  const canMakeEmergencyPost = canMakeOfficialPost;
  const banned = userData?.banned === true;
  const hasAudio = Boolean(audioDataUrl);

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia) return alert("Dein Browser unterstützt Sprachnachrichten leider nicht.");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRecorderRef.current = recorder;
      recordingStartedAtRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const dataUrl = await blobToDataUrl(blob);
        setAudioDataUrl(dataUrl);
        setAudioMimeType(blob.type);
        setAudioDurationSeconds(recordingStartedAtRef.current ? Math.max(1, Math.round((Date.now() - recordingStartedAtRef.current) / 1000)) : 0);
        recordingStartedAtRef.current = null;
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      alert("Mikrofon-Zugriff wurde verweigert oder ist nicht verfügbar.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }

  async function createReport(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !userData) return;
    if (banned) return alert("Dein Account ist gesperrt. Du kannst keine Beiträge mehr erstellen.");
    if (!hasAudio && description.trim().length < 1) return alert("Bitte schreibe mindestens 1 Zeichen oder nimm eine Sprachnachricht auf.");
    if (audioDataUrl.length > 850000) return alert("Die Sprachnachricht ist zu lang. Bitte nimm sie kürzer auf, damit sie in Firestore gespeichert werden kann.");
    if (imageDataUrl.length > 850000) return alert("Das Bild ist noch zu groß. Bitte wähle ein kleineres Bild.");

    setLoading(true);
    try {
      const finalOfficial = Boolean(official && canMakeOfficialPost) || Boolean(emergency && canMakeEmergencyPost);
      const finalEmergency = Boolean(emergency && canMakeEmergencyPost);
      const postType: ReportPostType = finalEmergency && hasAudio ? "emergency_voice" : finalEmergency ? "emergency" : finalOfficial && hasAudio ? "official_voice" : finalOfficial ? "official" : hasAudio ? "voice" : "report";
      const mentionUsernames = extractMentions(description);

      const reportRef = await addDoc(collection(db, "reports"), {
        category,
        location: location.trim(),
        description: description.trim(),
        authorId: user.uid,
        authorName: userData.displayName,
        authorRole: userData.role,
        authorUsername: userData.username,
        authorAvatarDataUrl: userData.avatarDataUrl || "",
        confirmations: [],
        confirmedBy: [],
        outdatedBy: [],
        reports: [],
        commentsCount: 0,
        status: "new",
        pinned: finalOfficial,
        official: finalOfficial,
        emergency: finalEmergency,
        postType,
        imageDataUrl: imageDataUrl || "",
        mentions: mentionUsernames,
        audioDataUrl: audioDataUrl || "",
        audioMimeType: audioMimeType || "",
        audioDurationSeconds: audioDurationSeconds || 0,
        latitude: null,
        longitude: null,
        locationSource: "manual",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "users", user.uid), {
        reportsCount: increment(1),
        trustPoints: increment(finalEmergency ? 15 : finalOfficial ? 8 : 5),
      });

      await createMentionNotifications({
        mentions: mentionUsernames,
        actorId: user.uid,
        actorName: userData.displayName,
        text: description.trim() || (hasAudio ? "Sprachnachricht" : "Neue Meldung"),
        reportId: reportRef.id,
        source: "report",
      });

      fetch("/api/push/report-created", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: reportRef.id, authorId: user.uid }),
      }).catch(() => undefined);

      router.push("/");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Meldung konnte nicht erstellt werden. Falls dein Account gerade gesperrt wurde, ist das Posten nicht mehr erlaubt.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-slate-950 px-5 pb-28 pt-8 text-white">
        <form onSubmit={createReport} className="mx-auto max-w-md space-y-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">Neue Meldung</p>
            <h1 className="text-3xl font-black">🚨 Was ist los?</h1>
            <p className="mt-2 text-sm text-slate-400">Bitte nur echte, aktuelle und hilfreiche Meldungen posten. Erwähnungen gehen mit @username.</p>
          </div>

          {banned && <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-bold text-red-200">Dein Account ist gesperrt. Du kannst keine Beiträge mehr erstellen.</div>}

          {canMakeOfficialPost && (
            <div className="space-y-3">
              <label className="flex items-start gap-3 rounded-2xl border border-blue-400/30 bg-blue-600/10 p-4">
                <input type="checkbox" checked={official} onChange={(e) => setOfficial(e.target.checked)} className="mt-1 h-5 w-5" />
                <span><b>Offiziellen Admin/Entwickler-Post erstellen</b><span className="mt-1 block text-sm text-slate-400">Der Beitrag wird hervorgehoben und oben angepinnt.</span></span>
              </label>
              <label className="flex items-start gap-3 rounded-2xl border border-red-400/40 bg-red-600/15 p-4">
                <input type="checkbox" checked={emergency} onChange={(e) => setEmergency(e.target.checked)} className="mt-1 h-5 w-5" />
                <span><b className="inline-flex items-center gap-2"><Siren size={17} /> Eilmeldung</b><span className="mt-1 block text-sm text-red-100/80">Nur für wirklich wichtige Warnungen. Wird rot markiert, bestätigt, angepinnt und an alle Push-Empfänger gesendet.</span></span>
              </label>
            </div>
          )}

          <div>
            <label className="mb-2 block font-bold">Kategorie</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as ReportCategory)} className="w-full rounded-2xl border border-slate-700 bg-slate-900 p-4">
              {reportCategories.map((item) => <option key={item.value} value={item.value}>{item.icon} {item.label}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-bold">Ort <span className="text-sm font-normal text-slate-500">optional</span></label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-900 p-4" placeholder="z.B. Cochem B49, Zell Brücke oder frei lassen" />
          </div>

          <div>
            <label className="mb-2 block font-bold">Beschreibung <span className="text-sm font-normal text-slate-500">mind. 1 Zeichen oder Audio</span></label>
            <MentionTextarea
              value={description}
              onChange={setDescription}
              rows={5}
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 p-4 outline-none focus:border-blue-500"
              placeholder="z.B. AVK, Blitzer B49, Stau Richtung Cochem, @it..."
            />
            <p className="mt-2 text-xs text-slate-500">Tipp: Tippe @ und die ersten Buchstaben, um Nutzer direkt zu erwähnen.</p>
          </div>

          <div className="rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-4">
            <p className="mb-3 font-black">📷 Foto hinzufügen</p>
            {imageDataUrl ? (
              <div className="space-y-3">
                <img src={imageDataUrl} alt="Vorschau" className="max-h-72 w-full rounded-2xl object-cover" />
                <button type="button" onClick={() => setImageDataUrl("")} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 py-2 text-sm font-bold"><Trash2 size={15} /> Bild löschen</button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-cyan-600 py-3 font-black hover:bg-cyan-500">
                <Camera size={18} /> Bild auswählen
                <input type="file" accept="image/*" className="hidden" disabled={banned} onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  try { setImageDataUrl(await resizeImageToDataUrl(file)); }
                  catch (err) { alert(err instanceof Error ? err.message : "Bild konnte nicht verarbeitet werden."); }
                  finally { event.target.value = ""; }
                }} />
              </label>
            )}
            <p className="mt-3 text-xs text-slate-400">Fotos werden automatisch verkleinert, damit die App speichersparend bleibt.</p>
          </div>

          <div className="rounded-3xl border border-violet-400/20 bg-violet-500/10 p-4">
            <p className="mb-3 font-black">🎙️ Sprachnachricht statt Text</p>
            <p className="mb-4 text-sm text-slate-400">Für den Anfang wird Audio direkt in Firestore gespeichert. Nimm es deshalb kurz auf, am besten unter 30–45 Sekunden.</p>
            {!isRecording ? (
              <button type="button" onClick={startRecording} disabled={banned} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 py-3 font-black disabled:opacity-50"><Mic size={18} /> Aufnahme starten</button>
            ) : (
              <button type="button" onClick={stopRecording} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-3 font-black"><Square size={18} /> Aufnahme stoppen</button>
            )}
            {audioDataUrl && (
              <div className="mt-4 rounded-2xl bg-slate-950/60 p-3">
                <audio src={audioDataUrl} controls className="w-full" />
                <button type="button" onClick={() => { setAudioDataUrl(""); setAudioMimeType(""); setAudioDurationSeconds(0); }} className="mt-3 w-full rounded-xl bg-slate-800 py-2 text-sm font-bold">Aufnahme löschen</button>
              </div>
            )}
          </div>

          <button disabled={loading || banned} className={`w-full rounded-2xl py-4 text-lg font-black shadow-lg disabled:opacity-60 ${emergency ? "bg-red-600 shadow-red-600/30" : "bg-blue-600 shadow-blue-600/30"}`}>
            {loading ? "Wird veröffentlicht..." : emergency ? "🚨 Eilmeldung veröffentlichen" : official ? "Offiziellen Post veröffentlichen" : "Meldung veröffentlichen"}
          </button>
        </form>
        <BottomNavigation />
      </main>
    </ProtectedRoute>
  );
}
