import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readStore, writeStore, type ShipMethod, type PayMethod } from "@/lib/settings";

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
  const str = (v: unknown, max: number) => String(v ?? "").slice(0, max);
  const ship: ShipMethod[] | undefined = Array.isArray(b.shippingMethods)
    ? (b.shippingMethods as unknown[]).map((x, i) => {
        const m = (x || {}) as Record<string, unknown>;
        return { id: str(m.id, 30) || `ship-${i}`, fa: str(m.fa, 60), en: str(m.en, 60), price: num(m.price, 0), etaFa: str(m.etaFa, 60), etaEn: str(m.etaEn, 60), enabled: m.enabled !== false } as ShipMethod;
      }).filter((m) => m.fa.trim())
    : undefined;
  const pay: PayMethod[] | undefined = Array.isArray(b.paymentMethods)
    ? (b.paymentMethods as unknown[]).map((x, i) => {
        const m = (x || {}) as Record<string, unknown>;
        const kind = m.kind === "wallet" || m.kind === "cod" ? m.kind : "online";
        return { id: str(m.id, 30) || `pay-${i}`, fa: str(m.fa, 60), en: str(m.en, 60), kind, enabled: m.enabled !== false } as PayMethod;
      }).filter((m) => m.fa.trim())
    : undefined;
  const settings = writeStore({
    storeName: String(b.storeName ?? cur.storeName).slice(0, 80),
    tagline: String(b.tagline ?? cur.tagline).slice(0, 160),
    currencyFa: String(b.currencyFa ?? cur.currencyFa).slice(0, 20),
    currencyEn: String(b.currencyEn ?? cur.currencyEn).slice(0, 20),
    logoUrl: String(b.logoUrl ?? cur.logoUrl).slice(0, 500),
    faviconUrl: String(b.faviconUrl ?? cur.faviconUrl).slice(0, 500),
    themeAccent: String(b.themeAccent ?? cur.themeAccent).slice(0, 30),
    themeRadius: String(b.themeRadius ?? cur.themeRadius).slice(0, 10),
    metaTitle: String(b.metaTitle ?? cur.metaTitle).slice(0, 70),
    metaDescription: String(b.metaDescription ?? cur.metaDescription).slice(0, 320),
    metaKeywords: String(b.metaKeywords ?? cur.metaKeywords).slice(0, 300),
    ogImage: String(b.ogImage ?? cur.ogImage).slice(0, 500),
    shipFee: num(b.shipFee, cur.shipFee),
    freeShipThreshold: num(b.freeShipThreshold, cur.freeShipThreshold),
    taxRate: num(b.taxRate, cur.taxRate),
    maintenance: Boolean(b.maintenance),
    cod: Boolean(b.cod),
    ...(ship ? { shippingMethods: ship } : {}),
    ...(pay ? { paymentMethods: pay } : {}),
  });
  return NextResponse.json({ ok: true, settings });
}
