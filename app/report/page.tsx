"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Mic, Siren, Square, Trash2 } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import MentionTextarea from "@/components/MentionTextarea";
import { useAuth } from "@/app/context/AuthContext";
import { reportCategories } from "@/lib/helpers";
import { uploadReportAudio, uploadReportImage } from "@/lib/upload";
import { createMentionNotifications } from "@/lib/notifications";
import type { ReportCategory } from "@/lib/types";

const MAX_SOURCE_IMAGE_BYTES = 15 * 1024 * 1024;

export default function ReportPage() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [category, setCategory] = useState<ReportCategory>("Stau");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [official, setOfficial] = useState(false);
  const [emergency, setEmergency] = useState(false);
  const [loading, setLoading] = useState(false);

  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [imageUploading, setImageUploading] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [audioPreview, setAudioPreview] = useState("");
  const [audioMimeType, setAudioMimeType] = useState("");
  const [audioDurationSeconds, setAudioDurationSeconds] = useState(0);
  const [audioUploading, setAudioUploading] = useState(false);

  const recordingStartedAtRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const canMakeOfficialPost = userData?.role === "admin" || userData?.role === "developer";
  const banned = userData?.banned === true;
  const hasAudio = Boolean(audioUrl);
  const busy = loading || imageUploading || audioUploading;

  async function handleImageSelect(file: File) {
    if (file.size > MAX_SOURCE_IMAGE_BYTES) return alert("Das Bild ist zu groß. Bitte wähle ein Bild unter 15 MB.");
    if (!user) return;

    const localPreview = URL.createObjectURL(file);
    setImagePreview(localPreview);
    setImageUploading(true);
    try {
      const url = await uploadReportImage(file, user.uid);
      setImageUrl(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Bild konnte nicht hochgeladen werden.");
      setImagePreview("");
    } finally {
      setImageUploading(false);
    }
  }

  function removeImage() {
    setImageUrl("");
    setImagePreview("");
  }

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
        const durationSeconds = recordingStartedAtRef.current ? Math.max(1, Math.round((Date.now() - recordingStartedAtRef.current) / 1000)) : 0;
        recordingStartedAtRef.current = null;
        stream.getTracks().forEach((track) => track.stop());

        setAudioMimeType(blob.type);
        setAudioDurationSeconds(durationSeconds);
        setAudioPreview(URL.createObjectURL(blob));

        if (!user) return;
        setAudioUploading(true);
        try {
          const url = await uploadReportAudio(blob, user.uid, blob.type);
          setAudioUrl(url);
        } catch (err) {
          alert(err instanceof Error ? err.message : "Sprachnachricht konnte nicht hochgeladen werden.");
          setAudioPreview("");
        } finally {
          setAudioUploading(false);
        }
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

  function removeAudio() {
    setAudioUrl("");
    setAudioPreview("");
    setAudioMimeType("");
    setAudioDurationSeconds(0);
  }

  async function createReport(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !userData) return;
    if (banned) return alert("Dein Account ist gesperrt. Du kannst keine Beiträge mehr erstellen.");
    if (imageUploading || audioUploading) return alert("Bitte warte, bis der Upload abgeschlossen ist.");
    if (!hasAudio && description.trim().length < 1) return alert("Bitte schreibe mindestens 1 Zeichen oder nimm eine Sprachnachricht auf.");

    setLoading(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/reports/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          category,
          location,
          description,
          imageUrl,
          audioUrl,
          audioMimeType,
          audioDurationSeconds,
          official,
          emergency,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || "Meldung konnte nicht erstellt werden.");

      await createMentionNotifications({
        mentions: data.mentions || [],
        actorId: user.uid,
        actorName: userData.displayName,
        text: description.trim() || (hasAudio ? "Sprachnachricht" : "Neue Meldung"),
        reportId: data.reportId,
        source: "report",
      });

      fetch("/api/push/report-created", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: data.reportId, authorId: user.uid }),
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
            {imagePreview ? (
              <div className="space-y-3">
                <div className="relative">
                  <img src={imagePreview} alt="Vorschau" className="max-h-72 w-full rounded-2xl object-cover" />
                  {imageUploading && (
                    <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-2xl bg-slate-950/60 text-sm font-bold">
                      <Loader2 size={18} className="animate-spin" /> Wird hochgeladen...
                    </div>
                  )}
                </div>
                <button type="button" onClick={removeImage} disabled={imageUploading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 py-2 text-sm font-bold disabled:opacity-50"><Trash2 size={15} /> Bild löschen</button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-cyan-600 py-3 font-black hover:bg-cyan-500">
                <Camera size={18} /> Bild auswählen
                <input type="file" accept="image/*" className="hidden" disabled={banned} onChange={async (event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  await handleImageSelect(file);
                }} />
              </label>
            )}
            <p className="mt-3 text-xs text-slate-400">Fotos werden automatisch verkleinert und in Firebase Storage hochgeladen.</p>
          </div>

          <div className="rounded-3xl border border-violet-400/20 bg-violet-500/10 p-4">
            <p className="mb-3 font-black">🎙️ Sprachnachricht statt Text</p>
            <p className="mb-4 text-sm text-slate-400">Am besten unter 30–45 Sekunden aufnehmen.</p>
            {!isRecording ? (
              <button type="button" onClick={startRecording} disabled={banned} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 py-3 font-black disabled:opacity-50"><Mic size={18} /> Aufnahme starten</button>
            ) : (
              <button type="button" onClick={stopRecording} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-3 font-black"><Square size={18} /> Aufnahme stoppen</button>
            )}
            {audioPreview && (
              <div className="mt-4 rounded-2xl bg-slate-950/60 p-3">
                <audio src={audioPreview} controls className="w-full" />
                {audioUploading && <p className="mt-2 flex items-center gap-2 text-sm font-bold text-violet-200"><Loader2 size={15} className="animate-spin" /> Wird hochgeladen...</p>}
                <button type="button" onClick={removeAudio} disabled={audioUploading} className="mt-3 w-full rounded-xl bg-slate-800 py-2 text-sm font-bold disabled:opacity-50">Aufnahme löschen</button>
              </div>
            )}
          </div>

          <button disabled={busy || banned} className={`w-full rounded-2xl py-4 text-lg font-black shadow-lg disabled:opacity-60 ${emergency ? "bg-red-600 shadow-red-600/30" : "bg-blue-600 shadow-blue-600/30"}`}>
            {loading ? "Wird veröffentlicht..." : imageUploading || audioUploading ? "Upload läuft..." : emergency ? "🚨 Eilmeldung veröffentlichen" : official ? "Offiziellen Post veröffentlichen" : "Meldung veröffentlichen"}
          </button>
        </form>
        <BottomNavigation />
      </main>
    </ProtectedRoute>
  );
}
