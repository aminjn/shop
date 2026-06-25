import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCategories, saveCategories } from "@/lib/sitecats";
import type { Category } from "@/lib/types";

export async function GET() {
  return NextResponse.json({ ok: true, categories: getCategories() });
}

function slug(s: string): string {
  return (s || "").trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\p{L}\p{N}-]/gu, "").slice(0, 40);
}

export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "super_admin") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const action = String(b.action || "");
  let list = getCategories();

  const sanitizeSubs = (subs: unknown): [string, string][] =>
    Array.isArray(subs)
      ? subs.map((x) => Array.isArray(x) ? [String(x[0] ?? "").slice(0, 60), String(x[1] ?? x[0] ?? "").slice(0, 60)] as [string, string] : null)
          .filter((x): x is [string, string] => !!x && !!x[0])
      : [];

  if (action === "delete") {
    list = list.filter((c) => c.id !== String(b.id));
  } else if (action === "patch") {
    // lightweight update (toggle nav visibility) without touching other fields
    const i = list.findIndex((c) => c.id === String(b.id));
    if (i >= 0 && typeof b.hidden === "boolean") list[i] = { ...list[i], hidden: b.hidden };
  } else if (action === "reorder" && Array.isArray(b.ids)) {
    const order = (b.ids as unknown[]).map(String);
    list = [...list].sort((a, c) => order.indexOf(a.id) - order.indexOf(c.id));
  } else if (action === "add" || action === "update") {
    const fa = String(b.fa || "").trim();
    const en = String(b.en || "").trim() || fa;
    if (!fa) return NextResponse.json({ ok: false, error: "name-required" }, { status: 400 });
    if (action === "update") {
      const i = list.findIndex((c) => c.id === String(b.id));
      if (i >= 0) {
        // merge: only overwrite fields that were actually provided (don't wipe subs)
        list[i] = {
          ...list[i],
          fa, en,
          hue: typeof b.hue === "number" ? b.hue : list[i].hue,
          subs: Array.isArray(b.subs) ? sanitizeSubs(b.subs) : list[i].subs,
          hidden: typeof b.hidden === "boolean" ? b.hidden : list[i].hidden,
        };
      }
    } else {
      let id = slug(b.en || b.fa) || `cat-${Date.now()}`;
      if (list.some((c) => c.id === id)) id = `${id}-${Date.now().toString(36)}`;
      list.push({ id, fa, en, hue: typeof b.hue === "number" ? b.hue : Math.floor(Math.random() * 360), subs: sanitizeSubs(b.subs), hidden: typeof b.hidden === "boolean" ? b.hidden : undefined });
    }
  }
  saveCategories(list);
  return NextResponse.json({ ok: true, categories: getCategories() });
}
