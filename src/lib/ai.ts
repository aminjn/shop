import "server-only";
import { PRODUCTS } from "@/data/products";
import { catById } from "@/data/categories";
import type { Locale } from "./types";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** Calls the Anthropic Messages API. Returns text, or null when unavailable. */
export async function callClaude(
  system: string,
  messages: ChatMessage[],
): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model: MODEL, max_tokens: 700, system, messages }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.content?.[0]?.text;
    return typeof text === "string" ? text.trim() : null;
  } catch {
    return null;
  }
}

export function catalog(locale: Locale) {
  return PRODUCTS.map((p) => ({
    id: p.id,
    name: locale === "fa" ? p.fa : p.en,
    cat: catById(p.cat)?.[locale] ?? p.cat,
    brand: p.brand,
    price: p.price,
    rating: p.rating,
  }));
}

/** Local fallback ranking when no model is configured. */
export function localSearch(
  query: string,
  locale: Locale,
): { ids: number[]; note: string } {
  const q = query.toLowerCase();
  const tokens = q.split(/\s+/).filter(Boolean);
  const priceMatch = q.match(/(\d[\d,٬,.]*)\s*(م|میلیون|m|million)?/);
  let maxPrice = Infinity;
  if (priceMatch) {
    const raw = Number(priceMatch[1].replace(/[^\d]/g, ""));
    if (raw) maxPrice = priceMatch[2] ? raw * 1_000_000 : raw;
  }
  const scored = PRODUCTS.map((p) => {
    const hay = `${p.fa} ${p.en} ${p.brand} ${catById(p.cat)?.fa ?? ""} ${
      catById(p.cat)?.en ?? ""
    }`.toLowerCase();
    let score = 0;
    for (const tk of tokens) if (tk.length > 1 && hay.includes(tk)) score += 2;
    score += p.rating;
    if (p.price <= maxPrice) score += 3;
    else score -= 5;
    return { id: p.id, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((x) => x.id);
  const note =
    locale === "fa"
      ? "این محصولات بر اساس نزدیک‌ترین تطابق با درخواست شما مرتب شده‌اند."
      : "These products are ranked by closest match to your request.";
  return { ids: scored.length ? scored : PRODUCTS.slice(0, 6).map((p) => p.id), note };
}

export function localChat(query: string, locale: Locale): string {
  const { ids } = localSearch(query, locale);
  const top = PRODUCTS.find((p) => p.id === ids[0]);
  if (!top) {
    return locale === "fa"
      ? "می‌تونم کمکت کنم محصول مناسب پیدا کنی. کمی دقیق‌تر بگو دنبال چی هستی؟"
      : "I can help you find the right product. Tell me a bit more about what you need.";
  }
  const name = locale === "fa" ? top.fa : top.en;
  const price = top.price.toLocaleString(locale === "fa" ? "fa-IR" : "en-US");
  const cur = locale === "fa" ? "تومان" : "Toman";
  return locale === "fa"
    ? `بر اساس درخواستت، «${name}» از برند ${top.brand} گزینه‌ی خوبی است (${price} ${cur}). اگر بودجه یا ویژگی خاصی مدنظرت هست بگو تا دقیق‌تر پیشنهاد بدم.`
    : `Based on your request, “${name}” by ${top.brand} is a great option (${price} ${cur}). Tell me your budget or any must-have feature for a more precise suggestion.`;
}

export function parseJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    const m = text.match(/[{[][\s\S]*[\]}]/);
    if (m) {
      try {
        return JSON.parse(m[0]) as T;
      } catch {
        /* ignore */
      }
    }
  }
  return null;
}
