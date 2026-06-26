"use client";

/** Auto-translate Persian admin inputs to English via the AI endpoint.
 *  Best-effort: returns nulls if AI is unavailable so callers can no-op. */
export async function translateBatch(texts: string[], slug = false): Promise<(string | null)[]> {
  try {
    const r = await fetch("/api/ai/translate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ texts, slug }),
    });
    const d = await r.json().catch(() => ({}));
    if (d.ok && Array.isArray(d.results)) return d.results.map((x: unknown) => (x ? String(x) : null));
  } catch { /* ignore */ }
  return texts.map(() => null);
}

export async function translateOne(text: string): Promise<string | null> {
  if (!text.trim()) return null;
  return (await translateBatch([text]))[0];
}

/** Local Persian→latin slug fallback when AI is unavailable. */
const MAP: Record<string, string> = {
  ا: "a", آ: "a", ب: "b", پ: "p", ت: "t", ث: "s", ج: "j", چ: "ch", ح: "h", خ: "kh",
  د: "d", ذ: "z", ر: "r", ز: "z", ژ: "zh", س: "s", ش: "sh", ص: "s", ض: "z", ط: "t",
  ظ: "z", ع: "a", غ: "gh", ف: "f", ق: "gh", ک: "k", گ: "g", ل: "l", م: "m", ن: "n",
  و: "v", ه: "h", ی: "y", ي: "y", ك: "k", ة: "h", "\u200c": "-", "؟": "", "،": "-",
};
export function translitSlug(text: string): string {
  return (text || "")
    .trim()
    .split("")
    .map((ch) => (/[a-z0-9]/i.test(ch) ? ch : MAP[ch] ?? (/\s/.test(ch) ? "-" : "")))
    .join("")
    .toLowerCase()
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Best English slug: ask AI; if unavailable, transliterate locally. */
export async function aiSlug(text: string): Promise<string> {
  const r = await translateBatch([text], true);
  return (r[0] && r[0].trim()) || translitSlug(text);
}
