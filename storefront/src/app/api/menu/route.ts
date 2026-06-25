import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getMenu, saveMenu, type MenuLink } from "@/lib/menu";

export async function GET() {
  return NextResponse.json({ ok: true, menu: getMenu() });
}

export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "super_admin") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const action = String(b.action || "");
  let list = getMenu();

  if (action === "delete") {
    list = list.filter((m) => m.id !== String(b.id));
  } else if (action === "reorder" && Array.isArray(b.ids)) {
    const order = (b.ids as unknown[]).map(String);
    list = [...list].sort((a, c) => order.indexOf(a.id) - order.indexOf(c.id));
  } else if (action === "add" || action === "update") {
    const fa = String(b.fa || "").trim();
    const en = String(b.en || "").trim() || fa;
    let href = String(b.href || "").trim();
    if (!fa) return NextResponse.json({ ok: false, error: "label-required" }, { status: 400 });
    if (!href) href = "/";
    if (!/^(https?:\/\/|\/)/.test(href)) href = "/" + href;
    const item: MenuLink = { id: action === "update" ? String(b.id) : `m-${Date.now().toString(36)}`, fa, en, href };
    if (action === "update") {
      const i = list.findIndex((m) => m.id === item.id);
      if (i >= 0) list[i] = item;
    } else list.push(item);
  }
  saveMenu(list);
  return NextResponse.json({ ok: true, menu: getMenu() });
}
