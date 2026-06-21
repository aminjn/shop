import { NextResponse } from "next/server";
import { callAI, catalog, localSearch, parseJson, modelFor } from "@/lib/ai";
import type { Locale } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const locale: Locale = body?.locale === "en" ? "en" : "fa";
  const query: string = (body?.query ?? "").toString().trim();
  if (!query) return NextResponse.json({ ids: [], note: "" });

  const system =
    locale === "fa"
      ? "تو موتور جستجوی هوشمند یک فروشگاه آنلاین هستی. فقط یک JSON معتبر برگردان."
      : "You are the smart search engine of an online store. Return only valid JSON.";
  const prompt =
    locale === "fa"
      ? `کاتالوگ محصولات (JSON): ${JSON.stringify(catalog(locale))}\n\nدرخواست کاربر: "${query}"\n\nمرتبط‌ترین محصولات را پیدا کن و فقط یک JSON معتبر برگردان به این شکل:\n{"ids":[حداکثر ۸ id به ترتیب اولویت],"note":"یک جمله کوتاه فارسی که توضیح می‌دهد چرا این محصولات پیشنهاد شدند"}`
      : `Product catalog (JSON): ${JSON.stringify(catalog(locale))}\n\nUser request: "${query}"\n\nFind the most relevant products and return only valid JSON:\n{"ids":[up to 8 ids by priority],"note":"one short sentence explaining why these were suggested"}`;

  const raw = await callAI(system, [{ role: "user", content: prompt }], modelFor("search"));
  if (raw) {
    const j = parseJson<{ ids: number[]; note: string }>(raw);
    if (j && Array.isArray(j.ids))
      return NextResponse.json({ ids: j.ids, note: j.note ?? "" });
  }
  return NextResponse.json(localSearch(query, locale));
}
