"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useShop } from "@/lib/store";
import { formatDate } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown";
import { UploadButton } from "@/components/UploadButton";
import { JalaliDateTimePicker } from "@/components/JalaliDateTimePicker";
import { JALALI_MONTHS, jalaliMonthLength, jalaliYearNow, toGregorian, dateToJalaliParts } from "@/lib/jalali";
import { Sparkle, Plus, Trash } from "@/components/Icons";

interface PostRow {
  id: number;
  slug: string;
  fa: string;
  excerptFa: string;
  bodyFa: string;
  catFa: string;
  tags: string[];
  cover?: string;
  status: string;
  publishAt?: string;
  date: string;
  genError?: string;
  relatedProducts?: number[];
}

const blank = {
  id: 0 as number, title: "", slug: "", catFa: "", tags: "", cover: "", excerpt: "", body: "",
  keyword: "", seoTitle: "", metaDesc: "",
};

const LENGTHS = [
  { v: 600, fa: "کوتاه (~۶۰۰ کلمه)" },
  { v: 1200, fa: "متوسط (~۱۲۰۰ کلمه)" },
  { v: 2000, fa: "بلند (~۲۰۰۰ کلمه)" },
  { v: 3000, fa: "خیلی بلند (~۳۰۰۰ کلمه)" },
];

const faNum = (n: number) => n.toLocaleString("fa-IR", { useGrouping: false });

