import type { ReportCategory } from "./types";

export const reportCategories: { value: ReportCategory; label: string; icon: string }[] = [
  { value: "Verkehrskontrolle", label: "Verkehrskontrolle", icon: "🚓" },
  { value: "Blitzer", label: "Blitzer", icon: "📸" },
  { value: "Unfall", label: "Unfall", icon: "🚨" },
  { value: "Stau", label: "Stau", icon: "🚧" },
  { value: "Baustelle", label: "Baustelle", icon: "🏗️" },
  { value: "Feuerwehr", label: "Feuerwehr", icon: "🚒" },
  { value: "Rettungsdienst", label: "Rettungsdienst", icon: "🚑" },
  { value: "Sonstiges", label: "Sonstiges", icon: "❓" },
];

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_.]/g, "");
}

export function isReservedUsername(username: string) {
  return ["admin", "administrator", "entwickler", "developer", "polizei", "polizei-cochem", "it-span", "itspan", "support", "moderator", "blaulicht", "coc"].includes(username);
}

export function formatRelativeTime(value: unknown) {
  if (!value || typeof value !== "object" || !("toDate" in value) || typeof value.toDate !== "function") return "gerade eben";
  const date = value.toDate() as Date;
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return "gerade eben";
  if (minutes < 60) return `vor ${minutes} Min.`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  return `vor ${days} Tg.`;
}

export function categoryEmoji(category: string) {
  return reportCategories.find((item) => item.value === category)?.icon ?? "🚨";
}

export function extractMentions(text: string) {
  const matches = text.match(/@[a-z0-9_.]{3,20}/gi) ?? [];
  return [...new Set(matches.map((item) => normalizeUsername(item.replace('@', ''))))];
}

export function resizeImageToDataUrl(file: File, maxSize = 1100, quality = 0.72) {
  return new Promise<string>((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Bitte wähle ein Bild aus.'));
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Bild konnte nicht verarbeitet werden.'));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Bild konnte nicht geladen werden.'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('Bild konnte nicht gelesen werden.'));
    reader.readAsDataURL(file);
  });
}
