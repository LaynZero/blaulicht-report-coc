import { NextResponse } from "next/server";
import { getAdmin, jsonError } from "@/lib/server/adminAuth";
import { isDeviceBanned } from "@/lib/server/deviceBan";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = getAdmin();
  if (!admin) return jsonError("FIREBASE_SERVICE_ACCOUNT_KEY fehlt oder ist ungültig.", 500);

  try {
    const body = (await request.json()) as { deviceId?: string };
    const deviceId = (body.deviceId || "").trim().slice(0, 100);
    if (!deviceId) return NextResponse.json({ ok: true, banned: false });

    const banned = await isDeviceBanned(admin, deviceId);
    return NextResponse.json({ ok: true, banned });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Gerätestatus konnte nicht geprüft werden.", 500);
  }
}
