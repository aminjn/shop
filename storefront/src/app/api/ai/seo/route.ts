import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { callAIDetailed, parseJson, modelFor } from "@/lib/ai";
import { readStore } from "@/lib/settings";
import { getCategories } from "@/lib/sitecats";
import { getCatalog } from "@/lib/catalog";

export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "super_admin") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const store = readStore();
  const name = store.storeName || "این فروشگاه";
  const cats = getCategories().map((c) => c.fa).slice(0, 12).join("، ");
  const prods = getCatalog().slice(0, 12).map((p) => p.fa).join("، ");

  const system = "تو متخصص سئوی فارسی هستی. فقط یک JSON معتبر برگردان، بدون متن اضافه.";
  const prompt = `برای فروشگاه «${name}» محتوای سئوی صفحهٔ اصلی را تولید کن.
دسته‌بندی‌ها: ${cats || "نامشخص"}
نمونه محصولات: ${prods || "نامشخص"}

دقیقاً با این کلیدها (فارسی، طبیعی و بهینه برای گوگل):
{"defaultTitle":"عنوان اصلی سایت حداکثر ۶۰ کاراکتر","titleTemplate":"%s | ${name}","defaultDescription":"توضیح متا ۱۲۰ تا ۱۶۰ کاراکتر","keywords":"۸ تا ۱۲ کلمهٔ کلیدی با ویرگول","orgName":"${name}"}`;

  const r = await callAIDetailed(system, [{ role: "user", content: prompt }], modelFor("tool"), 1200);
  const j = r.text ? parseJson<Record<string, unknown>>(r.text) : null;
  if (j) return NextResponse.json({ ok: true, seo: j });
  return NextResponse.json({ ok: false, error: r.error || "ai-unavailable" }, { status: 502 });
}
