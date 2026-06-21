import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  normalizeMobile,
  unseal,
  hashOtp,
  isSuperAdmin,
  setSession,
  OTP_COOKIE,
  type OtpChallenge,
} from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const mobile = normalizeMobile(body?.mobile || "");
  const code = String(body?.code || "").trim();
  if (!mobile || !code) return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });

  const store = await cookies();
  const ch = unseal<OtpChallenge>(store.get(OTP_COOKIE)?.value);
  if (!ch || ch.m !== mobile || ch.exp < Math.floor(Date.now() / 1000)) {
    return NextResponse.json({ ok: false, error: "expired" }, { status: 400 });
  }
  if (hashOtp(code, mobile) !== ch.h) {
    return NextResponse.json({ ok: false, error: "wrong-code" }, { status: 401 });
  }

  const role = isSuperAdmin(mobile) ? "super_admin" : "customer";
  await setSession(mobile, role);
  store.delete(OTP_COOKIE);
  return NextResponse.json({ ok: true, role });
}
