import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPages, savePages, pageSlug, type SitePage } from "@/lib/pages";

export async function GET() {
  return NextResponse.json({ ok: true, pages: getPages() });
}

export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "super_admin") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const action = String(b.action || "");
  let list = getPages();

  if (action === "delete") {
    list = list.filter((p) => p.slug !== String(b.slug));
  } else if (action === "add" || action === "update") {
    const titleFa = String(b.titleFa || "").trim();
    const titleEn = String(b.titleEn || "").trim() || titleFa;
    if (!titleFa) return NextResponse.json({ ok: false, error: "title-required" }, { status: 400 });
    const data: SitePage = {
      slug: pageSlug(b.slug || b.titleEn || b.titleFa) || `page-${Date.now().toString(36)}`,
      titleFa, titleEn,
      bodyFa: String(b.bodyFa || ""),
      bodyEn: String(b.bodyEn || ""),
      published: b.published !== false,
      footerCol: b.footerCol === "support" || b.footerCol === "company" ? b.footerCol : "",
    };
    if (action === "update") {
      const i = list.findIndex((p) => p.slug === String(b.originalSlug || b.slug));
      if (i >= 0) list[i] = { ...data, slug: list[i].slug }; // keep original slug stable on update
      else list.push(data);
    } else {
      if (list.some((p) => p.slug === data.slug)) data.slug = `${data.slug}-${Date.now().toString(36)}`;
      list.push(data);
    }
  }
  savePages(list);
  return NextResponse.json({ ok: true, pages: getPages() });
}
