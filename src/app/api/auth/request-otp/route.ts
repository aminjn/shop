import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { normalizeMobile, seal, hashOtp, OTP_COOKIE, type OtpChallenge } from "@/lib/auth";
import { sendOtp, smsConfig } from "@/lib/ippanel";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const mobile = normalizeMobile(body?.mobile || "");
  if (!mobile) return NextResponse.json({ ok: false, error: "invalid-mobile" }, { status: 400 });

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
    // Dev / not configured: return the code so login can be tested without SMS.
    return NextResponse.json({ ok: true, sent: false, devCode: code });
  }
  const r = await sendOtp(mobile, code);
  if (!r.ok) return NextResponse.json({ ok: false, error: r.error || "send-failed" }, { status: 502 });
  return NextResponse.json({ ok: true, sent: true });
}
