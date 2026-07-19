import { Capacitor } from "@capacitor/core";

/** True when running inside the native iOS (or Android, if ever added) Capacitor wrapper — false in the regular browser/installed PWA. */
export function isNativeApp(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/**
 * Registers for native push notifications via APNs, bridged through Firebase
 * Cloud Messaging — so the resulting token is a normal FCM token and works
 * with the existing server-side push routes (/api/push/*) completely
 * unchanged. Returns the FCM token, or null if permission was denied.
 */
export async function registerNativePush(): Promise<string | null> {
  if (!isNativeApp()) return null;

  const { FirebaseMessaging } = await import("@capacitor-firebase/messaging");

  const permission = await FirebaseMessaging.requestPermissions();
  if (permission.receive !== "granted") return null;

  const { token } = await FirebaseMessaging.getToken();
  return token || null;
}

/**
 * Shares a report using the native iOS share sheet (Messages, WhatsApp, Mail,
 * AirDrop, etc.) when running in the native app. Falls back to the standard
 * Web Share API (already used for Android/browser) otherwise — callers
 * should keep their existing navigator.share fallback for that case.
 */
export async function shareNative(options: { title: string; text: string; url: string }): Promise<boolean> {
  if (!isNativeApp()) return false;

  const { Share } = await import("@capacitor/share");
  await Share.share(options);
  return true;
}
