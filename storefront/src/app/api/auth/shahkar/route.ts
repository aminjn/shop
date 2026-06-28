import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { normalizeMobile, seal, hashOtp, OTP_COOKIE, type OtpChallenge } from "@/lib/auth";
import { sendOtp, smsConfig } from "@/lib/ippanel";
import { getIdentity, shahkarMatch, podConfigured, podMissing, isValidNationalId } from "@/lib/podium";
import { userExists, setPending, nowIso, type UserIdentity } from "@/lib/userstore";

const faToEn = (v: string) => (v || "").replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));

/** New customer: civil-registry lookup + Shahkar match, then store the pending
 *  registration and send the OTP. Body: { mobile, nationalCode, birthDate } */
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const mobile = normalizeMobile(b?.mobile || "");
  if (!mobile) return NextResponse.json({ ok: false, error: "شماره موبایل معتبر نیست." }, { status: 400 });

  const nid = faToEn(String(b?.nationalCode || "")).replace(/[^0-9]/g, "");
  if (nid.length !== 10 || !isValidNationalId(nid)) return NextResponse.json({ ok: false, error: "کد ملی نامعتبر است." }, { status: 400 });
  const jbd = faToEn(String(b?.birthDate || "")).replace(/[^0-9]/g, "");
  if (jbd.length !== 8) return NextResponse.json({ ok: false, error: "تاریخ تولد (شمسی) را کامل وارد کن: مثل ۱۳۷۰/۰۱/۰۱" }, { status: 400 });

  if (userExists(mobile)) return NextResponse.json({ ok: false, error: "این شماره قبلاً ثبت شده؛ از گزینهٔ ورود استفاده کن." }, { status: 400 });

  if (!podConfigured()) {
    return NextResponse.json({ ok: false, needsConfig: true, error: "سرویس احراز هویت پیکربندی نشده: " + podMissing().join("، ") }, { status: 503 });
  }

  const idn = await getIdentity(nid, jbd);
  if (!idn.ok || !idn.identity) return NextResponse.json({ ok: false, error: idn.error || "استعلام هویت ناموفق بود." }, { status: 400 });

  const m = await shahkarMatch(nid, mobile);
  if (!m.ok) return NextResponse.json({ ok: false, error: m.error || "سرویس شاهکار پاسخ نداد." }, { status: 502 });
  if (!m.matched) return NextResponse.json({ ok: false, error: "این شماره موبایل به نامِ این کد ملی نیست؛ با شماره‌ی متعلق به خودت اقدام کن." }, { status: 400 });

  const identity: UserIdentity = {
    nationalId: nid,
    firstName: idn.identity.firstName || "",
    lastName: idn.identity.lastName || "",
    fatherName: idn.identity.fatherName || "",
    gender: idn.identity.gender || "",
    birthDate: idn.identity.birthDate || jbd,
    birthPlace: idn.identity.birthPlace || "",
    raw: idn.identity.raw,
    verifiedAt: nowIso(),
  };
  setPending({ mobile, identity, matched: true, createdAt: nowIso() });

  // send the OTP (same cookie-based challenge as login)
  const cfg = smsConfig();
  if (!cfg.configured) return NextResponse.json({ ok: false, error: "سرویس پیامک هنوز تنظیم نشده است." }, { status: 503 });
  const code = String(Math.floor(10000 + Math.random() * 90000));
  const exp = Math.floor(Date.now() / 1000) + 180;
  const store = await cookies();
  store.set(OTP_COOKIE, seal({ m: mobile, h: hashOtp(code, mobile), exp } satisfies OtpChallenge), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 180,
  });
  const r = await sendOtp(mobile, code);
  if (!r.ok) return NextResponse.json({ ok: false, error: "ارسال کد ناموفق بود." }, { status: 502 });

  return NextResponse.json({ ok: true, name: `${identity.firstName} ${identity.lastName}`.trim() });
}
