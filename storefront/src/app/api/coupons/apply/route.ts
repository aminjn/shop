import { NextResponse } from "next/server";
import { findCoupon } from "@/lib/coupons";

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const code = String(b.code || "").trim();
  const subtotal = Math.max(0, Number(b.subtotal) || 0);
  if (!code) return NextResponse.json({ ok: false });
  const c = findCoupon(code, subtotal);
  if (!c) return NextResponse.json({ ok: false });
  return NextResponse.json({ ok: true, coupon: { code: c.code, type: c.type, value: c.value } });
}
