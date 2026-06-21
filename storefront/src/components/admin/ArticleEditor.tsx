"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useShop } from "@/lib/store";
import { formatDate } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown";
import { UploadButton } from "@/components/UploadButton";
import { JalaliDateTimePicker } from "@/components/JalaliDateTimePicker";
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
}

const blank = { id: 0 as number, title: "", slug: "", catFa: "", tags: "", cover: "", excerpt: "", body: "" };

export function ArticleEditor() {
  const { locale, toast } = useShop();
  const fa = locale === "fa";
  const card = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16 } as const;
  const inputStyle = { background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" } as const;
  const inputCls = "w-full rounded-[10px] px-3 py-2.5 text-[14px] outline-none";

  const [posts, setPosts] = useState<PostRow[]>([]);
  const [form, setForm] = useState({ ...blank });
  const [editing, setEditing] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [minChars, setMinChars] = useState(2500);
  const [tone, setTone] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [expandBusy, setExpandBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishAt, setPublishAt] = useState("");
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const load = () =>
    fetch("/api/posts?all=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => Array.isArray(d?.posts) && setPosts(d.posts))
      .catch(() => {});
  useEffect(() => { load(); }, []);

  const set = (k: keyof typeof blank, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const slugify = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\p{L}\p{N}-]/gu, "").slice(0, 80);

  const newPost = () => { setForm({ ...blank }); setEditing(false); setPublishAt(""); setAiTopic(""); };
  const editPost = (p: PostRow) => {
    setForm({ id: p.id, title: p.fa, slug: p.slug, catFa: p.catFa, tags: (p.tags || []).join("، "), cover: p.cover || "", excerpt: p.excerptFa, body: p.bodyFa });
    setEditing(true);
    setPublishAt(p.publishAt || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const genAI = async () => {
    if (!aiTopic.trim()) { toast(fa ? "موضوع مقاله را وارد کن" : "Enter a topic"); return; }
    setAiBusy(true);
    try {
      const r = await fetch("/api/ai/article", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic: aiTopic.trim(), minChars, tone }),
      });
      const d = await r.json();
      if (d.ok && d.article) {
        const a = d.article;
        setForm((f) => ({ ...f, title: a.title || f.title, slug: f.slug || slugify(a.title || ""), excerpt: a.excerpt || "", body: a.body || "", catFa: a.category || f.catFa, tags: Array.isArray(a.tags) ? a.tags.join("، ") : f.tags }));
        toast(fa ? "مقاله تولید شد ✓" : "Article generated ✓");
      } else if (d.error === "ai-unavailable") toast(fa ? "هوش مصنوعی تنظیم نشده — در «تنظیمات ← هوش مصنوعی» کلید گپ‌جی‌پی‌تی و مدل را ذخیره کن" : "AI not configured — save your GapGPT key & model in Settings → AI");
      else toast(fa ? "تولید ناموفق بود" : "Generation failed");
    } catch { toast(fa ? "خطای شبکه" : "Network error"); } finally { setAiBusy(false); }
  };

  const expandBody = async () => {
    if (!form.body.trim()) { toast(fa ? "ابتدا متنی وارد کن" : "Enter some text first"); return; }
    setExpandBusy(true);
    try {
      const r = await fetch("/api/ai/article", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "expand", body: form.body, minChars }),
      });
      const d = await r.json();
      if (d.ok && d.body) { set("body", d.body); toast(fa ? "متن گسترش یافت ✓" : "Expanded ✓"); }
      else if (d.error === "ai-unavailable") toast(fa ? "هوش مصنوعی تنظیم نشده — در «تنظیمات ← هوش مصنوعی» کلید گپ‌جی‌پی‌تی و مدل را ذخیره کن" : "AI not configured — save your GapGPT key & model in Settings → AI");
      else toast(fa ? "گسترش ناموفق بود" : "Expand failed");
    } catch { toast(fa ? "خطای شبکه" : "Network error"); } finally { setExpandBusy(false); }
  };

  const wrap = (before: string, after = before, block = false) => {
    const el = bodyRef.current; if (!el) return;
    const s = el.selectionStart, e = el.selectionEnd;
    const sel = form.body.slice(s, e) || (fa ? "متن" : "text");
    const ins = block ? `${before}${sel}` : `${before}${sel}${after}`;
    const next = form.body.slice(0, s) + ins + form.body.slice(e);
    set("body", next);
    requestAnimationFrame(() => { el.focus(); el.selectionStart = s + before.length; el.selectionEnd = s + before.length + sel.length; });
  };

  const insertImage = (url: string) => {
    const el = bodyRef.current;
    const md = `\n\n![](${url})\n\n`;
    if (!el) { set("body", form.body + md); toast(fa ? "تصویر درج شد ✓" : "Image inserted ✓"); return; }
    const s = el.selectionStart;
    set("body", form.body.slice(0, s) + md + form.body.slice(s));
    toast(fa ? "تصویر درج شد ✓" : "Image inserted ✓");
  };

  const insertLink = () => {
    const url = window.prompt(fa ? "آدرس لینک:" : "Link URL:");
    if (!url) return;
    wrap("[", `](${url})`);
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
      };
      const body = editing
        ? { action: "update", id: form.id, status, publishAt: status === "scheduled" ? new Date(publishAt).toISOString() : undefined, post }
        : { action: "create", status, publishAt: status === "scheduled" ? new Date(publishAt).toISOString() : undefined, post };
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

  const charCount = form.body.length;
  const wordCount = useMemo(() => form.body.trim().split(/\s+/).filter(Boolean).length, [form.body]);
  const tb = "cursor-pointer rounded-[8px] px-2.5 py-1.5 text-[12.5px] font-bold";

  const statusBadge = (st: string) => {
    const map: Record<string, [string, string, string]> = {
      published: ["#1f8a5b", "rgba(31,138,91,.15)", fa ? "منتشرشده" : "Published"],
      scheduled: ["#0ea5e9", "rgba(14,165,233,.12)", fa ? "زمان‌بندی‌شده" : "Scheduled"],
      draft: ["#d97706", "rgba(217,119,6,.12)", fa ? "پیش‌نویس" : "Draft"],
    };
    const [c, bg, l] = map[st] || map.draft;
    return <span className="rounded-full px-2.5 py-1 text-[11.5px] font-extrabold" style={{ color: c, background: bg }}>{l}</span>;
  };

  return (
    <>
      {/* AI generation bar */}
      <div className="mb-5 p-5" style={card}>
        <h2 className="mb-3 flex items-center gap-2 text-[15px] font-extrabold"><Sparkle size={16} /> {fa ? "تولید مقاله با هوش مصنوعی" : "AI article generation"}</h2>
        <div className="flex flex-wrap items-end gap-2.5">
          <div className="min-w-[240px] flex-1">
            <label className="mb-1 block text-[12.5px] font-bold" style={{ color: "var(--muted)" }}>{fa ? "موضوع مقاله" : "Topic"}</label>
            <input className={inputCls} style={inputStyle} value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} placeholder={fa ? "مثلاً: راهنمای انتخاب هدفون بی‌سیم" : "e.g. wireless headphones buying guide"} />
          </div>
          <div className="w-[140px]">
            <label className="mb-1 block text-[12.5px] font-bold" style={{ color: "var(--muted)" }}>{fa ? "حداقل کاراکتر" : "Min characters"}</label>
            <input className={inputCls} style={inputStyle} type="number" min={0} step={250} value={minChars} onChange={(e) => setMinChars(Math.max(0, Number(e.target.value) || 0))} dir="ltr" />
          </div>
          <div className="w-[150px]">
            <label className="mb-1 block text-[12.5px] font-bold" style={{ color: "var(--muted)" }}>{fa ? "لحن" : "Tone"}</label>
            <select className={inputCls} style={inputStyle} value={tone} onChange={(e) => setTone(e.target.value)}>
              <option value="">{fa ? "پیش‌فرض" : "Default"}</option>
              <option value={fa ? "رسمی" : "formal"}>{fa ? "رسمی" : "Formal"}</option>
              <option value={fa ? "صمیمی" : "friendly"}>{fa ? "صمیمی" : "Friendly"}</option>
              <option value={fa ? "فنی و تخصصی" : "technical"}>{fa ? "فنی" : "Technical"}</option>
            </select>
          </div>
          <button onClick={genAI} disabled={aiBusy} className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border-none px-5 py-2.5 text-[13.5px] font-extrabold text-white disabled:opacity-60" style={{ background: "var(--accent)" }}>
            <Sparkle size={15} /> {aiBusy ? (fa ? "در حال تولید…" : "Generating…") : fa ? "تولید مقاله" : "Generate"}
          </button>
        </div>
        <p className="mt-2 text-[11.5px]" style={{ color: "var(--muted)" }}>
          {fa ? "اگر متن کوتاه تولید شود، با دکمهٔ «گسترش متن» در ویرایشگر طولانی‌ترش کن." : "If output is short, use “Expand” in the editor to lengthen it."}
        </p>
      </div>

      {/* editor */}
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="p-5" style={card}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-extrabold">{editing ? (fa ? "ویرایش مقاله" : "Edit article") : fa ? "نوشتن مقاله" : "Write article"}</h2>
            {editing && <button onClick={newPost} className="cursor-pointer border-none bg-transparent text-[12.5px] font-bold" style={{ color: "var(--accent)" }}>+ {fa ? "مقالهٔ جدید" : "New"}</button>}
          </div>

          <label className="mb-1 block text-[12.5px] font-bold" style={{ color: "var(--muted)" }}>{fa ? "عنوان" : "Title"}</label>
          <input className={`${inputCls} mb-3 text-[16px] font-bold`} style={inputStyle} value={form.title} onChange={(e) => { set("title", e.target.value); if (!editing && (!form.slug || form.slug === slugify(form.title))) set("slug", slugify(e.target.value)); }} />

          <div className="mb-3 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[12.5px] font-bold" style={{ color: "var(--muted)" }}>{fa ? "نامک (slug)" : "Slug"}</label>
              <input className={inputCls} style={inputStyle} value={form.slug} onChange={(e) => set("slug", e.target.value)} dir="ltr" />
            </div>
            <div>
              <label className="mb-1 block text-[12.5px] font-bold" style={{ color: "var(--muted)" }}>{fa ? "دسته" : "Category"}</label>
              <input className={inputCls} style={inputStyle} value={form.catFa} onChange={(e) => set("catFa", e.target.value)} />
            </div>
          </div>

          <label className="mb-1 block text-[12.5px] font-bold" style={{ color: "var(--muted)" }}>{fa ? "خلاصه" : "Excerpt"}</label>
          <textarea className={`${inputCls} mb-3`} style={{ ...inputStyle, minHeight: 56, resize: "vertical" }} value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} />

          {/* body toolbar (WordPress-like) */}
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <button onClick={() => wrap("# ", "", true)} className={tb} style={inputStyle} title={fa ? "تیتر بزرگ" : "Heading 1"}>تیتر</button>
            <button onClick={() => wrap("## ", "", true)} className={tb} style={inputStyle}>H2</button>
            <button onClick={() => wrap("### ", "", true)} className={tb} style={inputStyle}>H3</button>
            <button onClick={() => wrap("**")} className={tb} style={{ ...inputStyle, fontWeight: 800 }}>B</button>
            <button onClick={() => wrap("*")} className={tb} style={{ ...inputStyle, fontStyle: "italic" }}>I</button>
            <button onClick={() => wrap("> ", "", true)} className={tb} style={inputStyle} title={fa ? "نقل‌قول" : "Quote"}>❝</button>
            <button onClick={() => wrap("- ", "", true)} className={tb} style={inputStyle}>• {fa ? "لیست" : "List"}</button>
            <button onClick={() => wrap("1. ", "", true)} className={tb} style={inputStyle}>1. {fa ? "شماره‌دار" : "Numbered"}</button>
            <button onClick={insertLink} className={tb} style={inputStyle} title={fa ? "لینک" : "Link"}>🔗 {fa ? "لینک" : "Link"}</button>
            <UploadButton accept="image/*" label={fa ? "🖼 درج تصویر" : "🖼 Image"} onUploaded={(url) => insertImage(url)} />
            <span className="flex-1" />
            <button onClick={expandBody} disabled={expandBusy} className="inline-flex cursor-pointer items-center gap-1.5 rounded-[8px] border-none px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-60" style={{ background: "var(--accent)" }}>
              <Sparkle size={13} /> {expandBusy ? "…" : fa ? "گسترش متن" : "Expand"}
            </button>
          </div>

          {/* side-by-side: editor + live preview */}
          <div className="grid gap-3 lg:grid-cols-2">
            <textarea ref={bodyRef} className={inputCls} style={{ ...inputStyle, minHeight: 360, resize: "vertical", lineHeight: 1.9 }} value={form.body} onChange={(e) => set("body", e.target.value)} placeholder={fa ? "متن مقاله…" : "Article body…"} />
            <div className="prose-mini rounded-[10px] p-4" style={{ ...inputStyle, minHeight: 360, maxHeight: 560, overflow: "auto" }} dangerouslySetInnerHTML={{ __html: renderMarkdown(form.body || (fa ? "*پیش‌نمایش زنده اینجا نمایش داده می‌شود*" : "*live preview*")) }} />
          </div>

          <div className="mt-2 flex items-center justify-between text-[12px]" style={{ color: charCount < minChars ? "#d97706" : "#1f8a5b" }}>
            <span>{fa ? `${charCount.toLocaleString("fa-IR")} کاراکتر • ${wordCount.toLocaleString("fa-IR")} کلمه` : `${charCount} chars • ${wordCount} words`}</span>
            {minChars > 0 && <span>{charCount >= minChars ? (fa ? "✓ به حداقل رسید" : "✓ meets minimum") : (fa ? `حداقل ${minChars.toLocaleString("fa-IR")}` : `min ${minChars}`)}</span>}
          </div>
        </div>

        {/* side: publish + cover */}
        <div className="flex flex-col gap-5">
          <div className="p-5" style={card}>
            <h3 className="mb-3 text-[14px] font-extrabold">{fa ? "انتشار" : "Publish"}</h3>
            <div className="flex flex-col gap-2.5">
              <button onClick={() => save("published")} disabled={saving} className="cursor-pointer rounded-[10px] border-none py-2.5 text-[14px] font-extrabold text-white disabled:opacity-60" style={{ background: "var(--accent)" }}>{editing ? (fa ? "ذخیره و انتشار" : "Save & publish") : fa ? "انتشار فوری" : "Publish"}</button>
              <button onClick={() => save("draft")} disabled={saving} className="cursor-pointer rounded-[10px] py-2.5 text-[13.5px] font-bold disabled:opacity-60" style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}>{fa ? "ذخیره پیش‌نویس" : "Save draft"}</button>
              <div className="mt-1 border-t pt-2.5" style={{ borderColor: "var(--border)" }}>
                <label className="mb-1.5 block text-[12px] font-bold" style={{ color: "var(--muted)" }}>{fa ? "زمان‌بندی انتشار (شمسی)" : "Schedule (Shamsi)"}</label>
                <div className="mb-2"><JalaliDateTimePicker value={publishAt} onChange={setPublishAt} /></div>
                <button onClick={() => save("scheduled")} disabled={saving} className="w-full cursor-pointer rounded-[10px] py-2.5 text-[13.5px] font-bold disabled:opacity-60" style={{ background: "var(--surface2)", border: "1px solid var(--accent)", color: "var(--accent)" }}>{fa ? "زمان‌بندی انتشار" : "Schedule"}</button>
              </div>
            </div>
          </div>

          <div className="p-5" style={card}>
            <h3 className="mb-3 text-[14px] font-extrabold">{fa ? "تصویر شاخص" : "Cover image"}</h3>
            {form.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.cover} alt="" className="mb-2 h-32 w-full rounded-[10px] object-cover" style={{ border: "1px solid var(--border)" }} />
            ) : null}
            <div className="flex items-center gap-2">
              <UploadButton accept="image/*" label={fa ? "آپلود تصویر" : "Upload"} onUploaded={(url) => set("cover", url)} />
              {form.cover && <button onClick={() => set("cover", "")} className="cursor-pointer border-none bg-transparent text-[12.5px] font-bold" style={{ color: "#e11d48" }}>{fa ? "حذف" : "Remove"}</button>}
            </div>
          </div>

          <div className="p-5" style={card}>
            <label className="mb-1 block text-[12.5px] font-bold" style={{ color: "var(--muted)" }}>{fa ? "برچسب‌ها (با ویرگول)" : "Tags (comma)"}</label>
            <input className={inputCls} style={inputStyle} value={form.tags} onChange={(e) => set("tags", e.target.value)} />
          </div>
        </div>
      </div>

      {/* posts list */}
      <div className="mt-6 p-5" style={card}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-extrabold">{fa ? "همهٔ مقالات" : "All articles"}</h2>
          <button onClick={newPost} className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border-none px-3 py-2 text-[12.5px] font-bold text-white" style={{ background: "var(--accent)" }}><Plus size={14} /> {fa ? "مقالهٔ جدید" : "New"}</button>
        </div>
        {posts.length === 0 ? (
          <div className="py-6 text-center text-[13.5px]" style={{ color: "var(--muted)" }}>{fa ? "مقاله‌ای نیست" : "No articles"}</div>
        ) : (
          <div className="flex flex-col gap-2">
            {posts.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-2 rounded-[10px] px-3 py-2.5" style={{ background: "var(--surface2)" }}>
                <span className="min-w-0 flex-1 truncate text-[13.5px] font-bold">{p.fa}</span>
                {statusBadge(p.status)}
                <span className="text-[12px]" style={{ color: "var(--muted)" }}>{p.status === "scheduled" && p.publishAt ? formatDate(p.publishAt, locale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : formatDate(p.date, locale, { month: "short", day: "numeric" })}</span>
                <button onClick={() => editPost(p)} className="cursor-pointer border-none bg-transparent text-[12.5px] font-bold" style={{ color: "var(--accent)" }}>{fa ? "ویرایش" : "Edit"}</button>
                <button onClick={() => del(p.id)} aria-label="delete" className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[8px] border-none" style={{ background: "var(--surface)", color: "#e11d48" }}><Trash size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
