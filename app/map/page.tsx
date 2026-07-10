"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { LocateFixed, Navigation } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { db } from "@/app/firebase";
import { categoryEmoji, formatRelativeTime, isReportExpired } from "@/lib/helpers";
import type { Report } from "@/lib/types";

const COCHEM_CENTER = { latitude: 50.1469, longitude: 7.1667 };

function hasCoords(report: Report) {
  return typeof report.latitude === "number" && typeof report.longitude === "number";
}

function mapPosition(report: Report, bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }) {
  const lat = report.latitude ?? COCHEM_CENTER.latitude;
  const lng = report.longitude ?? COCHEM_CENTER.longitude;
  const x = ((lng - bounds.minLng) / Math.max(0.0001, bounds.maxLng - bounds.minLng)) * 100;
  const y = (1 - (lat - bounds.minLat) / Math.max(0.0001, bounds.maxLat - bounds.minLat)) * 100;
  return { left: `${Math.min(94, Math.max(6, x))}%`, top: `${Math.min(88, Math.max(8, y))}%` };
}

function routeUrl(report: Report) {
  if (hasCoords(report)) return `https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`;
  if (report.location?.trim()) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(report.location)}`;
  return "";
}

export default function MapPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [onlyWithLocation, setOnlyWithLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<typeof COCHEM_CENTER | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(80)), (snap) => {
      setReports(snap.docs.map((item) => ({ id: item.id, ...item.data() }) as Report).filter((item) => item.status !== "hidden" && !isReportExpired(item.createdAt, item.pinnedIndefinitely)));
    });
    return () => unsub();
  }, []);

  const visibleReports = useMemo(() => reports.filter((report) => !onlyWithLocation || hasCoords(report) || report.location?.trim()), [reports, onlyWithLocation]);
  const markerReports = useMemo(() => visibleReports.filter(hasCoords).slice(0, 35), [visibleReports]);

  const bounds = useMemo(() => {
    const points = [COCHEM_CENTER, ...(userLocation ? [userLocation] : []), ...markerReports.map((report) => ({ latitude: report.latitude!, longitude: report.longitude! }))];
    const lats = points.map((p) => p.latitude);
    const lngs = points.map((p) => p.longitude);
    return {
      minLat: Math.min(...lats) - 0.035,
      maxLat: Math.max(...lats) + 0.035,
      minLng: Math.min(...lngs) - 0.055,
      maxLng: Math.max(...lngs) + 0.055,
    };
  }, [markerReports, userLocation]);

  const osmUrl = useMemo(() => {
    const bbox = [bounds.minLng, bounds.minLat, bounds.maxLng, bounds.maxLat].join(",");
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`;
  }, [bounds]);

  function useMyLocation() {
    if (!navigator.geolocation) return alert("Standort wird von deinem Browser nicht unterstützt.");
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => alert("Standort konnte nicht abgerufen werden."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 pb-28 pt-8 text-white">
      <section className="mx-auto max-w-md">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">Karte</p>
            <h1 className="text-3xl font-black">🗺️ Live-Karte</h1>
          </div>
          <button onClick={useMyLocation} className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black shadow-lg shadow-blue-600/25">
            <LocateFixed size={18} />
          </button>
        </div>

        <div className="mt-5 overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 shadow-2xl">
          <div className="relative h-96 bg-slate-900">
            <iframe
              title="Blaulicht Live-Karte"
              src={osmUrl}
              className="absolute inset-0 h-full w-full border-0 opacity-95"
              loading="lazy"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/10 via-transparent to-slate-950/25" />
            <div className="absolute left-4 top-4 rounded-2xl bg-slate-950/85 px-3 py-2 text-xs font-black text-slate-100 shadow-xl backdrop-blur">
              {markerReports.length} Marker · echte Kartenansicht
            </div>

            {userLocation && (
              <div className="absolute z-20 -translate-x-1/2 -translate-y-1/2" style={mapPosition({ id: "me", latitude: userLocation.latitude, longitude: userLocation.longitude } as Report, bounds)}>
                <div className="h-5 w-5 rounded-full border-4 border-white bg-blue-500 shadow-xl shadow-blue-500/50" title="Dein Standort" />
              </div>
            )}

            {markerReports.map((report) => (
              <a
                key={report.id}
                href={routeUrl(report)}
                target="_blank"
                className="group absolute z-10 -translate-x-1/2 -translate-y-1/2"
                style={mapPosition(report, bounds)}
                title={`${report.category} ${report.location || "ohne Ort"}`}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full border-4 border-slate-950 bg-red-600 text-xl shadow-xl shadow-red-500/30 transition group-hover:scale-110">
                  {categoryEmoji(report.category)}
                </div>
              </a>
            ))}

            {markerReports.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
                <div className="rounded-3xl bg-slate-950/70 p-5 backdrop-blur">
                  <p className="text-4xl">📍</p>
                  <p className="mt-2 font-black">Noch keine Standort-Marker</p>
                  <p className="mt-1 text-sm text-slate-400">Bei neuen Meldungen kannst du jetzt optional deinen aktuellen Standort für die Karte speichern.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <label className="mt-4 flex items-center justify-between rounded-2xl bg-slate-900 p-4 text-sm font-bold">
          Nur Meldungen mit Ort/Standort anzeigen
          <input type="checkbox" checked={onlyWithLocation} onChange={(e) => setOnlyWithLocation(e.target.checked)} className="h-5 w-5" />
        </label>

        <div className="mt-5 space-y-3">
          {visibleReports.map((report) => {
            const url = routeUrl(report);
            return (
              <div key={report.id} className="rounded-2xl bg-slate-900 p-4">
                <div className="flex justify-between gap-3">
                  <p className="min-w-0 break-words font-bold">{categoryEmoji(report.category)} {report.location || "Ohne Ort"}</p>
                  <p className="shrink-0 text-xs text-slate-500">{formatRelativeTime(report.createdAt)}</p>
                </div>
                <p className="mt-1 text-sm text-slate-400">{report.category}{report.locationSource === "current_location" ? " · Mein Standort" : hasCoords(report) ? " · Standort-Marker aktiv" : ""}</p>
                {url ? (
                  <a href={url} target="_blank" className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 py-3 text-sm font-black text-slate-200">
                    <Navigation size={16} /> Route öffnen
                  </a>
                ) : (
                  <p className="mt-3 rounded-xl bg-slate-950/60 p-3 text-center text-xs text-slate-500">Kein Ort hinterlegt.</p>
                )}
              </div>
            );
          })}
        </div>
      </section>
      <BottomNavigation />
    </main>
  );
}
