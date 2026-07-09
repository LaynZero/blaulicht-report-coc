import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { ensureAdminApp } from "./firebaseAdmin";

export type MessagingContext = {
  firestore: ReturnType<typeof getFirestore>;
  messaging: ReturnType<typeof getMessaging>;
};

/**
 * Initializes (once) and returns the Firebase Admin SDK context scoped to
 * firestore + messaging. Returns null if FIREBASE_SERVICE_ACCOUNT_KEY is
 * missing/invalid so callers can respond with a soft "push disabled" result
 * instead of throwing.
 */
export function getMessagingAdmin(): MessagingContext | null {
  if (!ensureAdminApp()) return null;
  return { firestore: getFirestore(), messaging: getMessaging() };
}

export { getOrigin, chunk } from "./firebaseAdmin";
