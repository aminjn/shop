import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { callAIDetailed, parseJson, modelFor } from "@/lib/ai";
import { getAllPosts, savePosts, nextPostId, type StoredPost } from "@/lib/posts";

const TEHRAN_OFFSET_MIN = 210; // +03:30, no DST in Iran

function slugify(s: string): string {
  return (s || "").trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\p{L}\p{N}-]/gu, "").slice(0, 80) || `post-${Date.now()}`;
}

/** Build a UTC ISO string for a Tehran wall-clock date/time. */
function tehranISO(y: number, m: number, d: number, hour: number, minute: number): string {
  return new Date(Date.UTC(y, m - 1, d, hour, minute) - TEHRAN_OFFSET_MIN * 60000).toISOString();
}

export async function GET() {
  const s = await getSession();
  if (s?.role !== "super_admin") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const list = getAllPosts();
  return NextResponse.json({
    ok: true,
    queued: list.filter((p) => p.status === "queued" && !p.genError).length,
    failed: list.filter((p) => p.status === "queued" && p.genError).length,
    scheduled: list.filter((p) => p.status === "scheduled").length,
  });
}

export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "super_admin") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));

  let topics: string[] = Array.isArray(b.topics)
    ? b.topics.map((x: unknown) => String(x).trim()).filter(Boolean)
    : [];

  // optional: generate topics from a theme
  const theme = String(b.theme || "").trim();
  const count = Math.min(50, Math.max(1, Number(b.count) || topics.length || 10));
  if (topics.length === 0 && theme) {
    const system = "تو استراتژیست محتوا و متخصص سئو هستی. فقط یک آرایهٔ JSON از عنوان‌های مقاله برگردان.";
    const r = await callAIDetailed(system, [{ role: "user", content: `${count} عنوان مقالهٔ جذاب، متنوع و سئوشده دربارهٔ «${theme}» پیشنهاد بده. فقط آرایهٔ JSON: ["...","..."]` }], modelFor("article"), 1500);
    const arr = r.text ? parseJson<string[]>(r.text) : null;
    if (!Array.isArray(arr) || arr.length === 0) {
      return NextResponse.json({ ok: false, error: r.error === "not-configured" ? "ai-unavailable" : "topics-failed", detail: r.error }, { status: 502 });
    }
    topics = arr.map((x) => String(x).trim()).filter(Boolean).slice(0, count);
  }

  if (topics.length === 0) return NextResponse.json({ ok: false, error: "topics-required" }, { status: 400 });

  const perDay = Math.min(24, Math.max(1, Number(b.perDay) || 5));
  const hours: number[] = Array.isArray(b.hours) && b.hours.length
    ? b.hours.map((h: unknown) => Math.min(23, Math.max(0, Math.floor(Number(h) || 0))))
    : [9, 12, 15, 18, 21];
  const words = Math.min(6000, Math.max(300, Number(b.words) || 1200));
  const tone = String(b.tone || "").trim();
  const keyword = String(b.keyword || "").trim();
  const category = String(b.category || "").trim();

  // start date: gregorian yyyy-mm-dd (client converts from Shamsi). Default: tomorrow Tehran.
  let sy: number, sm: number, sd: number;
  const sd0 = String(b.startDate || "").match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (sd0) {
    sy = Number(sd0[1]); sm = Number(sd0[2]); sd = Number(sd0[3]);
  } else {
    const t = new Date(Date.now() + 24 * 3600 * 1000);
    sy = t.getUTCFullYear(); sm = t.getUTCMonth() + 1; sd = t.getUTCDate();
  }

  const list = getAllPosts();
  let id = nextPostId();
  const created: StoredPost[] = [];

  topics.forEach((topic, i) => {
    const day = Math.floor(i / perDay);
    const slot = i % perDay;
    const hour = hours[slot % hours.length];
    const minute = (slot * 9 + (i % 3) * 5) % 60;
    const publishAt = tehranISO(sy, sm, sd + day, hour, minute);
    const post: StoredPost = {
      id: id++,
      slug: slugify(topic) + "-" + id,
      hue: Math.floor(Math.random() * 360),
      author: "تیم محتوا",
      date: new Date().toISOString(),
      fa: topic,
      en: topic,
      excerptFa: "",
      excerptEn: "",
      bodyFa: "",
      bodyEn: "",
      catFa: category || "عمومی",
      catEn: category || "General",
      tags: [],
      status: "queued",
      publishAt,
      genTopic: topic,
      genWords: words,
      genTone: tone || undefined,
      genKeyword: keyword || undefined,
    };
    created.push(post);
  });

  savePosts([...created, ...list]);
  return NextResponse.json({ ok: true, count: created.length, topics });
}
