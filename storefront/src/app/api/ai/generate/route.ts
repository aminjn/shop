import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { callAI, parseJson, modelFor } from "@/lib/ai";
import { catById } from "@/data/categories";

export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "super_admin") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const name = String(b.name || "").trim();
  if (!name) return NextResponse.json({ ok: false, error: "name-required" }, { status: 400 });
  const catName = catById(String(b.category || ""))?.fa || "";

  const system = "تو یک متخصص سئو و کپی‌رایتر فروشگاهی دوزبانه (فارسی و انگلیسی) هستی. فقط یک JSON معتبر برگردان، بدون هیچ متن اضافه.";
  const prompt = `برای این محصول محتوای کامل و بهینه برای موتورهای جستجو تولید کن.\nنام محصول: «${name}»\nدسته‌بندی: ${catName}\n\nدقیقاً با این کلیدها:\n{"seoTitle":"عنوان سئو حداکثر ۶۰ کاراکتر","shortDesc":"توضیح کوتاه یک جمله‌ای فارسی","longDesc":"توضیح کامل فارسی ۳ تا ۴ جمله","longDescEn":"the SAME full product description written in natural, fluent English — 3 to 4 complete sentences, NOT a title or a short label","metaDesc":"متا دیسکریپشن حداکثر ۱۵۵ کاراکتر","keywords":["۵ کلمه کلیدی"],"specs":[{"k":"عنوان مشخصه","v":"مقدار"}],"tags":["۴ برچسب"]}`;

  const raw = await callAI(system, [{ role: "user", content: prompt }], modelFor("product"));
  if (raw) {
    const j = parseJson<Record<string, unknown>>(raw);
    if (j) return NextResponse.json({ ok: true, result: j });
  }
  return NextResponse.json({ ok: false, error: "ai-unavailable" }, { status: 502 });
}
