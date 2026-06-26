import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getBrands, saveBrands, brandSlug } from "@/lib/brands";
import type { Brand } from "@/lib/types";

export async function GET() {
  return NextResponse.json({ ok: true, brands: getBrands() });
}

export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "super_admin") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const action = String(b.action || "");
  let list = getBrands();

  if (action === "delete") {
    list = list.filter((x) => x.id !== String(b.id));
  } else if (action === "reorder" && Array.isArray(b.ids)) {
    const order = (b.ids as unknown[]).map(String);
    list = [...list].sort((a, c) => order.indexOf(a.id) - order.indexOf(c.id));
  } else if (action === "add" || action === "update") {
    const name = String(b.name || "").trim();
    if (!name) return NextResponse.json({ ok: false, error: "name-required" }, { status: 400 });
    const en = String(b.en || "").trim() || undefined;
    const logo = String(b.logo || "").trim() || undefined;
    const featured = b.featured !== false;
    if (action === "update") {
      const i = list.findIndex((x) => x.id === String(b.id));
      if (i >= 0) list[i] = { ...list[i], name, en, logo, featured };
    } else {
      let id = brandSlug(en || name) || `brand-${Date.now()}`;
      if (list.some((x) => x.id === id)) id = `${id}-${Date.now().toString(36)}`;
      list.push({ id, name, en, logo, featured } as Brand);
    }
  }
  saveBrands(list);
  return NextResponse.json({ ok: true, brands: getBrands() });
}
