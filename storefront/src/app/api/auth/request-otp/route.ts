import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { normalizeMobile, seal, hashOtp, isSuperAdmin, OTP_COOKIE, type OtpChallenge } from "@/lib/auth";
import { sendOtp, smsConfig } from "@/lib/ippanel";
import { userExists } from "@/lib/userstore";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const mobile = normalizeMobile(body?.mobile || "");
  if (!mobile) return NextResponse.json({ ok: false, error: "invalid-mobile" }, { status: 400 });

  // New customers must verify their identity (Shahkar) first — no OTP yet.
  // Existing accounts and the super admin go straight to OTP login.
  if (!userExists(mobile) && !isSuperAdmin(mobile)) {
    return NextResponse.json({ ok: true, exists: false });
  }

  const code = String(Math.floor(10000 + Math.random() * 90000)); // 5 digits
  const exp = Math.floor(Date.now() / 1000) + 180; // 3 minutes
  const store = await cookies();
  store.set(OTP_COOKIE, seal({ m: mobile, h: hashOtp(code, mobile), exp } satisfies OtpChallenge), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 180,
  });

  const cfg = smsConfig();
  if (!cfg.configured) {
    return NextResponse.json({ ok: false, error: "sms-not-configured" }, { status: 503 });
  }
  const r = await sendOtp(mobile, code);
  if (!r.ok) return NextResponse.json({ ok: false, error: r.error || "send-failed" }, { status: 502 });
  return NextResponse.json({ ok: true, sent: true, exists: true });
}
