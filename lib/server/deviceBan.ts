import type { AdminContext } from "./adminAuth";
import { FieldValue } from "firebase-admin/firestore";

/** Checks whether a given device ID is currently on the ban list. */
export async function isDeviceBanned(admin: AdminContext, deviceId: string): Promise<boolean> {
  if (!deviceId) return false;
  const snap = await admin.firestore.collection("bannedDevices").doc(deviceId).get();
  return snap.exists;
}

/** Bans one or more device IDs, recording which user triggered it and which accounts were linked to them. */
export async function banDevices(admin: AdminContext, deviceIds: string[], bannedByUid: string, relatedUserId: string) {
  const uniqueIds = [...new Set(deviceIds)].filter(Boolean).slice(0, 20);
  if (!uniqueIds.length) return;

  const batch = admin.firestore.batch();
  uniqueIds.forEach((deviceId) => {
    const ref = admin.firestore.collection("bannedDevices").doc(deviceId);
    batch.set(
      ref,
      {
        bannedAt: FieldValue.serverTimestamp(),
        bannedBy: bannedByUid,
        relatedUserIds: FieldValue.arrayUnion(relatedUserId),
      },
      { merge: true },
    );
  });
  await batch.commit();
}

/** Removes device IDs from the ban list (e.g. when an admin unbans a user and wants to lift the device block too). */
export async function unbanDevices(admin: AdminContext, deviceIds: string[]) {
  const uniqueIds = [...new Set(deviceIds)].filter(Boolean).slice(0, 20);
  if (!uniqueIds.length) return;

  const batch = admin.firestore.batch();
  uniqueIds.forEach((deviceId) => batch.delete(admin.firestore.collection("bannedDevices").doc(deviceId)));
  await batch.commit();
}
