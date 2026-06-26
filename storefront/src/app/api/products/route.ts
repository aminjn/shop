import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCatalog, saveCatalog, nextProductId } from "@/lib/catalog";
import type { Product } from "@/lib/types";

export async function GET() {
  return NextResponse.json({ products: getCatalog() });
}

function sanitize(input: Record<string, unknown>, id: number): Product {
  const n = (v: unknown, d = 0) => {
    const x = parseInt(String(v ?? "").replace(/[^\d]/g, ""), 10);
    return Number.isFinite(x) ? x : d;
  };
  return {
    id,
    fa: String(input.fa || "").slice(0, 120),
    en: String(input.en || input.fa || "").slice(0, 120),
    cat: String(input.cat || "tech"),
    sub: input.sub ? String(input.sub) : undefined,
    brand: String(input.brand || ""),
    price: n(input.price),
    old: input.old ? n(input.old) : undefined,
    rating: typeof input.rating === "number" ? input.rating : 4.5,
    reviews: typeof input.reviews === "number" ? input.reviews : 0,
    hue: typeof input.hue === "number" ? input.hue : Math.floor(Math.random() * 360),
    country: String(input.country || ""),
    warranty: String(input.warranty || "-"),
    stock: n(input.stock),
    sku: input.sku ? String(input.sku) : undefined,
    shortFa: input.shortFa ? String(input.shortFa) : undefined,
    colors: Array.isArray(input.colors) ? (input.colors as [string, string][]) : undefined,
    sizes: Array.isArray(input.sizes) ? (input.sizes as string[]) : undefined,
    badge: Array.isArray(input.badge) ? (input.badge as [string, string]) : undefined,
    variations: Array.isArray(input.variations) ? (input.variations as Product["variations"]) : undefined,
    images: Array.isArray(input.images) ? (input.images as string[]).filter((x) => typeof x === "string") : undefined,
    video: typeof input.video === "string" && input.video ? input.video : undefined,
    pricingType: input.pricingType === "per_cm" ? "per_cm" : undefined,
    pricePerCm: input.pricingType === "per_cm" ? n(input.pricePerCm) : undefined,
    width: input.pricingType === "per_cm" && input.width ? n(input.width) : undefined,
  };
}

export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "super_admin") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const action = b.action as "add" | "update" | "delete" | "bulk";
  const list = getCatalog();

  if (action === "delete") {
    saveCatalog(list.filter((p) => p.id !== Number(b.id)));
  } else if (action === "bulk") {
    const ids: number[] = Array.isArray(b.ids) ? b.ids.map(Number).filter(Number.isFinite) : [];
    const idSet = new Set(ids);
    const num = (v: unknown) => { const x = parseInt(String(v ?? "").replace(/[^\d]/g, ""), 10); return Number.isFinite(x) ? x : NaN; };
    if (b.op === "delete") {
      saveCatalog(list.filter((p) => !idSet.has(p.id)));
    } else if (b.op === "update") {
      const patch = (b.patch || {}) as Record<string, unknown>;
      for (const p of list) {
        if (!idSet.has(p.id)) continue;
        if (patch.cat) { p.cat = String(patch.cat); if (patch.sub === undefined) p.sub = undefined; }
        if (patch.sub !== undefined) p.sub = String(patch.sub).trim() || undefined;
        if (patch.brand !== undefined && String(patch.brand).trim()) p.brand = String(patch.brand).trim();
        if (patch.stock !== undefined && String(patch.stock).trim() !== "") { const v = num(patch.stock); if (!Number.isNaN(v)) p.stock = v; }
        if (patch.price !== undefined && String(patch.price).trim() !== "") { const v = num(patch.price); if (!Number.isNaN(v)) p.price = v; }
        if (patch.pricePerCm !== undefined && String(patch.pricePerCm).trim() !== "") { const v = num(patch.pricePerCm); if (!Number.isNaN(v)) { p.pricingType = "per_cm"; p.pricePerCm = v; } }
        if (patch.width !== undefined && String(patch.width).trim() !== "") { const v = num(patch.width); if (!Number.isNaN(v)) { p.pricingType = "per_cm"; p.width = v; } }
        const dpct = Number(patch.discountPct);
        if (dpct > 0 && dpct < 100) { p.old = p.old || p.price; p.price = Math.round((p.price * (100 - dpct)) / 100); }
      }
      saveCatalog(list);
    }
  } else if (action === "update") {
    const id = Number(b.id);
    const idx = list.findIndex((p) => p.id === id);
    if (idx >= 0) list[idx] = sanitize(b.product || {}, id);
    saveCatalog(list);
  } else {
    const p = sanitize(b.product || {}, nextProductId());
    if (!p.fa) return NextResponse.json({ ok: false, error: "name-required" }, { status: 400 });
    list.push(p);
    saveCatalog(list);
  }
  return NextResponse.json({ ok: true, products: getCatalog() });
}
