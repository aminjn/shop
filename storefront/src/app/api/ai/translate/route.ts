import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { callAIDetailed, parseJson, modelFor } from "@/lib/ai";

/** Translate Persian admin inputs to English (and optionally to url slugs).
 *  Body: { texts: string[], slug?: boolean }  ->  { ok, results: string[] }  */
export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "super_admin") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const texts: string[] = Array.isArray(b.texts) ? b.texts.map((x: unknown) => String(x || "").trim()) : [];
  const slug = Boolean(b.slug);
  const long = Boolean(b.long);
  const list = texts.filter(Boolean);
  if (!list.length) return NextResponse.json({ ok: true, results: texts });

  const system = slug
    ? "You convert Persian phrases into short, URL-safe English slugs (lowercase ASCII words separated by single hyphens, no Persian letters, no spaces). Return ONLY a valid JSON array of strings, same order, same length."
    : long
    ? "You are a professional Persian→English translator for an e-commerce site. Translate each item FAITHFULLY and COMPLETELY into natural, fluent English, preserving every sentence, detail and paragraph break. Do NOT summarize, shorten, or turn it into a title. Return ONLY a valid JSON array of strings, same order, same length."
    : "You are a professional Persian→English translator for an e-commerce site. Translate each item to a short, natural English equivalent (a product/category/label name, Title Case, concise). Return ONLY a valid JSON array of strings, same order, same length.";
  const prompt = `${slug ? "Slugify" : "Translate"} these ${list.length} items:\n${JSON.stringify(list)}`;

  const r = await callAIDetailed(system, [{ role: "user", content: prompt }], modelFor("tool"), long ? 3000 : 800);
  if (!r.text) return NextResponse.json({ ok: false, error: r.error === "not-configured" ? "ai-unavailable" : "ai-error", detail: r.error }, { status: 502 });
  const arr = parseJson<string[]>(r.text);
  if (!Array.isArray(arr)) return NextResponse.json({ ok: false, error: "parse" }, { status: 502 });

  // map results back onto the original positions (skipping the blanks we filtered)
  let i = 0;
  const results = texts.map((t) => {
    if (!t) return t;
    const v = String(arr[i++] ?? "").trim();
    return slug ? v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) : v;
  });
  return NextResponse.json({ ok: true, results });
}
