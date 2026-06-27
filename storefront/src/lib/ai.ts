import "server-only";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { PRODUCTS } from "@/data/products";
import { catById } from "@/data/categories";
import { readAi } from "./settings";
import type { Locale } from "./types";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");

/** Persist a base64 data URL to the uploads dir and return its public URL, so
 *  large images are never stored inline in JSON (which bloats & slows reads). */
export function persistDataUrl(dataUrl: string): string | null {
  const m = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(dataUrl);
  if (!m) return null;
  try {
    const ext = (m[1].split("/")[1] || "png").replace(/[^a-z0-9]/gi, "") || "png";
    const dir = path.join(DATA_DIR, "uploads");
    fs.mkdirSync(dir, { recursive: true });
    const name = `ai-${Date.now()}-${crypto.randomBytes(5).toString("hex")}.${ext}`;
    fs.writeFileSync(path.join(dir, name), Buffer.from(m[2], "base64"));
    return `/api/uploads/${name}`;
  } catch {
    return null;
  }
}

export const DEFAULT_AI_BASE_URL = "https://api.gapgpt.app/v1";
export const DEFAULT_AI_MODEL = "gpt-4o";

/** Remove a wrapping ```lang … ``` code fence that models often add around
 *  Markdown/JSON output, plus stray leading/trailing fence lines. */
export function stripFence(s: string): string {
  let t = (s || "").trim();
  const m = t.match(/^```[a-zA-Z]*\s*\n([\s\S]*?)\n?```$/);
  if (m) t = m[1];
  t = t.replace(/^```[a-zA-Z]*[ \t]*\n?/, "").replace(/\n?```[ \t]*$/, "");
  return t.trim();
}

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
  maxTokens = 900,
): Promise<string | null> {
  const r = await callAIDetailed(system, messages, model, maxTokens);
  return r.text;
}

/** Like callAI but returns the error reason for surfacing in the UI.
 *  Retries transient upstream/network failures, and once more with a smaller
 *  max_tokens if the model rejects the requested size. */
export async function callAIDetailed(
  system: string,
  messages: ChatMessage[],
  model?: string,
  maxTokens = 900,
): Promise<{ text: string | null; error?: string }> {
  const c = aiConfig();
  if (!c.configured) return { text: null, error: "not-configured" };
  // Try the requested size first (long articles need >4k output tokens); if the
  // model rejects it (token/length/context error) we step down automatically.
  const want = Math.max(256, maxTokens);
  const caps = [Math.min(16000, want), Math.min(8192, want), Math.min(4096, want), 2048];
  // Try the requested model first, then fall back to the global default model
  // (a per-section model saved for an old provider may not exist on the new one).
  const modelQueue = [...new Set([model || c.model, c.model].filter(Boolean))];
  let mi = 0;
  let lastErr = "";
  let tokenParam: "max_tokens" | "max_completion_tokens" = "max_tokens";

  for (let attempt = 0; attempt < 5; attempt++) {
    const cap = caps[Math.min(attempt, caps.length - 1)];
    try {
      const body: Record<string, unknown> = {
        model: modelQueue[mi] || c.model,
        messages: [{ role: "system", content: system }, ...messages],
      };
      body[tokenParam] = cap;
      const res = await fetch(`${c.baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json", Authorization: `Bearer ${c.apiKey}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        if (typeof text === "string" && text.trim()) return { text: text.trim() };
        lastErr = "empty";
      } else {
        let msg = `http ${res.status}`;
        try {
          const e = await res.json();
          msg = e?.error?.message || msg;
        } catch {
          /* ignore */
        }
        lastErr = msg;
        // some models require max_completion_tokens instead of max_tokens
        if (tokenParam === "max_tokens" && /max_completion_tokens|unsupported.*max_tokens|'max_tokens'/i.test(msg)) {
          tokenParam = "max_completion_tokens";
          continue; // retry immediately with the other param name
        }
        // a bad/unknown model → try the next model in the queue (e.g. default)
        if (/model|does not exist|no such model|not found|invalid.*model|unsupported model/i.test(msg) && mi < modelQueue.length - 1) {
          mi++;
          continue;
        }
        // other 4xx (bad model/auth) won't fix themselves — stop, unless token-size
        if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          if (!/token|length|max|context/i.test(msg)) return { text: null, error: msg };
        }
      }
    } catch (e) {
      lastErr = e instanceof Error ? e.message : "network";
    }
    await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
  }
  return { text: null, error: lastErr || "ai-error" };
}

/** Generate an image via the OpenAI-compatible images endpoint. Returns a URL
 *  (remote or data:) or null. Best-effort; never throws. */
export async function generateImage(prompt: string, size = "1536x1024"): Promise<string | null> {
  const c = aiConfig();
  if (!c.configured) return null;
  try {
    const res = await fetch(`${c.baseUrl}/images/generations`, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${c.apiKey}` },
      body: JSON.stringify({ model: modelFor("image", "gpt-image-2"), prompt, size }),
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const item = data?.data?.[0];
    if (item?.url) return item.url;
    // base64 → write to a file and return a URL (never inline megabytes of base64)
    if (item?.b64_json) return persistDataUrl(`data:image/png;base64,${item.b64_json}`);
    return null;
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

/** Products most relevant to a topic, with internal URLs for in-article links. */
export function relevantProducts(topic: string, locale: Locale, limit = 8) {
  const { ids } = localSearch(topic, locale);
  return ids
    .map((id) => PRODUCTS.find((p) => p.id === id))
    .filter((p): p is (typeof PRODUCTS)[number] => Boolean(p))
    .slice(0, limit)
    .map((p) => ({
      name: locale === "fa" ? p.fa : p.en,
      url: `/${locale}/product/${p.id}`,
      brand: p.brand,
      price: p.price,
      cat: catById(p.cat)?.[locale] ?? p.cat,
    }));
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
