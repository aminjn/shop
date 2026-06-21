import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readStore, writeStore } from "@/lib/settings";

export async function GET() {
  // public subset is fine; everything here is non-secret
  return NextResponse.json({ ok: true, settings: readStore() });
}

export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "super_admin") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const num = (v: unknown, d: number) => {
    const x = parseInt(String(v ?? "").replace(/[^\d]/g, ""), 10);
    return Number.isFinite(x) ? x : d;
  };
  const cur = readStore();
  const settings = writeStore({
    storeName: String(b.storeName ?? cur.storeName).slice(0, 80),
    currencyFa: String(b.currencyFa ?? cur.currencyFa).slice(0, 20),
    currencyEn: String(b.currencyEn ?? cur.currencyEn).slice(0, 20),
    logoUrl: String(b.logoUrl ?? cur.logoUrl).slice(0, 500),
    faviconUrl: String(b.faviconUrl ?? cur.faviconUrl).slice(0, 500),
    shipFee: num(b.shipFee, cur.shipFee),
    freeShipThreshold: num(b.freeShipThreshold, cur.freeShipThreshold),
    taxRate: num(b.taxRate, cur.taxRate),
    maintenance: Boolean(b.maintenance),
    cod: Boolean(b.cod),
  });
  return NextResponse.json({ ok: true, settings });
}
