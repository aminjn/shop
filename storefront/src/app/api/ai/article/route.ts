import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { callAI, parseJson } from "@/lib/ai";

export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "super_admin") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const topic = String(b.topic || "").trim();
  if (!topic) return NextResponse.json({ ok: false, error: "topic-required" }, { status: 400 });

  const system = "تو یک نویسندهٔ حرفه‌ای بلاگ فارسی و متخصص سئو هستی. فقط یک JSON معتبر برگردان، بدون متن اضافه.";
  const prompt = `یک مقالهٔ کامل و بهینه برای سئو دربارهٔ موضوع زیر بنویس.\nموضوع: «${topic}»\n\nدقیقاً با این کلیدها:\n{"title":"عنوان جذاب","excerpt":"خلاصهٔ یک تا دو جمله‌ای","body":"متن کامل مقاله در چند پاراگراف که پاراگراف‌ها با دو خط جدید (\\n\\n) از هم جدا شده‌اند","category":"دستهٔ مقاله","tags":["۴ تا ۶ برچسب"]}`;

  const raw = await callAI(system, [{ role: "user", content: prompt }]);
  if (raw) {
    const j = parseJson<{ title: string; excerpt: string; body: string; category: string; tags: string[] }>(raw);
    if (j && j.title && j.body) return NextResponse.json({ ok: true, article: j });
  }
  return NextResponse.json({ ok: false, error: "ai-unavailable" }, { status: 502 });
}
