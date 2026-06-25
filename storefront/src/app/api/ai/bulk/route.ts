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

/** Spread `perDay` publish times evenly across the [startHour, endHour] window. */
function spreadHours(perDay: number, startHour: number, endHour: number): { h: number; m: number }[] {
  if (perDay <= 1) return [{ h: startHour, m: 0 }];
  const span = Math.max(0, endHour - startHour);
  const step = span / (perDay - 1);
  return Array.from({ length: perDay }, (_, i) => {
    const t = startHour + step * i;
    return { h: Math.min(23, Math.floor(t)), m: Math.round((t - Math.floor(t)) * 60) % 60 };
  });
}

/** Compute `count` publish times: `perDay` posts spread over [startHour,endHour]
 *  on allowed weekdays (0=Sun..6=Sat, empty = every day), from a Shamsi start. */
function computeSchedule(opts: {
  count: number; perDay: number; startHour: number; endHour: number;
  weekdays: number[]; sy: number; sm: number; sd: number;
}): string[] {
  const { count, perDay, startHour, endHour, weekdays, sy, sm, sd } = opts;
  const allow = new Set(weekdays);
  const slots = spreadHours(perDay, startHour, endHour);
  const out: string[] = [];
  let dayOff = 0;
  let guard = 0;
  while (out.length < count && guard < 3000) {
    guard++;
    const dt = new Date(Date.UTC(sy, sm - 1, sd + dayOff));
    const wd = dt.getUTCDay();
    if (allow.size === 0 || allow.has(wd)) {
      for (let i = 0; i < slots.length && out.length < count; i++) {
        out.push(tehranISO(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate(), slots[i].h, slots[i].m));
      }
    }
    dayOff++;
  }
  return out;
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

  // retry failed generations: clear genError so the worker re-picks them
  if (b.retry) {
    const list = getAllPosts();
    let retried = 0;
    for (const p of list) {
      if (p.status === "queued" && p.genError && (b.id == null || p.id === Number(b.id))) {
        delete p.genError;
        retried++;
      }
    }
    if (retried) savePosts(list);
    return NextResponse.json({ ok: true, retried });
  }

  let topics: string[] = Array.isArray(b.topics)
    ? b.topics.map((x: unknown) => String(x).trim()).filter(Boolean)
    : [];

  const theme = String(b.theme || "").trim();
  const count = Math.min(365, Math.max(1, Number(b.count) || topics.length || 10));

  // scheduling params: perDay posts spread across [startHour, endHour]
  const perDay = Math.min(24, Math.max(1, Number(b.perDay) || 3));
  const startHour = Math.min(23, Math.max(0, Math.floor(Number(b.startHour ?? 9))));
  const endHour = Math.min(23, Math.max(startHour, Math.floor(Number(b.endHour ?? 21))));
  const weekdays: number[] = Array.isArray(b.weekdays)
    ? (b.weekdays as unknown[]).map((d) => Math.floor(Number(d))).filter((d) => Number.isFinite(d) && d >= 0 && d <= 6)
    : [];
  const words = Math.min(6000, Math.max(300, Number(b.words) || 1200));
  const tone = String(b.tone || "").trim();
  const keyword = String(b.keyword || "").trim();
  const category = String(b.category || "").trim();
  const genCover = Boolean(b.genCover);

  // start date: gregorian yyyy-mm-dd (client converts from Shamsi). Default: tomorrow Tehran.
  let sy: number, sm: number, sd: number;
  const sd0 = String(b.startDate || "").match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (sd0) {
    sy = Number(sd0[1]); sm = Number(sd0[2]); sd = Number(sd0[3]);
  } else {
    const t = new Date(Date.now() + 24 * 3600 * 1000);
    sy = t.getUTCFullYear(); sm = t.getUTCMonth() + 1; sd = t.getUTCDate();
  }

  // PREVIEW: just return the computed schedule (no AI, no save)
  if (b.preview) {
    const want = topics.length || count;
    const schedule = computeSchedule({ count: Math.min(want, 365), perDay, startHour, endHour, weekdays, sy, sm, sd });
    return NextResponse.json({ ok: true, preview: true, schedule, count: schedule.length });
  }

  // generate topics from a theme when not provided manually
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

  const schedule = computeSchedule({ count: topics.length, perDay, startHour, endHour, weekdays, sy, sm, sd });
  const list = getAllPosts();
  let id = nextPostId();
  const created: StoredPost[] = topics.map((topic, i) => {
    id++;
    return {
      id,
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
      publishAt: schedule[i] ?? schedule[schedule.length - 1],
      genTopic: topic,
      genWords: words,
      genTone: tone || undefined,
      genKeyword: keyword || undefined,
      genCover: genCover || undefined,
    } satisfies StoredPost;
  });

  savePosts([...created, ...list]);
  return NextResponse.json({ ok: true, count: created.length, topics });
}
