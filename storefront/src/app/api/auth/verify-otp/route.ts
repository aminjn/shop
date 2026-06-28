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
import { userExists, getPending, deletePending, getUser, saveUser, notify } from "@/lib/userstore";

const faToEn = (v: string) => (v || "").replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const mobile = normalizeMobile(body?.mobile || "");
  const code = faToEn(String(body?.code || "")).trim();
  if (!mobile || !code) return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });

  const store = await cookies();
  const ch = unseal<OtpChallenge>(store.get(OTP_COOKIE)?.value);
  if (!ch || ch.m !== mobile || ch.exp < Math.floor(Date.now() / 1000)) {
    return NextResponse.json({ ok: false, error: "expired" }, { status: 400 });
  }
  if (hashOtp(code, mobile) !== ch.h) {
    return NextResponse.json({ ok: false, error: "wrong-code" }, { status: 401 });
  }

  const superAdmin = isSuperAdmin(mobile);
  // Blocked accounts cannot sign in.
  if (!superAdmin && userExists(mobile) && getUser(mobile).status === "blocked") {
    return NextResponse.json({ ok: false, error: "blocked" }, { status: 403 });
  }
  // New customer (no account yet): require a Shahkar-verified pending record,
  // then create the account with the official identity (immutable).
  if (!superAdmin && !userExists(mobile)) {
    const pending = getPending(mobile);
    if (!pending || !pending.matched) {
      return NextResponse.json({ ok: false, error: "needs-identity" }, { status: 403 });
    }
    const u = getUser(mobile); // default skeleton
    u.identity = pending.identity;
    u.profile = {
      ...u.profile,
      firstName: pending.identity.firstName || u.profile.firstName,
      lastName: pending.identity.lastName || u.profile.lastName,
    };
    notify(u, `هویت شما با موفقیت تأیید شد ✓ به جمع ما خوش آمدید، ${pending.identity.firstName} عزیز.`);
    saveUser(u);
    deletePending(mobile);
  }

  const role = superAdmin ? "super_admin" : "customer";
  await setSession(mobile, role);
  store.delete(OTP_COOKIE);
  return NextResponse.json({ ok: true, role });
}
