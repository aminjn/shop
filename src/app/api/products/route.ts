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
  };
}

export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "super_admin") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const action = b.action as "add" | "update" | "delete";
  const list = getCatalog();

  if (action === "delete") {
    saveCatalog(list.filter((p) => p.id !== Number(b.id)));
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