export function ArticleEditor() {
  const { locale, toast, products, productById } = useShop();
  const fa = locale === "fa";
  const card = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16 } as const;
  const inputStyle = { background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" } as const;
  const inputCls = "w-full rounded-[10px] px-3 py-2.5 text-[14px] outline-none";

  const [tab, setTab] = useState<"editor" | "bulk">("editor");
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [form, setForm] = useState({ ...blank });
  const [editing, setEditing] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiWords, setAiWords] = useState(1200);
  const [tone, setTone] = useState("");
  const [busy, setBusy] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishAt, setPublishAt] = useState("");
  const [titleSug, setTitleSug] = useState<string[]>([]);
  const [cats, setCats] = useState<string[]>([]);
  const [relatedIds, setRelatedIds] = useState<number[]>([]);
  const [prodSearch, setProdSearch] = useState("");
  const [listFilter, setListFilter] = useState<"all" | "published" | "scheduled" | "queued" | "draft">("all");
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const load = () =>
    fetch("/api/posts?all=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => Array.isArray(d?.posts) && setPosts(d.posts))
      .catch(() => {});
  const loadCats = () =>
    fetch("/api/blog/categories")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => Array.isArray(d?.categories) && setCats(d.categories))
      .catch(() => {});
  useEffect(() => { load(); loadCats(); }, []);

  const addCat = async () => {
    const name = window.prompt(fa ? "نام دستهٔ جدید:" : "New category name:");
    if (!name || !name.trim()) return;
    const r = await fetch("/api/blog/categories", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "add", name: name.trim() }) });
    const d = await r.json().catch(() => ({}));
    if (d.ok) { setCats(d.categories); set("catFa", name.trim()); toast(fa ? "دسته اضافه شد ✓" : "Added ✓"); }
  };
  const delCat = async (name: string) => {
    const r = await fetch("/api/blog/categories", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "delete", name }) });
    const d = await r.json().catch(() => ({}));
    if (d.ok) setCats(d.categories);
  };

  const set = (k: keyof typeof blank, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const slugify = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\p{L}\p{N}-]/gu, "").slice(0, 80);

  const newPost = () => { setForm({ ...blank }); setEditing(false); setPublishAt(""); setAiTopic(""); setTitleSug([]); setRelatedIds([]); };
  const editPost = (p: PostRow) => {
    setForm({ id: p.id, title: p.fa, slug: p.slug, catFa: p.catFa, tags: (p.tags || []).join("، "), cover: p.cover || "", excerpt: p.excerptFa, body: p.bodyFa, keyword: "", seoTitle: "", metaDesc: "" });
    setEditing(true);
    setPublishAt(p.publishAt || "");
    setRelatedIds(p.relatedProducts || []);
    setTab("editor");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // related products
  const toggleRelated = (id: number) => setRelatedIds((ids) => ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  const suggestRelated = () => run("related", async () => {
    const q = form.title.trim() || aiTopic.trim();
    if (!q) { toast(fa ? "اول عنوان مقاله را بنویس" : "Write a title first"); return; }
    const r = await fetch(`/api/blog/related?q=${encodeURIComponent(q)}`);
    const d = await r.json().catch(() => ({}));
    if (Array.isArray(d?.ids) && d.ids.length) { setRelatedIds((cur) => Array.from(new Set([...cur, ...d.ids])).slice(0, 12)); toast(fa ? "محصولات مرتبط پیشنهاد شد ✓" : "Suggested ✓"); }
    else toast(fa ? "محصول مرتبطی پیدا نشد" : "No matches");
  });
  const insertRelatedLinks = () => {
    if (!relatedIds.length) { toast(fa ? "اول محصول انتخاب کن" : "Select products first"); return; }
    const lines = relatedIds.map((id) => { const p = productById(id); return p ? `- [${fa ? p.fa : p.en}](/${locale}/product/${id})` : ""; }).filter(Boolean);
    insertAt(`\n\n## ${fa ? "محصولات پیشنهادی" : "Suggested products"}\n\n${lines.join("\n")}\n\n`);
    toast(fa ? "لینک‌ها در متن درج شد ✓" : "Links inserted ✓");
  };

  // generic AI helper – surfaces useful errors
  const ai = async (payload: Record<string, unknown>): Promise<Record<string, unknown> | null> => {
    const r = await fetch("/api/ai/article", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const d = await r.json().catch(() => ({}));
    if (d.ok) return d;
    if (d.error === "ai-unavailable") toast(fa ? "هوش مصنوعی تنظیم نشده — در «تنظیمات ← هوش مصنوعی» کلید و مدل را ذخیره کن" : "AI not configured — set key in Settings → AI");
    else toast((fa ? "خطای هوش مصنوعی: " : "AI error: ") + (d.detail || d.error || ""));
    return null;
  };

  const run = async (key: string, fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(key);
    try { await fn(); } catch { toast(fa ? "خطای شبکه" : "Network error"); } finally { setBusy(""); }
  };

  const genFull = () => run("gen", async () => {
    const topic = aiTopic.trim() || form.title.trim();
    if (!topic) { toast(fa ? "موضوع مقاله را وارد کن" : "Enter a topic"); return; }
    const d = await ai({ action: "generate", topic, words: aiWords, tone, keyword: form.keyword });
    if (!d) return;
    const a = d.article as Record<string, unknown>;
    setForm((f) => ({
      ...f,
      title: (a.title as string) || f.title,
      slug: f.slug || slugify((a.title as string) || ""),
      excerpt: (a.excerpt as string) || f.excerpt,
      body: (a.body as string) || "",
      catFa: (a.category as string) || f.catFa,
      tags: Array.isArray(a.tags) ? (a.tags as string[]).join("، ") : f.tags,
      keyword: (a.keyword as string) || f.keyword,
      seoTitle: (a.seoTitle as string) || f.seoTitle,
      metaDesc: (a.metaDesc as string) || f.metaDesc,
    }));
    toast(fa ? "مقاله تولید شد ✓" : "Article generated ✓");
  });

  // body transforms (replace whole body)
  const transform = (action: string, label: string) => run(action, async () => {
    if (!form.body.trim()) { toast(fa ? "ابتدا متنی وارد کن یا مقاله تولید کن" : "Write or generate first"); return; }
    const d = await ai({ action, body: form.body, title: form.title, keyword: form.keyword, minChars: action === "expand" ? form.body.length + 2000 : 0 });
    if (!d) return;
    set("body", d.body as string);
    toast(label + " ✓");
  });

  // snippets (append to body)
  const snippet = (action: string, label: string) => run(action, async () => {
    const d = await ai({ action, body: form.body, title: form.title });
    if (!d) return;
    set("body", (form.body ? form.body.trimEnd() + "\n\n" : "") + (d.snippet as string));
    toast(label + " ✓");
  });

  const genTitles = () => run("titles", async () => {
    const d = await ai({ action: "titles", title: form.title || aiTopic, body: form.body });
    if (d) setTitleSug(d.titles as string[]);
  });
  const genTags = () => run("tags", async () => {
    const d = await ai({ action: "tags", title: form.title, body: form.body });
    if (d) set("tags", (d.tags as string[]).join("، "));
  });
  const genMeta = () => run("meta", async () => {
    const d = await ai({ action: "meta", title: form.title, body: form.body });
    if (!d) return;
    const m = d.meta as Record<string, string>;
    setForm((f) => ({ ...f, excerpt: m.excerpt || f.excerpt, seoTitle: m.seoTitle || f.seoTitle, metaDesc: m.metaDesc || f.metaDesc, keyword: m.keyword || f.keyword }));
    toast(fa ? "چکیده و متا تولید شد ✓" : "Meta generated ✓");
  });
  const genCover = () => run("cover", async () => {
    if (!form.title.trim()) { toast(fa ? "اول عنوان را بنویس" : "Write a title first"); return; }
    const r = await fetch("/api/ai/image", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt: `تصویر شاخص حرفه‌ای و مرتبط برای مقاله: ${form.title}`, size: "1536x1024" }) });
    const d = await r.json().catch(() => ({}));
    if (d.ok && d.url) { set("cover", d.url); toast(fa ? "تصویر شاخص ساخته شد ✓" : "Cover generated ✓"); }
    else toast((fa ? "خطا: " : "Error: ") + (d.error || ""));
  });

  // toolbar
  const wrap = (before: string, after = before, block = false) => {
    const el = bodyRef.current; if (!el) return;
    const s = el.selectionStart, e = el.selectionEnd;
    const sel = form.body.slice(s, e) || (fa ? "متن" : "text");
    const ins = block ? `${before}${sel}` : `${before}${sel}${after}`;
    set("body", form.body.slice(0, s) + ins + form.body.slice(e));
    requestAnimationFrame(() => { el.focus(); el.selectionStart = s + before.length; el.selectionEnd = s + before.length + sel.length; });
  };
  const insertAt = (text: string) => {
    const el = bodyRef.current;
    if (!el) { set("body", form.body + text); return; }
    const s = el.selectionStart;
    set("body", form.body.slice(0, s) + text + form.body.slice(s));
  };
  const insertImage = (url: string) => { insertAt(`\n\n![](${url})\n\n`); toast(fa ? "تصویر درج شد ✓" : "Image inserted"); };
  const insertVideo = () => { const u = window.prompt(fa ? "آدرس ویدئو (یوتیوب/آپارات/mp4):" : "Video URL:"); if (u) insertAt(`\n\n@video(${u.trim()})\n\n`); };
  const insertLink = () => { const u = window.prompt(fa ? "آدرس لینک:" : "Link URL:"); if (u) wrap("[", `](${u})`); };
  const clearFmt = () => {
    const el = bodyRef.current; if (!el) return;
    const s = el.selectionStart, e = el.selectionEnd;
    if (s === e) return;
    const cleaned = form.body.slice(s, e).replace(/^#{1,6}\s+/gm, "").replace(/^>\s?/gm, "").replace(/[*_`]/g, "").replace(/^\s*[-*]\s+/gm, "").replace(/^\s*\d+[.)]\s+/gm, "");
    set("body", form.body.slice(0, s) + cleaned + form.body.slice(e));
  };

  const save = async (status: "draft" | "published" | "scheduled") => {
    if (!form.title.trim()) { toast(fa ? "عنوان الزامی است" : "Title required"); return; }
    if (status === "scheduled" && !publishAt) { toast(fa ? "زمان انتشار را انتخاب کن" : "Pick a publish time"); return; }
    setSaving(true);
    try {
      const post = {
        fa: form.title.trim(),
        slug: form.slug.trim() || slugify(form.title),
        excerptFa: form.excerpt.trim(),
        bodyFa: form.body,
        catFa: form.catFa.trim() || (fa ? "عمومی" : "General"),
        tags: form.tags.split(/[,،]/).map((x) => x.trim()).filter(Boolean),
        cover: form.cover || undefined,
        relatedProducts: relatedIds,
      };
      const body = { action: editing ? "update" : "create", id: form.id, status, publishAt: status === "scheduled" ? new Date(publishAt).toISOString() : undefined, post };
      const r = await fetch("/api/posts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (d.ok) {
        toast(status === "published" ? (fa ? "منتشر شد ✓" : "Published ✓") : status === "scheduled" ? (fa ? "زمان‌بندی شد ✓" : "Scheduled ✓") : (fa ? "پیش‌نویس ذخیره شد ✓" : "Draft saved ✓"));
        setPosts(d.posts || posts);
        newPost();
      } else toast(fa ? "ذخیره ناموفق بود" : "Save failed");
    } catch { toast(fa ? "خطای شبکه" : "Network error"); } finally { setSaving(false); }
  };

  const del = async (id: number) => {
    const r = await fetch("/api/posts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "delete", id }) });
    const d = await r.json();
    if (d.ok) { setPosts(d.posts || []); toast(fa ? "حذف شد" : "Deleted"); }
  };

  const retryGen = async (id?: number) => {
    const r = await fetch("/api/ai/bulk", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ retry: true, id }) });
    const d = await r.json().catch(() => ({}));
    if (d.ok) { toast(fa ? `${faNum(d.retried || 0)} مقاله دوباره در صف قرار گرفت ✓` : "Re-queued ✓"); setTimeout(load, 500); }
    else toast(fa ? "خطا" : "Error");
  };

  // SEO scoring
  const words = useMemo(() => form.body.trim().split(/\s+/).filter(Boolean).length, [form.body]);
  const checks = useMemo(() => {
    const kw = form.keyword.trim();
    return [
      { ok: !!kw, fa: "کلمهٔ کلیدی اصلی را وارد کن" },
      { ok: words >= 300, fa: "متن حداقل ۳۰۰ کلمه باشد" },
      { ok: !!kw && form.title.includes(kw), fa: "کلمهٔ کلیدی در عنوان بیاید" },
      { ok: form.metaDesc.length >= 70 && form.metaDesc.length <= 160, fa: "توضیح متا ۷۰ تا ۱۶۰ کاراکتر باشد" },
      { ok: /(^|\n)##\s/.test(form.body), fa: "زیرعنوان (تیتر ۲) اضافه کن" },
      { ok: !!kw && form.body.includes(kw), fa: "کلمهٔ کلیدی در متن استفاده شود" },
    ];
  }, [form.keyword, form.title, form.metaDesc, form.body, words]);
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  const scoreColor = score >= 80 ? "#1f8a5b" : score >= 50 ? "#d97706" : "#e11d48";

  const tb = "cursor-pointer rounded-[8px] px-2.5 py-1.5 text-[12.5px] font-bold disabled:opacity-50";
  const toolBtn = "cursor-pointer rounded-[10px] px-3 py-1.5 text-[12.5px] font-bold disabled:opacity-50";
  const statusBadge = (st: string, err?: string) => {
    const map: Record<string, [string, string, string]> = {
      published: ["#1f8a5b", "rgba(31,138,91,.15)", fa ? "منتشرشده" : "Published"],
      scheduled: ["#0ea5e9", "rgba(14,165,233,.12)", fa ? "زمان‌بندی‌شده" : "Scheduled"],
      queued: ["#7c3aed", "rgba(124,58,237,.12)", fa ? "در صف تولید" : "Queued"],
      draft: ["#d97706", "rgba(217,119,6,.12)", fa ? "پیش‌نویس" : "Draft"],
    };
    const [c, bg, l] = err ? ["#e11d48", "rgba(225,29,72,.12)", fa ? "خطای تولید" : "Gen failed"] : (map[st] || map.draft);
    return <span className="rounded-full px-2.5 py-1 text-[11.5px] font-extrabold" style={{ color: c, background: bg }}>{l}</span>;
  };

  return (
    <>
      {/* tabs */}
      <div className="mb-4 flex gap-2">
        <button onClick={() => setTab("editor")} className="cursor-pointer rounded-[10px] px-4 py-2 text-[13.5px] font-extrabold" style={tab === "editor" ? { background: "var(--accent)", color: "#fff", border: "none" } : { ...inputStyle }}>{fa ? "ویرایشگر مقاله" : "Editor"}</button>
        <button onClick={() => setTab("bulk")} className="cursor-pointer rounded-[10px] px-4 py-2 text-[13.5px] font-extrabold" style={tab === "bulk" ? { background: "var(--accent)", color: "#fff", border: "none" } : { ...inputStyle }}>{fa ? "تولید انبوه و زمان‌بندی" : "Bulk & schedule"}</button>
      </div>

      {tab === "bulk" ? (
        <BulkScheduler fa={fa} locale={locale} card={card} inputCls={inputCls} inputStyle={inputStyle} toast={toast} onChanged={load} cats={cats} onAddCat={addCat} />
      ) : (
        <>
          {/* header actions */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <button onClick={() => save("published")} disabled={saving} className="cursor-pointer rounded-[10px] border-none px-5 py-2.5 text-[13.5px] font-extrabold text-white disabled:opacity-60" style={{ background: "var(--accent)" }}>{editing ? (fa ? "ذخیره و انتشار" : "Save & publish") : fa ? "انتشار" : "Publish"}</button>
              <button onClick={() => save("draft")} disabled={saving} className="cursor-pointer rounded-[10px] px-4 py-2.5 text-[13.5px] font-bold disabled:opacity-60" style={inputStyle}>{fa ? "ذخیرهٔ پیش‌نویس" : "Save draft"}</button>
            </div>
            <button onClick={newPost} className="cursor-pointer rounded-[10px] px-4 py-2 text-[12.5px] font-bold" style={inputStyle}>{fa ? "+ مقالهٔ جدید" : "+ New"}</button>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
            {/* main column */}
            <div className="flex flex-col gap-4">
              {/* title + slug */}
              <div className="p-5" style={card}>
                <input className="mb-2 w-full bg-transparent text-[22px] font-extrabold outline-none" style={{ color: "var(--text)" }} value={form.title} placeholder={fa ? "عنوان مقاله را اینجا بنویس…" : "Article title…"} onChange={(e) => { set("title", e.target.value); if (!editing && (!form.slug || form.slug === slugify(form.title))) set("slug", slugify(e.target.value)); }} />
                <div className="flex items-center gap-1 text-[12.5px]" style={{ color: "var(--muted)" }} dir="ltr">
                  <span className="whitespace-nowrap">/blog/</span>
                  <input className="w-full bg-transparent outline-none" style={{ color: "var(--muted)" }} value={form.slug} placeholder="slug" onChange={(e) => set("slug", e.target.value)} dir="ltr" />
                </div>
                {titleSug.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {titleSug.map((tt, i) => (
                      <button key={i} onClick={() => { set("title", tt); set("slug", slugify(tt)); setTitleSug([]); }} className="cursor-pointer rounded-full px-3 py-1 text-[12px] font-bold" style={inputStyle}>{tt}</button>
                    ))}
                  </div>
                )}
              </div>

              {/* AI panel */}
              <div className="p-5" style={{ ...card, background: "var(--surface2)", borderColor: "var(--accent)" }}>
                <h2 className="mb-3 flex items-center gap-2 text-[14px] font-extrabold" style={{ color: "var(--accent)" }}><Sparkle size={16} /> {fa ? "نوشتن با هوش مصنوعی (انسان‌نما و سئو)" : "Write with AI"}</h2>
                <div className="flex flex-wrap items-stretch gap-2">
                  <input className={`${inputCls} min-w-[220px] flex-1`} style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }} value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} placeholder={fa ? "موضوع مقاله (مثلاً: راهنمای خرید هدفون بی‌سیم)" : "Topic"} />
                  <select className={inputCls} style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", width: "auto" }} value={aiWords} onChange={(e) => setAiWords(Number(e.target.value))}>
                    {LENGTHS.map((l) => <option key={l.v} value={l.v}>{l.fa}</option>)}
                  </select>
                  <select className={inputCls} style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", width: "auto" }} value={tone} onChange={(e) => setTone(e.target.value)}>
                    <option value="">{fa ? "لحن پیش‌فرض" : "Default tone"}</option>
                    <option value="رسمی">{fa ? "رسمی" : "Formal"}</option>
                    <option value="صمیمی">{fa ? "صمیمی" : "Friendly"}</option>
                    <option value="فنی و تخصصی">{fa ? "فنی" : "Technical"}</option>
                  </select>
                  <button onClick={genFull} disabled={!!busy} className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border-none px-5 py-2.5 text-[13.5px] font-extrabold text-white disabled:opacity-60" style={{ background: "var(--accent)" }}>
                    <Sparkle size={15} /> {busy === "gen" ? (fa ? "در حال نوشتن…" : "Writing…") : fa ? "بنویس مقالهٔ کامل" : "Write full article"}
                  </button>
                </div>
                {/* AI tools grid */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {([
                    ["expand", fa ? "✦ طولانی‌تر کن" : "Longer", () => transform("expand", fa ? "طولانی‌تر شد" : "Expanded")],
                    ["faq", fa ? "❓ سؤالات متداول" : "FAQ", () => snippet("faq", fa ? "سؤالات متداول اضافه شد" : "FAQ added")],
                    ["keypoints", fa ? "◆ نکات کلیدی" : "Key points", () => snippet("keypoints", fa ? "نکات کلیدی اضافه شد" : "Key points added")],
                    ["rewrite", fa ? "↻ بهبود و بازنویسی" : "Rewrite", () => transform("rewrite", fa ? "بازنویسی شد" : "Rewritten")],
                    ["conclusion", fa ? "⊕ جمع‌بندی" : "Conclusion", () => snippet("conclusion", fa ? "جمع‌بندی اضافه شد" : "Conclusion added")],
                    ["toc", fa ? "≣ فهرست مطالب" : "TOC", () => snippet("toc", fa ? "فهرست مطالب اضافه شد" : "TOC added")],
                    ["keyword", fa ? "🎯 بهینه‌سازی کلمهٔ کلیدی" : "Keyword optimize", () => transform("keyword", fa ? "بهینه شد" : "Optimized")],
                    ["titles", fa ? "✎ پیشنهاد عنوان" : "Title ideas", genTitles],
                    ["tags", fa ? "🏷 تولید برچسب" : "Tags", genTags],
                    ["meta", fa ? "📝 چکیده و متا" : "Excerpt & meta", genMeta],
                    ["cover", fa ? "🖼 تصویر شاخص AI" : "AI cover", genCover],
                    ["proofread", fa ? "✓ ویرایش نگارشی" : "Proofread", () => transform("proofread", fa ? "ویرایش شد" : "Proofread")],
                  ] as const).map(([key, label, fn]) => (
                    <button key={key} onClick={fn} disabled={!!busy} className={toolBtn} style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>
                      {busy === key ? "…" : label}
                    </button>
                  ))}
                </div>
              </div>

              {/* excerpt */}
              <div className="p-5" style={card}>
                <label className="mb-1 block text-[12.5px] font-bold" style={{ color: "var(--muted)" }}>{fa ? "خلاصه" : "Excerpt"}</label>
                <textarea className={`${inputCls} mb-3`} style={{ ...inputStyle, minHeight: 52, resize: "vertical" }} value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} />

                {/* toolbar */}
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  <button onClick={() => wrap("**")} className={tb} style={{ ...inputStyle, fontWeight: 800 }}>B</button>
                  <button onClick={() => wrap("*")} className={tb} style={{ ...inputStyle, fontStyle: "italic" }}>I</button>
                  <button onClick={() => wrap("# ", "", true)} className={tb} style={inputStyle}>تیتر</button>
                  <button onClick={() => wrap("## ", "", true)} className={tb} style={inputStyle}>H2</button>
                  <button onClick={() => wrap("### ", "", true)} className={tb} style={inputStyle}>H3</button>
                  <button onClick={() => wrap("- ", "", true)} className={tb} style={inputStyle}>• {fa ? "فهرست" : "List"}</button>
                  <button onClick={() => wrap("1. ", "", true)} className={tb} style={inputStyle}>۱. {fa ? "شماره‌دار" : "Numbered"}</button>
                  <button onClick={() => wrap("> ", "", true)} className={tb} style={inputStyle}>❝</button>
                  <button onClick={insertLink} className={tb} style={inputStyle}>🔗 {fa ? "لینک" : "Link"}</button>
                  <UploadButton accept="image/*" label={fa ? "🖼 عکس" : "🖼 Image"} onUploaded={(url) => insertImage(url)} />
                  <button onClick={insertVideo} className={tb} style={inputStyle}>▶ {fa ? "ویدئو" : "Video"}</button>
                  <button onClick={clearFmt} className={tb} style={inputStyle}>✕ {fa ? "پاک‌کردن قالب" : "Clear"}</button>
                </div>

                {/* editor + preview */}
                <div className="grid gap-3 lg:grid-cols-2">
                  <textarea ref={bodyRef} className={inputCls} style={{ ...inputStyle, minHeight: 380, resize: "vertical", lineHeight: 1.9 }} value={form.body} onChange={(e) => set("body", e.target.value)} placeholder={fa ? "متن مقاله را اینجا بنویس… (عکس و ویدئو هم می‌توانی اضافه کنی)" : "Article body…"} />
                  <div className="prose-mini rounded-[10px] p-4" style={{ ...inputStyle, minHeight: 380, maxHeight: 600, overflow: "auto" }} dangerouslySetInnerHTML={{ __html: renderMarkdown(form.body || (fa ? "*پیش‌نمایش زنده اینجا نمایش داده می‌شود*" : "*live preview*")) }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-[12px]" style={{ color: "var(--muted)" }}>
                  <span>{fa ? `${faNum(form.body.length)} کاراکتر • ${faNum(words)} کلمه` : `${form.body.length} chars • ${words} words`}</span>
                </div>
              </div>
            </div>

            {/* sidebar */}
            <div className="flex flex-col gap-4">
              {/* category */}
              <div className="p-4" style={card}>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-[12.5px] font-bold" style={{ color: "var(--muted)" }}>{fa ? "دسته‌بندی" : "Category"}</label>
                  <button onClick={addCat} className="cursor-pointer border-none bg-transparent text-[11.5px] font-bold" style={{ color: "var(--accent)" }}>+ {fa ? "دستهٔ جدید" : "New"}</button>
                </div>
                <select className={inputCls} style={inputStyle} value={cats.includes(form.catFa) ? form.catFa : ""} onChange={(e) => { if (e.target.value === "__add") addCat(); else set("catFa", e.target.value); }}>
                  <option value="">{fa ? "— انتخاب دسته —" : "— Select —"}</option>
                  {cats.map((c) => <option key={c} value={c}>{c}</option>)}
                  <option value="__add">{fa ? "+ افزودن دستهٔ جدید…" : "+ Add new…"}</option>
                </select>
                {cats.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {cats.map((c) => (
                      <span key={c} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-bold" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
                        {c}
                        <button onClick={() => delCat(c)} aria-label="remove" className="cursor-pointer border-none bg-transparent text-[12px] leading-none" style={{ color: "#e11d48" }}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* cover */}
              <div className="p-4" style={card}>
                <h3 className="mb-2 text-[13.5px] font-extrabold">{fa ? "تصویر شاخص" : "Cover image"}</h3>
                {form.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.cover} alt="" className="mb-2 h-32 w-full rounded-[10px] object-cover" style={{ border: "1px solid var(--border)" }} />
                ) : (
                  <div className="mb-2 flex h-28 items-center justify-center rounded-[10px] text-[12.5px]" style={{ border: "1px dashed var(--border)", color: "var(--muted)" }}>{fa ? "تصویری انتخاب نشده" : "No image"}</div>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <UploadButton accept="image/*" label={fa ? "آپلود تصویر" : "Upload"} onUploaded={(url) => set("cover", url)} />
                  <button onClick={genCover} disabled={!!busy} className={toolBtn} style={inputStyle}>{busy === "cover" ? "…" : fa ? "🖼 ساخت با AI" : "AI"}</button>
                  {form.cover && <button onClick={() => set("cover", "")} className="cursor-pointer border-none bg-transparent text-[12px] font-bold" style={{ color: "#e11d48" }}>{fa ? "حذف" : "Remove"}</button>}
                </div>
              </div>

              {/* tags */}
              <div className="p-4" style={card}>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-[12.5px] font-bold" style={{ color: "var(--muted)" }}>{fa ? "برچسب‌ها (با ویرگول)" : "Tags"}</label>
                  <button onClick={genTags} disabled={!!busy} className="cursor-pointer border-none bg-transparent text-[11.5px] font-bold" style={{ color: "var(--accent)" }}>{busy === "tags" ? "…" : fa ? "✦ تولید" : "AI"}</button>
                </div>
                <input className={inputCls} style={inputStyle} value={form.tags} onChange={(e) => set("tags", e.target.value)} />
              </div>

              {/* related products */}
              <div className="p-4" style={card}>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-[13.5px] font-extrabold">{fa ? "محصولات مرتبط" : "Related products"}</h3>
                  <button onClick={suggestRelated} disabled={!!busy} className="cursor-pointer border-none bg-transparent text-[11.5px] font-bold" style={{ color: "var(--accent)" }}>{busy === "related" ? "…" : fa ? "✦ پیشنهاد هوش مصنوعی" : "AI suggest"}</button>
                </div>
                {/* selected chips */}
                {relatedIds.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {relatedIds.map((id) => { const p = productById(id); return (
                      <span key={id} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-bold" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
                        {p ? (fa ? p.fa : p.en) : `#${id}`}
                        <button onClick={() => toggleRelated(id)} aria-label="remove" className="cursor-pointer border-none bg-transparent text-[12px] leading-none" style={{ color: "#e11d48" }}>×</button>
                      </span>
                    ); })}
                  </div>
                )}
                {/* search + pick */}
                <input className={`${inputCls} mb-2`} style={inputStyle} value={prodSearch} onChange={(e) => setProdSearch(e.target.value)} placeholder={fa ? "جستجوی محصول برای افزودن…" : "Search products…"} />
                {prodSearch.trim() && (
                  <div className="mb-2 max-h-44 overflow-auto rounded-[10px]" style={{ border: "1px solid var(--border)" }}>
                    {products
                      .filter((p) => { const q = prodSearch.trim().toLowerCase(); return (p.fa + " " + p.en + " " + p.brand).toLowerCase().includes(q); })
                      .slice(0, 20)
                      .map((p) => (
                        <button key={p.id} onClick={() => { toggleRelated(p.id); }} className="flex w-full cursor-pointer items-center justify-between border-none px-3 py-2 text-start text-[12.5px]" style={{ background: relatedIds.includes(p.id) ? "var(--surface2)" : "transparent", color: "var(--text)" }}>
                          <span className="truncate">{fa ? p.fa : p.en}</span>
                          <span className="ms-2 flex-none text-[11px] font-bold" style={{ color: relatedIds.includes(p.id) ? "#1f8a5b" : "var(--accent)" }}>{relatedIds.includes(p.id) ? "✓" : "+"}</span>
                        </button>
                      ))}
                  </div>
                )}
                {relatedIds.length > 0 && (
                  <button onClick={insertRelatedLinks} className="w-full cursor-pointer rounded-[10px] py-2 text-[12px] font-bold" style={inputStyle}>{fa ? "درج لینک محصولات در متن" : "Insert links into body"}</button>
                )}
                <p className="mt-2 text-[11px] leading-relaxed" style={{ color: "var(--muted)" }}>
                  {fa ? "این محصولات زیر مقاله به‌صورت کارت نمایش داده می‌شوند." : "Shown as cards under the article."}
                </p>
              </div>

              {/* SEO */}
              <div className="p-4" style={card}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-[13.5px] font-extrabold">{fa ? "سئو" : "SEO"}</h3>
                  <span className="rounded-full px-2.5 py-1 text-[12px] font-extrabold" style={{ color: scoreColor, background: "var(--surface2)" }}>{faNum(score)}٪</span>
                </div>
                <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--surface2)" }}>
                  <div className="h-full rounded-full" style={{ width: `${score}%`, background: scoreColor }} />
                </div>
                <label className="mb-1 mt-2 block text-[12px] font-bold" style={{ color: "var(--muted)" }}>{fa ? "کلمهٔ کلیدی اصلی" : "Focus keyword"}</label>
                <input className={`${inputCls} mb-2`} style={inputStyle} value={form.keyword} onChange={(e) => set("keyword", e.target.value)} placeholder={fa ? "مثلاً خرید هدفون" : "keyword"} />
                <label className="mb-1 block text-[12px] font-bold" style={{ color: "var(--muted)" }}>{fa ? "عنوان سئو" : "SEO title"}</label>
                <input className={`${inputCls} mb-2`} style={inputStyle} value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} placeholder={fa ? "عنوان برای گوگل" : "Title for Google"} />
                <label className="mb-1 block text-[12px] font-bold" style={{ color: "var(--muted)" }}>{fa ? `توضیح متا (${faNum(form.metaDesc.length)}/۱۶۰)` : `Meta (${form.metaDesc.length}/160)`}</label>
                <textarea className={`${inputCls} mb-3`} style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} value={form.metaDesc} onChange={(e) => set("metaDesc", e.target.value.slice(0, 200))} placeholder={fa ? "توضیح کوتاه برای نتایج گوگل" : "Meta description"} />
                <button onClick={genMeta} disabled={!!busy} className="mb-3 w-full cursor-pointer rounded-[10px] py-2 text-[12.5px] font-bold disabled:opacity-50" style={inputStyle}>{busy === "meta" ? "…" : fa ? "✦ تولید خودکار چکیده و متا" : "Generate meta"}</button>
                <ul className="flex flex-col gap-1.5">
                  {checks.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12px]" style={{ color: c.ok ? "#1f8a5b" : "var(--muted)" }}>
                      <span className="mt-0.5">{c.ok ? "✓" : "•"}</span><span>{c.fa}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* schedule */}
              <div className="p-4" style={card}>
                <h3 className="mb-2 text-[13.5px] font-extrabold">{fa ? "زمان‌بندی انتشار (شمسی)" : "Schedule"}</h3>
                <div className="mb-2"><JalaliDateTimePicker value={publishAt} onChange={setPublishAt} /></div>
                <button onClick={() => save("scheduled")} disabled={saving} className="w-full cursor-pointer rounded-[10px] py-2.5 text-[13px] font-bold disabled:opacity-60" style={{ background: "var(--surface2)", border: "1px solid var(--accent)", color: "var(--accent)" }}>{fa ? "زمان‌بندی انتشار" : "Schedule"}</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* posts list (always visible) */}
      <div className="mt-6 p-5" style={card}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-extrabold">{fa ? "مدیریت مقالات" : "Manage articles"}</h2>
          <div className="flex gap-2">
            {posts.some((p) => p.genError) && (
              <button onClick={() => retryGen()} className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] px-3 py-2 text-[12.5px] font-bold" style={{ background: "var(--surface2)", border: "1px solid #e11d48", color: "#e11d48" }}>↻ {fa ? "تلاش مجدد همهٔ خطاها" : "Retry failed"}</button>
            )}
            <button onClick={() => { newPost(); setTab("editor"); }} className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border-none px-3 py-2 text-[12.5px] font-bold text-white" style={{ background: "var(--accent)" }}><Plus size={14} /> {fa ? "مقالهٔ جدید" : "New"}</button>
          </div>
        </div>
        {/* status filter */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {([
            ["all", fa ? "همه" : "All"],
            ["published", fa ? "منتشرشده" : "Published"],
            ["scheduled", fa ? "زمان‌بندی‌شده" : "Scheduled"],
            ["queued", fa ? "در صف تولید" : "Queued"],
            ["draft", fa ? "پیش‌نویس" : "Draft"],
          ] as const).map(([k, label]) => {
            const c = k === "all" ? posts.length : posts.filter((p) => p.status === k).length;
            return (
              <button key={k} onClick={() => setListFilter(k)} className="cursor-pointer rounded-[9px] px-3 py-1.5 text-[12px] font-bold" style={listFilter === k ? { background: "var(--accent)", color: "#fff", border: "none" } : inputStyle}>
                {label} <span style={{ opacity: 0.7 }}>({faNum(c)})</span>
              </button>
            );
          })}
        </div>
        {(() => { const shown = posts.filter((p) => listFilter === "all" || p.status === listFilter); return shown.length === 0 ? (
          <div className="py-6 text-center text-[13.5px]" style={{ color: "var(--muted)" }}>{fa ? "مقاله‌ای نیست" : "No articles"}</div>
        ) : (
          <div className="flex flex-col gap-2">
            {shown.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-2 rounded-[10px] px-3 py-2.5" style={{ background: "var(--surface2)" }}>
                <span className="min-w-0 flex-1 truncate text-[13.5px] font-bold" title={p.genError ? (fa ? "علت خطا: " : "Error: ") + p.genError : undefined}>{p.fa}</span>
                {statusBadge(p.status, p.genError)}
                <span className="text-[12px]" style={{ color: "var(--muted)" }}>{(p.status === "scheduled" || p.status === "queued") && p.publishAt ? formatDate(p.publishAt, locale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : formatDate(p.date, locale, { month: "short", day: "numeric" })}</span>
                {p.genError && <button onClick={() => retryGen(p.id)} className="cursor-pointer border-none bg-transparent text-[12.5px] font-bold" style={{ color: "#e11d48" }}>↻ {fa ? "تلاش مجدد" : "Retry"}</button>}
                <button onClick={() => editPost(p)} className="cursor-pointer border-none bg-transparent text-[12.5px] font-bold" style={{ color: "var(--accent)" }}>{fa ? "ویرایش" : "Edit"}</button>
                <button onClick={() => del(p.id)} aria-label="delete" className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[8px] border-none" style={{ background: "var(--surface)", color: "#e11d48" }}><Trash size={14} /></button>
              </div>
            ))}
          </div>
        ); })()}
      </div>
    </>
  );
}

