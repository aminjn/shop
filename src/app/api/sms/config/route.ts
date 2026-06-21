import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { smsConfigPublic } from "@/lib/ippanel";
import { writeSms } from "@/lib/settings";

export async function GET() {
  const s = await getSession();
  if (s?.role !== "super_admin") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  return NextResponse.json({ ok: true, config: smsConfigPublic() });
}

export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "super_admin") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const patch: Record<string, string> = {};
  // apiKey only updated when a non-empty value is provided (keeps existing otherwise)
  if (typeof body.apiKey === "string" && body.apiKey.trim()) patch.apiKey = body.apiKey.trim();
  if (typeof body.from === "string") patch.from = body.from.trim();
  if (typeof body.patternCode === "string") patch.patternCode = body.patternCode.trim();
  if (typeof body.otpVar === "string") patch.otpVar = body.otpVar.trim() || "code";
  writeSms(patch);
  return NextResponse.json({ ok: true, config: smsConfigPublic() });
}
