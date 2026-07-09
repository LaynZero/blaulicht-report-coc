import { deleteObject, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/app/firebase";

/**
 * Resizes an image file down to maxSize on its longest edge and re-encodes
 * it as JPEG, returning a Blob ready for upload. Keeping this as a Blob
 * (instead of a base64 data URL) avoids the ~33% size overhead of base64
 * encoding, on top of no longer needing to fit inside a Firestore document.
 */
export function resizeImageToBlob(file: File, maxSize = 1600, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("Bitte wähle ein Bild aus."));

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Bild konnte nicht verarbeitet werden."));
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Bild konnte nicht verarbeitet werden."))), "image/jpeg", quality);
      };
      img.onerror = () => reject(new Error("Bild konnte nicht geladen werden."));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error("Bild konnte nicht gelesen werden."));
    reader.readAsDataURL(file);
  });
}

/** Center-crops an image file to a square and re-encodes it as JPEG. Used for avatars. */
export function resizeImageToSquareBlob(file: File, size = 320, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("Bitte wähle ein Bild aus."));
    if (file.size > 8 * 1024 * 1024) return reject(new Error("Das Bild ist zu groß. Bitte wähle ein Bild unter 8 MB."));

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Bild konnte nicht verarbeitet werden."));

        const sourceSize = Math.min(img.width, img.height);
        const sx = (img.width - sourceSize) / 2;
        const sy = (img.height - sourceSize) / 2;
        ctx.drawImage(img, sx, sy, sourceSize, sourceSize, 0, 0, size, size);
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Bild konnte nicht verarbeitet werden."))), "image/jpeg", quality);
      };
      img.onerror = () => reject(new Error("Bild konnte nicht verarbeitet werden."));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error("Bild konnte nicht gelesen werden."));
    reader.readAsDataURL(file);
  });
}

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

async function uploadBlob(path: string, blob: Blob, contentType: string, onProgress?: (pct: number) => void) {
  const storageRef = ref(storage, path);
  const task = uploadBytesResumable(storageRef, blob, { contentType });

  await new Promise<void>((resolve, reject) => {
    task.on(
      "state_changed",
      (snapshot) => onProgress?.(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)),
      reject,
      () => resolve(),
    );
  });

  return getDownloadURL(storageRef);
}

/** Resizes + uploads a report photo, returns the public download URL. */
export async function uploadReportImage(file: File, uid: string, onProgress?: (pct: number) => void) {
  const blob = await resizeImageToBlob(file);
  const path = `reports/${uid}/${Date.now()}-${randomId()}.jpg`;
  return uploadBlob(path, blob, "image/jpeg", onProgress);
}

/** Uploads a recorded voice message blob, returns the public download URL. */
export async function uploadReportAudio(blob: Blob, uid: string, mimeType: string, onProgress?: (pct: number) => void) {
  const extension = mimeType.includes("mp4") ? "m4a" : "webm";
  const path = `reports/${uid}/${Date.now()}-${randomId()}.${extension}`;
  return uploadBlob(path, blob, mimeType || "audio/webm", onProgress);
}

/** Resizes + uploads a profile avatar, returns the public download URL. */
export async function uploadAvatarImage(file: File, uid: string, onProgress?: (pct: number) => void) {
  const blob = await resizeImageToSquareBlob(file);
  const path = `avatars/${uid}/avatar-${Date.now()}.jpg`;
  return uploadBlob(path, blob, "image/jpeg", onProgress);
}

/** Best-effort delete of a previously uploaded file. Ignores errors (e.g. legacy base64 "URLs" that aren't Storage paths). */
export async function deleteUploadedFile(downloadUrl: string) {
  if (!downloadUrl.startsWith("https://firebasestorage.googleapis.com/") && !downloadUrl.includes("storage.googleapis.com")) return;
  try {
    await deleteObject(ref(storage, downloadUrl));
  } catch {
    // Not fatal: orphaned file, already deleted, or missing permissions.
  }
}