/* ---------------- Bulk generation + scheduling ---------------- */

function BulkScheduler({
  fa, locale, card, inputCls, inputStyle, toast, onChanged, cats, onAddCat,
}: {
  fa: boolean; locale: string;
  card: React.CSSProperties; inputCls: string; inputStyle: React.CSSProperties;
  toast: (m: string) => void; onChanged: () => void;
  cats: string[]; onAddCat: () => void;
}) {
  const [mode, setMode] = useState<"manual" | "auto">("auto");
  const [theme, setTheme] = useState("");
  const [count, setCount] = useState(30);
  const [topicsText, setTopicsText] = useState("");
  const [hours, setHours] = useState<number[]>([9, 13, 17, 20, 22]);
  const [weekdays, setWeekdays] = useState<number[]>([6, 0, 1, 2, 3, 4]); // skip Friday(5)
  const [words, setWords] = useState(1200);
  const [tone, setTone] = useState("");
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [genCover, setGenCover] = useState(true);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string[] | null>(null);
  const [status, setStatus] = useState<{ queued: number; failed: number; scheduled: number } | null>(null);

  // start date (shamsi) — default to *today* in the Jalali calendar
  const yNow = jalaliYearNow();
  const todayJ = dateToJalaliParts(new Date());
  const [jy, setJy] = useState(todayJ.jy);
  const [jm, setJm] = useState(todayJ.jm);
  const [jd, setJd] = useState(todayJ.jd);

  const loadStatus = () =>
    fetch("/api/ai/bulk").then((r) => (r.ok ? r.json() : null)).then((d) => d?.ok && setStatus({ queued: d.queued, failed: d.failed, scheduled: d.scheduled })).catch(() => {});
  useEffect(() => { loadStatus(); const t = setInterval(loadStatus, 15000); return () => clearInterval(t); }, []);

  const toggleHour = (h: number) => { setPreview(null); setHours((hs) => hs.includes(h) ? hs.filter((x) => x !== h) : [...hs, h].sort((a, b) => a - b)); };
  const toggleDay = (d: number) => { setPreview(null); setWeekdays((ds) => ds.includes(d) ? ds.filter((x) => x !== d) : [...ds, d]); };

  const buildPayload = (extra: Record<string, unknown>) => {
    const g = toGregorian(jy, jm, jd);
    const startDate = `${g.gy}-${String(g.gm).padStart(2, "0")}-${String(g.gd).padStart(2, "0")}`;
    const topics = topicsText.split("\n").map((s) => s.trim()).filter(Boolean);
    const base = { perDay: hours.length, hours, weekdays, words, tone, keyword, category, genCover, startDate, ...extra };
    return mode === "manual" ? { topics, ...base } : { theme: theme.trim(), count, ...base };
  };

  const doPreview = async () => {
    if (hours.length === 0) { toast(fa ? "حداقل یک ساعت انتخاب کن" : "Pick an hour"); return; }
    if (weekdays.length === 0) { toast(fa ? "حداقل یک روز هفته انتخاب کن" : "Pick a weekday"); return; }
    try {
      const r = await fetch("/api/ai/bulk", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(buildPayload({ preview: true })) });
      const d = await r.json().catch(() => ({}));
      if (d.ok && Array.isArray(d.schedule)) setPreview(d.schedule);
      else toast(fa ? "پیش‌نمایش ناموفق بود" : "Preview failed");
    } catch { toast(fa ? "خطای شبکه" : "Network error"); }
  };

  const submit = async () => {
    const topics = topicsText.split("\n").map((s) => s.trim()).filter(Boolean);
    if (mode === "manual" && topics.length === 0) { toast(fa ? "حداقل یک موضوع وارد کن" : "Enter topics"); return; }
    if (mode === "auto" && !theme.trim()) { toast(fa ? "موضوع کلی را وارد کن" : "Enter a theme"); return; }
    if (hours.length === 0) { toast(fa ? "حداقل یک ساعت انتشار انتخاب کن" : "Pick at least one hour"); return; }
    if (weekdays.length === 0) { toast(fa ? "حداقل یک روز هفته انتخاب کن" : "Pick at least one weekday"); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/ai/bulk", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(buildPayload({})) });
      const d = await r.json().catch(() => ({}));
      if (d.ok) {
        toast(fa ? `${faNum(d.count)} مقاله در صف تولید و زمان‌بندی شد ✓` : `${d.count} articles queued ✓`);
        setTopicsText(""); setPreview(null); loadStatus(); onChanged();
      } else if (d.error === "ai-unavailable") toast(fa ? "هوش مصنوعی تنظیم نشده — در تنظیمات کلید را ذخیره کن" : "AI not configured");
      else toast((fa ? "خطا: " : "Error: ") + (d.detail || d.error || ""));
    } catch { toast(fa ? "خطای شبکه" : "Network error"); } finally { setBusy(false); }
  };

  const WEEKDAYS: [number, string][] = [[6, "شنبه"], [0, "یکشنبه"], [1, "دوشنبه"], [2, "سه‌شنبه"], [3, "چهارشنبه"], [4, "پنجشنبه"], [5, "جمعه"]];
  const perDay = hours.length;
  const total = mode === "manual" ? topicsText.split("\n").filter((s) => s.trim()).length : count;
  const publishDays = perDay ? Math.ceil(total / perDay) : 0;        // how many publishing days needed
  const wdCount = weekdays.length || 7;                              // active weekdays per week
  const weeks = wdCount ? Math.ceil(publishDays / wdCount) : 0;      // calendar weeks it spans
  const sel = "rounded-[10px] px-2 py-2.5 text-[13.5px] outline-none";

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <div className="p-5" style={card}>
        <h2 className="mb-1 flex items-center gap-2 text-[15px] font-extrabold"><Sparkle size={16} /> {fa ? "تولید انبوه و زمان‌بندی هوشمند" : "Bulk generate & schedule"}</h2>
        <p className="mb-4 text-[12.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
          {fa ? "ده‌ها مقاله را یک‌جا بساز و بگو روزی چند تا و چه ساعت‌هایی منتشر شوند. مقاله‌ها در پس‌زمینه به‌مرور تولید می‌شوند و سر وقت خودشان منتشر می‌شوند." : "Generate many articles at once and let them auto-publish on a schedule."}
        </p>

        {/* mode */}
        <div className="mb-4 flex gap-2">
          <button onClick={() => setMode("auto")} className="cursor-pointer rounded-[10px] px-3 py-1.5 text-[12.5px] font-bold" style={mode === "auto" ? { background: "var(--accent)", color: "#fff", border: "none" } : inputStyle}>{fa ? "تولید خودکار موضوع‌ها" : "Auto topics"}</button>
          <button onClick={() => setMode("manual")} className="cursor-pointer rounded-[10px] px-3 py-1.5 text-[12.5px] font-bold" style={mode === "manual" ? { background: "var(--accent)", color: "#fff", border: "none" } : inputStyle}>{fa ? "موضوع‌های دستی" : "Manual topics"}</button>
        </div>

        {mode === "auto" ? (
          <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_140px]">
            <div>
              <label className="mb-1 block text-[12.5px] font-bold" style={{ color: "var(--muted)" }}>{fa ? "موضوع کلی" : "Theme"}</label>
              <input className={inputCls} style={inputStyle} value={theme} onChange={(e) => setTheme(e.target.value)} placeholder={fa ? "مثلاً: لوازم آرایشی و مراقبت پوست" : "e.g. skincare"} />
            </div>
            <div>
              <label className="mb-1 block text-[12.5px] font-bold" style={{ color: "var(--muted)" }}>{fa ? "تعداد مقاله" : "Count"}</label>
              <input className={inputCls} style={inputStyle} type="number" min={1} max={50} value={count} onChange={(e) => setCount(Math.min(50, Math.max(1, Number(e.target.value) || 1)))} dir="ltr" />
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <label className="mb-1 block text-[12.5px] font-bold" style={{ color: "var(--muted)" }}>{fa ? "موضوع‌ها (هر خط یک مقاله)" : "Topics (one per line)"}</label>
            <textarea className={inputCls} style={{ ...inputStyle, minHeight: 160, resize: "vertical" }} value={topicsText} onChange={(e) => setTopicsText(e.target.value)} placeholder={fa ? "راهنمای انتخاب کرم ضدآفتاب\nبهترین سرم ویتامین C\n..." : "topic per line"} />
          </div>
        )}

        {/* publish hours */}
        <label className="mb-1.5 block text-[12.5px] font-bold" style={{ color: "var(--muted)" }}>{fa ? "ساعت‌های انتشار در روز (روزی " + faNum(perDay) + " مقاله)" : "Publish hours per day"}</label>
        <div className="mb-4 flex flex-wrap gap-1.5" dir="ltr">
          {Array.from({ length: 24 }, (_, h) => h).map((h) => (
            <button key={h} onClick={() => toggleHour(h)} className="cursor-pointer rounded-[8px] px-2 py-1 text-[12px] font-bold" style={hours.includes(h) ? { background: "var(--accent)", color: "#fff", border: "none" } : inputStyle}>{String(h).padStart(2, "0")}</button>
          ))}
        </div>

        {/* options */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-[12.5px] font-bold" style={{ color: "var(--muted)" }}>{fa ? "طول هر مقاله" : "Length"}</label>
            <select className={inputCls} style={inputStyle} value={words} onChange={(e) => setWords(Number(e.target.value))}>
              {LENGTHS.map((l) => <option key={l.v} value={l.v}>{l.fa}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[12.5px] font-bold" style={{ color: "var(--muted)" }}>{fa ? "لحن" : "Tone"}</label>
            <select className={inputCls} style={inputStyle} value={tone} onChange={(e) => setTone(e.target.value)}>
              <option value="">{fa ? "پیش‌فرض" : "Default"}</option>
              <option value="رسمی">{fa ? "رسمی" : "Formal"}</option>
              <option value="صمیمی">{fa ? "صمیمی" : "Friendly"}</option>
              <option value="فنی و تخصصی">{fa ? "فنی" : "Technical"}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[12.5px] font-bold" style={{ color: "var(--muted)" }}>{fa ? "دسته" : "Category"}</label>
            <select className={inputCls} style={inputStyle} value={cats.includes(category) ? category : ""} onChange={(e) => { if (e.target.value === "__add") onAddCat(); else setCategory(e.target.value); }}>
              <option value="">{fa ? "— انتخاب دسته —" : "— Select —"}</option>
              {cats.map((c) => <option key={c} value={c}>{c}</option>)}
              <option value="__add">{fa ? "+ افزودن دستهٔ جدید…" : "+ Add new…"}</option>
            </select>
          </div>
        </div>

        {/* AI cover per article */}
        <label className="mt-4 flex cursor-pointer items-center gap-2 text-[13px] font-bold">
          <input type="checkbox" checked={genCover} onChange={(e) => setGenCover(e.target.checked)} style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--accent)" }} />
          {fa ? "ساخت تصویر شاخص با هوش مصنوعی برای هر مقاله" : "Generate an AI cover image for each article"}
        </label>
        <p className="mt-1 text-[11.5px]" style={{ color: "var(--muted)" }}>
          {fa ? "هنگام تولید هر مقاله، یک تصویر شاخص مرتبط هم با هوش مصنوعی ساخته و روی مقاله گذاشته می‌شود." : "A relevant cover image is generated per article during processing."}
        </p>

        {/* start date */}
        <label className="mb-1.5 mt-4 block text-[12.5px] font-bold" style={{ color: "var(--muted)" }}>{fa ? "تاریخ شروع انتشار (شمسی)" : "Start date"}</label>
        <div className="flex flex-wrap gap-2" dir="rtl">
          <select className={sel} style={inputStyle} value={jd} onChange={(e) => setJd(+e.target.value)}>
            {Array.from({ length: jalaliMonthLength(jy, jm) }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{faNum(d)}</option>)}
          </select>
          <select className={`${sel} flex-1`} style={inputStyle} value={jm} onChange={(e) => setJm(+e.target.value)}>
            {JALALI_MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select className={sel} style={inputStyle} value={jy} onChange={(e) => { setPreview(null); setJy(+e.target.value); }}>
            {Array.from({ length: 3 }, (_, i) => yNow + i).map((y) => <option key={y} value={y}>{faNum(y)}</option>)}
          </select>
        </div>

        {/* weekdays */}
        <label className="mb-1.5 mt-4 block text-[12.5px] font-bold" style={{ color: "var(--muted)" }}>{fa ? "روزهای انتشار در هفته" : "Publish weekdays"}</label>
        <div className="flex flex-wrap gap-1.5">
          {WEEKDAYS.map(([d, label]) => (
            <button key={d} onClick={() => toggleDay(d)} className="cursor-pointer rounded-[8px] px-2.5 py-1.5 text-[12px] font-bold" style={weekdays.includes(d) ? { background: "var(--accent)", color: "#fff", border: "none" } : inputStyle}>{label}</button>
          ))}
        </div>

        <p className="mt-3 text-[12px] leading-relaxed" style={{ color: "var(--muted)" }}>
          {fa
            ? `جمعاً ${faNum(total)} مقاله • روزی ${faNum(perDay)} تا (${faNum(hours.length)} ساعت انتخابی) • ${faNum(weekdays.length)} روز در هفته → حدود ${faNum(publishDays)} روزِ انتشار، تقریباً ${faNum(weeks)} هفته.`
            : `${total} articles • ${perDay}/day (${hours.length} hours) • ${weekdays.length} weekdays → ~${publishDays} publishing days, about ${weeks} weeks.`}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={submit} disabled={busy} className="inline-flex cursor-pointer items-center gap-2 rounded-[12px] border-none px-6 py-3 text-[14px] font-extrabold text-white disabled:opacity-60" style={{ background: "var(--accent)" }}>
            <Sparkle size={16} /> {busy ? (fa ? "در حال ثبت…" : "Submitting…") : fa ? "شروع تولید و زمان‌بندی" : "Generate & schedule"}
          </button>
          <button onClick={doPreview} disabled={busy} className="cursor-pointer rounded-[12px] px-5 py-3 text-[14px] font-bold disabled:opacity-60" style={inputStyle}>{fa ? "پیش‌نمایش زمان‌بندی" : "Preview schedule"}</button>
        </div>

        {/* schedule preview */}
        {preview && (
          <div className="mt-4 rounded-[12px] p-3" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
            <div className="mb-2 text-[12.5px] font-extrabold">{fa ? `زمان‌بندی ${faNum(preview.length)} مقالهٔ اول:` : `Schedule (first ${preview.length}):`}</div>
            <div className="grid max-h-56 gap-1 overflow-auto sm:grid-cols-2" style={{ scrollbarWidth: "thin" }}>
              {preview.map((iso, i) => (
                <div key={i} className="flex items-center gap-2 rounded-[8px] px-2.5 py-1.5 text-[12px]" style={{ background: "var(--surface)" }}>
                  <span className="flex-none font-bold" style={{ color: "var(--accent)" }}>{faNum(i + 1)}.</span>
                  <span>{formatDate(iso, locale as "fa" | "en", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* status */}
      <div className="flex flex-col gap-4">
        <div className="p-5" style={card}>
          <h3 className="mb-3 text-[14px] font-extrabold">{fa ? "وضعیت صف تولید" : "Queue status"}</h3>
          {status ? (
            <div className="flex flex-col gap-2.5 text-[13px]">
              <Row label={fa ? "در حال تولید (در صف)" : "Queued"} value={faNum(status.queued)} color="#7c3aed" />
              <Row label={fa ? "زمان‌بندی‌شده" : "Scheduled"} value={faNum(status.scheduled)} color="#0ea5e9" />
              {status.failed > 0 && <Row label={fa ? "خطای تولید" : "Failed"} value={faNum(status.failed)} color="#e11d48" />}
            </div>
          ) : <div className="text-[13px]" style={{ color: "var(--muted)" }}>…</div>}
          <p className="mt-3 text-[11.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
            {fa ? "مقاله‌ها در پس‌زمینه و به‌مرور تولید می‌شوند (هر ۲۰ ثانیه یکی) تا به محدودیت سرویس برنخوریم. می‌توانی این صفحه را ببندی؛ ادامه می‌یابد." : "Generated gradually in the background."}
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between rounded-[10px] px-3 py-2" style={{ background: "var(--surface2)" }}>
      <span style={{ color: "var(--muted)" }}>{label}</span>
      <span className="font-extrabold" style={{ color }}>{value}</span>
    </div>
  );
}
