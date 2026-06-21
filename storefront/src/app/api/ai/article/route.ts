import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { callAIDetailed, parseJson, modelFor } from "@/lib/ai";

interface Article {
  title: string;
  excerpt: string;
  body: string;
  category: string;
  tags: string[];
  seoTitle?: string;
  metaDesc?: string;
  keyword?: string;
}

const MODEL = () => modelFor("article");

/** ~1 token ≈ 2 Persian chars; size generously so output is never truncated. */
const tokensFor = (chars: number) => Math.min(16000, Math.max(900, Math.ceil(chars / 1.5)));

export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "super_admin") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));

  const action = String(b.action || b.mode || "generate");
  const minChars = Math.min(40000, Math.max(0, Number(b.minChars) || 0));
  const words = Math.min(6000, Math.max(0, Number(b.words) || 0));
  const tone = String(b.tone || "").trim();
  const body = String(b.body || "").trim();
  const title = String(b.title || "").trim();
  const keyword = String(b.keyword || "").trim();

  // ---- full article generation -------------------------------------------
  if (action === "generate") {
    const topic = String(b.topic || "").trim();
    if (!topic) return NextResponse.json({ ok: false, error: "topic-required" }, { status: 400 });

    const targetChars = minChars || (words ? words * 6 : 7000);
    const lenRule = `\nمتن بدنه (body) باید حداقل ${targetChars} کاراکتر${words ? ` (حدود ${words} کلمه)` : ""} و کامل، عمیق و کاربردی باشد. حتماً از چند زیرعنوان (با ##)، فهرست‌ها، مثال و در صورت لزوم بخش «سؤالات متداول» استفاده کن.`;
    const toneRule = tone ? `\nلحن متن: ${tone}.` : "";
    const kwRule = keyword ? `\nکلمهٔ کلیدی اصلی «${keyword}» را به‌صورت طبیعی در عنوان، اولین پاراگراف، زیرعنوان‌ها و متن به کار ببر.` : "";

    const system = "تو یک نویسندهٔ حرفه‌ای بلاگ فارسی و متخصص سئو هستی که محتوای انسانی، روان و بهینه برای گوگل می‌نویسی. خروجی body را به‌صورت Markdown بنویس. فقط یک JSON معتبر برگردان، بدون متن اضافه و بدون بک‌تیک.";
    const prompt = `یک مقالهٔ کامل و بهینه برای سئو دربارهٔ موضوع زیر بنویس.\nموضوع: «${topic}»${lenRule}${toneRule}${kwRule}\n\nدقیقاً با این کلیدها (body به Markdown با \\n\\n بین پاراگراف‌ها):\n{"title":"عنوان جذاب و سئوشده","excerpt":"خلاصهٔ یک تا دو جمله‌ای","body":"متن کامل مقاله به Markdown","category":"دستهٔ مقاله","tags":["۴ تا ۶ برچسب"],"seoTitle":"عنوان سئو حداکثر ۶۰ کاراکتر","metaDesc":"متا دیسکریپشن ۷۰ تا ۱۶۰ کاراکتر","keyword":"کلمهٔ کلیدی اصلی"}`;

    const r = await callAIDetailed(system, [{ role: "user", content: prompt }], MODEL(), tokensFor(targetChars + 1500));
    if (!r.text) return fail(r.error);
    const j = parseJson<Article>(r.text);
    if (!j || !j.title || !j.body) return fail(r.error || "parse");

    // enforce minimum length: expand up to twice if short
    let out = j.body;
    let tries = 0;
    while (targetChars && out.length < targetChars && tries < 2) {
      const more = await expand(out, targetChars);
      if (!more || more.length <= out.length) break;
      out = more;
      tries++;
    }
    j.body = out;
    return NextResponse.json({ ok: true, article: j });
  }

  // ---- expand / make longer ----------------------------------------------
  if (action === "expand") {
    if (!body) return NextResponse.json({ ok: false, error: "body-required" }, { status: 400 });
    const target = minChars || body.length + 2000;
    const out = await expand(body, target);
    return out ? NextResponse.json({ ok: true, body: out }) : fail();
  }

  // ---- rewrite / improve --------------------------------------------------
  if (action === "rewrite") {
    if (!body) return NextResponse.json({ ok: false, error: "body-required" }, { status: 400 });
    const system = "تو ویراستار و نویسندهٔ حرفهٔ فارسی هستی. فقط متن نهایی Markdown را برگردان، بدون توضیح.";
    const prompt = `متن زیر را بازنویسی و روان‌تر کن؛ ساختار و معنا را حفظ کن اما جمله‌ها را طبیعی‌تر، انسانی‌تر و سئوپسندتر کن.\n\n---\n${body}`;
    const r = await callAIDetailed(system, [{ role: "user", content: prompt }], MODEL(), tokensFor(body.length + 1000));
    return r.text ? NextResponse.json({ ok: true, body: r.text }) : fail(r.error);
  }

  // ---- proofread (grammar) ------------------------------------------------
  if (action === "proofread") {
    if (!body) return NextResponse.json({ ok: false, error: "body-required" }, { status: 400 });
    const system = "تو ویراستار نگارشی فارسی هستی. غلط‌های املایی، نیم‌فاصله، نشانه‌گذاری و دستوری را اصلاح کن. فقط متن اصلاح‌شده Markdown را برگردان.";
    const r = await callAIDetailed(system, [{ role: "user", content: body }], MODEL(), tokensFor(body.length + 500));
    return r.text ? NextResponse.json({ ok: true, body: r.text }) : fail(r.error);
  }

  // ---- snippet helpers that return text to insert -------------------------
  const snippet: Record<string, { sys: string; usr: string }> = {
    faq: {
      sys: "تو متخصص سئو هستی. فقط بخش «سؤالات متداول» را به‌صورت Markdown برگردان: یک زیرعنوان ## سؤالات متداول و سپس ۴ تا ۶ پرسش با **پررنگ** و پاسخ کوتاه.",
      usr: `برای مقالهٔ زیر بخش سؤالات متداول بنویس.\nعنوان: ${title}\n---\n${body || title}`,
    },
    keypoints: {
      sys: "تو متخصص محتوا هستی. فقط یک زیرعنوان ## نکات کلیدی و سپس یک فهرست نقطه‌ای از مهم‌ترین نکات را به Markdown برگردان.",
      usr: `بر اساس مقالهٔ زیر نکات کلیدی را استخراج کن.\nعنوان: ${title}\n---\n${body || title}`,
    },
    conclusion: {
      sys: "تو نویسندهٔ حرفه‌ای هستی. فقط یک زیرعنوان ## جمع‌بندی و سپس دو پاراگراف جمع‌بندی به Markdown برگردان.",
      usr: `برای مقالهٔ زیر جمع‌بندی بنویس.\nعنوان: ${title}\n---\n${body || title}`,
    },
    toc: {
      sys: "تو متخصص سئو هستی. فقط یک زیرعنوان ## فهرست مطالب و سپس فهرست شماره‌دار از سرفصل‌ها را به Markdown برگردان.",
      usr: `برای مقالهٔ زیر فهرست مطالب بساز.\n${body || title}`,
    },
  };
  if (snippet[action]) {
    const sp = snippet[action];
    const r = await callAIDetailed(sp.sys, [{ role: "user", content: sp.usr }], MODEL(), 1500);
    return r.text ? NextResponse.json({ ok: true, snippet: r.text }) : fail(r.error);
  }

  // ---- title suggestions --------------------------------------------------
  if (action === "titles") {
    const system = "تو متخصص سئو هستی. فقط یک آرایهٔ JSON از ۶ عنوان جذاب و سئوشده برگردان: [\"...\"]";
    const r = await callAIDetailed(system, [{ role: "user", content: `موضوع: ${title || body.slice(0, 200)}` }], MODEL(), 600);
    const arr = r.text ? parseJson<string[]>(r.text) : null;
    return Array.isArray(arr) ? NextResponse.json({ ok: true, titles: arr }) : fail(r.error);
  }

  // ---- tags ---------------------------------------------------------------
  if (action === "tags") {
    const system = "تو متخصص سئو هستی. فقط یک آرایهٔ JSON از ۵ تا ۸ برچسب کوتاه فارسی برگردان.";
    const r = await callAIDetailed(system, [{ role: "user", content: `${title}\n${body.slice(0, 1500)}` }], MODEL(), 300);
    const arr = r.text ? parseJson<string[]>(r.text) : null;
    return Array.isArray(arr) ? NextResponse.json({ ok: true, tags: arr }) : fail(r.error);
  }

  // ---- excerpt + meta -----------------------------------------------------
  if (action === "meta") {
    const system = "تو متخصص سئو هستی. فقط یک JSON معتبر برگردان.";
    const prompt = `بر اساس مقالهٔ زیر خروجی بده:\nعنوان: ${title}\n---\n${body.slice(0, 3000)}\n\n{"excerpt":"خلاصهٔ یک تا دو جمله‌ای","seoTitle":"عنوان سئو حداکثر ۶۰ کاراکتر","metaDesc":"متا دیسکریپشن ۷۰ تا ۱۶۰ کاراکتر","keyword":"کلمهٔ کلیدی اصلی"}`;
    const r = await callAIDetailed(system, [{ role: "user", content: prompt }], MODEL(), 600);
    const j = r.text ? parseJson<Record<string, string>>(r.text) : null;
    return j ? NextResponse.json({ ok: true, meta: j }) : fail(r.error);
  }

  // ---- keyword optimization ----------------------------------------------
  if (action === "keyword") {
    if (!body) return NextResponse.json({ ok: false, error: "body-required" }, { status: 400 });
    const kw = keyword || title;
    const system = "تو متخصص سئوی فارسی هستی. متن را طوری بازنویسی کن که کلمهٔ کلیدی به‌صورت طبیعی در عنوان‌ها، ابتدای متن و چگالی مناسب به کار رود؛ بدون اسپم. فقط متن نهایی Markdown را برگردان.";
    const r = await callAIDetailed(system, [{ role: "user", content: `کلمهٔ کلیدی: «${kw}»\n---\n${body}` }], MODEL(), tokensFor(body.length + 800));
    return r.text ? NextResponse.json({ ok: true, body: r.text }) : fail(r.error);
  }

  // ---- topic ideas (for bulk) --------------------------------------------
  if (action === "topics") {
    const theme = String(b.theme || "").trim();
    const count = Math.min(50, Math.max(1, Number(b.count) || 10));
    if (!theme) return NextResponse.json({ ok: false, error: "theme-required" }, { status: 400 });
    const system = "تو استراتژیست محتوا و متخصص سئو هستی. فقط یک آرایهٔ JSON از عنوان‌های مقاله برگردان.";
    const r = await callAIDetailed(system, [{ role: "user", content: `${count} عنوان مقالهٔ جذاب، متنوع و سئوشده دربارهٔ موضوع «${theme}» پیشنهاد بده. فقط آرایهٔ JSON: ["...","..."]` }], MODEL(), 1500);
    const arr = r.text ? parseJson<string[]>(r.text) : null;
    return Array.isArray(arr) ? NextResponse.json({ ok: true, topics: arr.slice(0, count) }) : fail(r.error);
  }

  return NextResponse.json({ ok: false, error: "unknown-action" }, { status: 400 });
}

function fail(reason?: string) {
  const code = reason === "not-configured" ? "ai-unavailable" : reason || "ai-unavailable";
  return NextResponse.json({ ok: false, error: code === "ai-unavailable" || reason === "not-configured" ? "ai-unavailable" : "ai-error", detail: reason }, { status: 502 });
}

async function expand(body: string, minChars: number): Promise<string | null> {
  const system = "تو ویراستار و نویسندهٔ حرفه‌ای فارسی هستی. فقط متن نهایی Markdown را برگردان، بدون توضیح اضافه.";
  const prompt = `متن مقالهٔ زیر را گسترش بده و کامل‌تر کن تا حداقل ${minChars} کاراکتر شود. ساختار و موضوع را حفظ کن، اما جزئیات، مثال، زیرعنوان (##) و نکات کاربردی بیشتری اضافه کن. تکرار نکن.\n\n---\n${body}`;
  const r = await callAIDetailed(system, [{ role: "user", content: prompt }], MODEL(), tokensFor(minChars + 2000));
  return r.text ? r.text.trim() : null;
}
