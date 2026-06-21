import "server-only";
import { POSTS, type Post } from "@/data/posts";
import { readArray, writeArray } from "./settings";

export type PostStatus = "published" | "scheduled" | "draft" | "queued";
export interface StoredPost extends Post {
  status: PostStatus;
  publishAt?: string; // ISO; when status === "scheduled" | "queued"
  // generation queue (status === "queued"): worker fills the body then flips to "scheduled"
  genTopic?: string;
  genWords?: number;
  genTone?: string;
  genKeyword?: string;
  genError?: string;
}

const seed = (): StoredPost[] =>
  POSTS.map((p) => ({ ...p, status: "published" as PostStatus }));

function read(): StoredPost[] {
  const arr = readArray<StoredPost>("posts.json", []);
  return arr.length ? arr : seed();
}
function write(list: StoredPost[]) {
  return writeArray<StoredPost>("posts.json", list);
}

/** Flip any scheduled posts whose time has come to published (auto-post). */
function autoPublish(list: StoredPost[]): { list: StoredPost[]; changed: boolean } {
  const now = Date.now();
  let changed = false;
  for (const p of list) {
    if (p.status === "scheduled" && p.publishAt && new Date(p.publishAt).getTime() <= now) {
      p.status = "published";
      p.date = new Date().toISOString();
      delete p.publishAt;
      changed = true;
    }
  }
  return { list, changed };
}

export function getAllPosts(): StoredPost[] {
  const { list, changed } = autoPublish(read());
  if (changed) write(list);
  return list;
}

export function getPublishedPosts(): StoredPost[] {
  return getAllPosts()
    .filter((p) => p.status === "published")
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getScheduledPosts(): StoredPost[] {
  return getAllPosts().filter((p) => p.status !== "published");
}

export function postBySlugStore(slug: string): StoredPost | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

export function nextPostId(): number {
  return getAllPosts().reduce((m, p) => Math.max(m, p.id), 0) + 1;
}

export function savePosts(list: StoredPost[]) {
  return write(list);
}

let queueBusy = false;
/** Generate the body for the next queued post (oldest publishAt first), then
 *  flip it to "scheduled". Called periodically from instrumentation. Generates
 *  one post per tick to respect rate limits. */
export async function processQueue(): Promise<boolean> {
  if (queueBusy) return false;
  const list = getAllPosts();
  const next = list
    .filter((p) => p.status === "queued" && !p.genError)
    .sort((a, b) => (a.publishAt || "") < (b.publishAt || "") ? -1 : 1)[0];
  if (!next) return false;

  queueBusy = true;
  try {
    const { callAIDetailed, parseJson, modelFor, stripFence, relevantProducts } = await import("./ai");
    const words = next.genWords || 1200;
    const targetChars = words * 6;
    const tone = next.genTone ? `\nلحن متن: ${next.genTone}.` : "";
    const kw = next.genKeyword ? `\nکلمهٔ کلیدی اصلی «${next.genKeyword}» را طبیعی به کار ببر.` : "";
    const prods = relevantProducts(next.genTopic || "", "fa", 8);
    const linkRule = prods.length
      ? `\nدر متن، ۳ تا ۵ لینک داخلی به محصولات مرتبط زیر را به‌صورت طبیعی با Markdown [نام](آدرس) اضافه کن و در انتها بخش «محصولات پیشنهادی» بیاور. فقط از همین آدرس‌ها استفاده کن:\n${prods.map((p) => `- ${p.name} (${p.brand}) → ${p.url}`).join("\n")}`
      : "";
    const system = "تو نویسندهٔ حرفه‌ای بلاگ فارسی و متخصص سئو هستی. body را به‌صورت متن Markdown خام بنویس و هرگز داخل بلوک کد (```) قرار نده. فقط یک JSON معتبر برگردان، بدون متن اضافه.";
    const prompt = `یک مقالهٔ کامل و سئوشده دربارهٔ «${next.genTopic}» بنویس (حدود ${words} کلمه، حداقل ${targetChars} کاراکتر، با زیرعنوان ## و فهرست‌ها).${tone}${kw}${linkRule}\n\n{"title":"عنوان جذاب","excerpt":"خلاصه","body":"متن Markdown","category":"دسته","tags":["۴ تا ۶ برچسب"],"seoTitle":"عنوان سئو","metaDesc":"متا","keyword":"کلمهٔ کلیدی"}`;
    const r = await callAIDetailed(system, [{ role: "user", content: prompt }], modelFor("article"), Math.min(16000, Math.ceil(targetChars / 1.5) + 1500));
    const j = r.text ? parseJson<{ title: string; excerpt: string; body: string; category: string; tags: string[]; seoTitle?: string; metaDesc?: string; keyword?: string }>(r.text) : null;
    if (j && j.body) j.body = stripFence(j.body);

    const fresh = getAllPosts();
    const idx = fresh.findIndex((p) => p.id === next.id);
    if (idx < 0) return false;
    if (j && j.title && j.body) {
      fresh[idx] = {
        ...fresh[idx],
        fa: j.title.slice(0, 160),
        en: j.title.slice(0, 160),
        excerptFa: (j.excerpt || "").slice(0, 320),
        excerptEn: (j.excerpt || "").slice(0, 320),
        bodyFa: j.body,
        bodyEn: j.body,
        catFa: (j.category || fresh[idx].catFa || "عمومی").slice(0, 60),
        catEn: (j.category || "General").slice(0, 60),
        tags: Array.isArray(j.tags) ? j.tags.map(String).slice(0, 8) : fresh[idx].tags,
        status: "scheduled",
        genTopic: undefined,
        genWords: undefined,
        genTone: undefined,
        genKeyword: undefined,
      };
    } else {
      // mark error so we don't loop forever; keep it queued-visible
      fresh[idx] = { ...fresh[idx], genError: r.error || "generation-failed" };
    }
    savePosts(fresh);
    return true;
  } catch {
    return false;
  } finally {
    queueBusy = false;
  }
}
