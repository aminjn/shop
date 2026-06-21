import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCoupons, saveCoupons, type AdminCoupon } from "@/lib/coupons";

export async function GET() {
  const s = await getSession();
  if (s?.role !== "super_admin") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  return NextResponse.json({ ok: true, coupons: getCoupons() });
}

export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "super_admin") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const action = b.action as "add" | "update" | "delete" | "toggle";
  const list = getCoupons();

  if (action === "delete") {
    saveCoupons(list.filter((c) => c.code !== b.code));
  } else if (action === "toggle") {
    const c = list.find((x) => x.code === b.code);
    if (c) c.enabled = !c.enabled;
    saveCoupons(list);
  } else {
    const code = String(b.code || "").trim().toUpperCase();
    if (!code) return NextResponse.json({ ok: false, error: "code-required" }, { status: 400 });
    const coupon: AdminCoupon = {
      code,
      type: ["percent", "fixed", "ship"].includes(b.type) ? b.type : "percent",
      value: Math.max(0, parseInt(String(b.value).replace(/[^\d]/g, ""), 10) || 0),
      enabled: b.enabled !== false,
      expiry: b.expiry || "",
      minPurchase: b.minPurchase ? Number(b.minPurchase) : undefined,
      usageLimit: b.usageLimit ? Number(b.usageLimit) : undefined,
      used: 0,
    };
    const idx = list.findIndex((c) => c.code === code);
    if (idx >= 0) coupon.used = list[idx].used ?? 0, (list[idx] = coupon);
    else list.push(coupon);
    saveCoupons(list);
  }
  return NextResponse.json({ ok: true, coupons: getCoupons() });
}
