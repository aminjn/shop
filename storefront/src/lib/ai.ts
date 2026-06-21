import "server-only";
import { PRODUCTS } from "@/data/products";
import { catById } from "@/data/categories";
import { readAi } from "./settings";
import type { Locale } from "./types";

export const DEFAULT_AI_BASE_URL = "https://api.gapgpt.app/v1";
export const DEFAULT_AI_MODEL = "gpt-4o";

export interface AiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  configured: boolean;
}

export function aiConfig(): AiConfig {
  const s = readAi();
  const apiKey = s.apiKey || process.env.AI_API_KEY || process.env.GAPGPT_API_KEY || "";
  const baseUrl = (s.baseUrl || process.env.AI_BASE_URL || DEFAULT_AI_BASE_URL).replace(/\/+$/, "");
  const model = s.model || process.env.AI_MODEL || DEFAULT_AI_MODEL;
  return { apiKey, baseUrl, model, configured: Boolean(apiKey) };
}

/** Resolve which model a given Studio task should use. Falls back to the
 *  global default model when no per-task override is set. */
export function modelFor(task: string, fallback?: string): string {
  const s = readAi();
  return (s.models && s.models[task]) || fallback || aiConfig().model;
}

export function aiConfigPublic() {
  const c = aiConfig();
  const s = readAi();
  const mask = (v: string) =>
    v ? v.slice(0, 3) + "•".repeat(Math.max(0, v.length - 6)) + v.slice(-3) : "";
  return {
    configured: c.configured,
    hasKey: Boolean(c.apiKey),
    baseUrl: c.baseUrl,
    model: c.model,
    apiKeyMasked: mask(c.apiKey),
    models: s.models || {},
  };
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** Calls an OpenAI-compatible chat API (GapGPT). Returns text, or null when unavailable. */
export async function callAI(
  system: string,
  messages: ChatMessage[],
  model?: string,
): Promise<string | null> {
  const c = aiConfig();
  if (!c.configured) return null;
  try {
    const res = await fetch(`${c.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${c.apiKey}`,
      },
      body: JSON.stringify({
        model: model || c.model,
        messages: [{ role: "system", content: system }, ...messages],
        max_tokens: 700,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
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
