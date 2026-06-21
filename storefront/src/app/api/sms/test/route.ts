import { NextResponse } from "next/server";
import { getSession, normalizeMobile } from "@/lib/auth";
import { sendOtp, smsConfig } from "@/lib/ippanel";

export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "super_admin") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  if (!smsConfig().configured) {
    return NextResponse.json({ ok: false, error: "sms-not-configured" }, { status: 400 });
  }
  const body = await req.json().catch(() => ({}));
  const mobile = normalizeMobile(body?.mobile || s.mobile);
  if (!mobile) return NextResponse.json({ ok: false, error: "invalid-mobile" }, { status: 400 });

  const code = String(Math.floor(10000 + Math.random() * 90000));
  const r = await sendOtp(mobile, code);
  return NextResponse.json(r, { status: r.ok ? 200 : 502 });
}
