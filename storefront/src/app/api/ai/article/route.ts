import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { callAI, parseJson, modelFor } from "@/lib/ai";

interface Article {
  title: string;
  excerpt: string;
  body: string;
  category: string;
  tags: string[];
}

export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "super_admin") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));

  const minChars = Math.min(20000, Math.max(0, Number(b.minChars) || 0));
  const tone = String(b.tone || "").trim();

  // expand mode: make an existing body longer
  if (b.mode === "expand") {
    const body = String(b.body || "").trim();
    if (!body) return NextResponse.json({ ok: false, error: "body-required" }, { status: 400 });
    const expanded = await expand(body, minChars || body.length + 1500);
    if (expanded) return NextResponse.json({ ok: true, body: expanded });
    return NextResponse.json({ ok: false, error: "ai-unavailable" }, { status: 502 });
  }

  const topic = String(b.topic || "").trim();
  if (!topic) return NextResponse.json({ ok: false, error: "topic-required" }, { status: 400 });

  const lenRule = minChars
    ? `\nمتن بدنه (body) باید حداقل ${minChars} کاراکتر باشد و کامل، عمیق و با جزئیات نوشته شود؛ از زیرعنوان (با ##)، فهرست‌ها و مثال استفاده کن.`
    : "\nمتن کامل، عمیق و چند پاراگرافی با زیرعنوان (با ##) بنویس.";
  const toneRule = tone ? `\nلحن متن: ${tone}.` : "";

  const system = "تو یک نویسندهٔ حرفه‌ای بلاگ فارسی و متخصص سئو هستی. خروجی را به‌صورت Markdown بنویس. فقط یک JSON معتبر برگردان، بدون متن اضافه.";
  const prompt = `یک مقالهٔ کامل و بهینه برای سئو دربارهٔ موضوع زیر بنویس.\nموضوع: «${topic}»${lenRule}${toneRule}\n\nدقیقاً با این کلیدها (مقدار body به‌صورت Markdown با \\n\\n بین پاراگراف‌ها):\n{"title":"عنوان جذاب","excerpt":"خلاصهٔ یک تا دو جمله‌ای","body":"متن کامل مقاله به Markdown","category":"دستهٔ مقاله","tags":["۴ تا ۶ برچسب"]}`;

  const raw = await callAI(system, [{ role: "user", content: prompt }], modelFor("article"));
  if (!raw) return NextResponse.json({ ok: false, error: "ai-unavailable" }, { status: 502 });
  const j = parseJson<Article>(raw);
  if (!j || !j.title || !j.body) return NextResponse.json({ ok: false, error: "ai-unavailable" }, { status: 502 });

  // enforce minimum length: expand up to twice if the model came back short
  let body = j.body;
  let tries = 0;
  while (minChars && body.length < minChars && tries < 2) {
    const more = await expand(body, minChars);
    if (!more || more.length <= body.length) break;
    body = more;
    tries++;
  }
  j.body = body;

  return NextResponse.json({ ok: true, article: j });
}

async function expand(body: string, minChars: number): Promise<string | null> {
  const system = "تو ویراستار و نویسندهٔ حرفه‌ای فارسی هستی. فقط متن نهایی Markdown را برگردان، بدون توضیح اضافه.";
  const prompt = `متن مقالهٔ زیر را گسترش بده و کامل‌تر کن تا حداقل ${minChars} کاراکتر شود. ساختار و موضوع را حفظ کن، اما جزئیات، مثال، زیرعنوان (##) و نکات کاربردی بیشتری اضافه کن. تکرار نکن.\n\n---\n${body}`;
  const out = await callAI(system, [{ role: "user", content: prompt }], modelFor("article"));
  return out ? out.trim() : null;
}
