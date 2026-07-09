import { NextResponse } from "next/server";
import { getAdmin, getRequester, jsonError } from "@/lib/server/adminAuth";
import { AdminActionError, applyRoleChange, removeUserAccount } from "@/lib/server/adminUserActions";
import { banDevices, unbanDevices } from "@/lib/server/deviceBan";
import type { UserRole } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = getAdmin();
  if (!admin) return jsonError("FIREBASE_SERVICE_ACCOUNT_KEY fehlt oder ist ungültig.", 500);

  try {
    const requester = await getRequester(request, admin);
    if (!requester) return jsonError("Kein Zugriff.", 403);

    const body = (await request.json()) as {
      action?: "setRole" | "deleteUser" | "banDevice" | "unbanDevice";
      uid?: string;
      role?: UserRole;
    };

    const uid = body.uid?.trim();
    if (!uid) return jsonError("Nutzer-ID fehlt.", 400);

    if (body.action === "setRole") {
      const nextRole = body.role;
      if (nextRole !== "user" && nextRole !== "admin" && nextRole !== "developer") {
        return jsonError("Ungültige Rolle.", 400);
      }
      const role = await applyRoleChange(admin, requester, uid, nextRole);
      return NextResponse.json({ ok: true, role });
    }

    if (body.action === "deleteUser") {
      await removeUserAccount(admin, requester, uid);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "banDevice" || body.action === "unbanDevice") {
      const targetSnap = await admin.firestore.collection("users").doc(uid).get();
      if (!targetSnap.exists) return jsonError("Nutzer nicht gefunden.", 404);

      const target = targetSnap.data() as { deviceIds?: string[]; role?: UserRole };
      if (target.role === "developer") return jsonError("Entwickler-Geräte können nicht gesperrt werden.", 403);

      const deviceIds = Array.isArray(target.deviceIds) ? target.deviceIds : [];
      if (!deviceIds.length) return jsonError("Für diesen Nutzer sind keine Geräte bekannt (noch nicht eingeloggt seit Einführung dieser Funktion).", 400);

      if (body.action === "banDevice") await banDevices(admin, deviceIds, requester.uid, uid);
      else await unbanDevices(admin, deviceIds);
      await admin.firestore.collection("users").doc(uid).update({ deviceBanned: body.action === "banDevice" });

      return NextResponse.json({ ok: true, deviceCount: deviceIds.length });
    }

    return jsonError("Unbekannte Aktion.", 400);
  } catch (error) {
    if (error instanceof AdminActionError) return jsonError(error.message, error.status);
    return jsonError(error instanceof Error ? error.message : "Admin-Aktion fehlgeschlagen.", 500);
  }
}
