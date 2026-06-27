"use client";

import { useEffect, useState } from "react";
import { useShop } from "@/lib/store";
import { postBySlug, POSTS, type Post } from "@/data/posts";
import { grad, formatDate, priceFmt } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown";
import { LocaleLink } from "./LocaleLink";
import { Sparkle, Send, ArrowBack, ArrowForward } from "./Icons";

export function BlogArticle({ slug }: { slug: string }) {
  const { locale, t, dark, productById } = useShop();
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [asking, setAsking] = useState(false);

  // Prefer dynamic published posts; fall back to the seed list.
  const [posts, setPosts] = useState<Post[]>(POSTS);
  useEffect(() => {
    fetch("/api/posts", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (Array.isArray(d?.posts) && d.posts.length) setPosts(d.posts as Post[]);
      })
      .catch(() => {});
  }, []);

  // match by slug; fall back to the trailing id (slugs are "<topic>-<id>") and to
  // a decoded comparison, so URL-encoding of Persian slugs can't break the lookup.
  const dec = (() => { try { return decodeURIComponent(slug); } catch { return slug; } })();
  const tailId = (() => { const m = dec.match(/-(\d+)$/); return m ? Number(m[1]) : null; })();
  const p =
    posts.find((x) => x.slug === slug || x.slug === dec) ??
    (tailId != null ? posts.find((x) => x.id === tailId) : undefined) ??
    postBySlug(slug);

  if (!p) {
    return (
      <div className="mx-auto max-w-[1280px] px-[22px] py-20 text-center">
        <div className="text-[18px] font-bold">{t.noResults}</div>
        <LocaleLink href="/blog" className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-bold no-underline" style={{ color: "var(--accent)" }}>
          <ArrowBack size={16} /> {t.blogTitle}
        </LocaleLink>
      </div>
    );
  }

  const title = locale === "fa" ? p.fa : p.en;
  const cat = locale === "fa" ? p.catFa : p.catEn;
  const bodyHtml = renderMarkdown(locale === "fa" ? p.bodyFa : p.bodyEn);

  const fmtDate = (d: string) => formatDate(d, locale, { year: "numeric", month: "short", day: "numeric" });

  const summary =
    locale === "fa" ? p.excerptFa : p.excerptEn;

  // clickable starter questions the reader can ask the AI about THIS article
  const suggestions =
    locale === "fa"
      ? [
          "خلاصهٔ این مقاله را بگو",
          "مهم‌ترین نکات این مقاله چیست؟",
          "این مطلب برای چه کسانی مفید است؟",
          "یک جمع‌بندی عملی بده",
        ]
      : [
          "Summarize this article",
          "What are the key points?",
          "Who is this useful for?",
          "Give me a practical takeaway",
        ];

  const askArticle = async (text?: string) => {
    const content = (text ?? question).trim();
    if (!content || asking) return;
    const next = [...chat, { role: "user" as const, content }];
    setChat(next);
    setQuestion("");
    setAsking(true);
    try {
      const r = await fetch("/api/blog/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: p.slug, id: p.id, messages: next }),
      });
      const d = await r.json().catch(() => ({}));
      setChat((c) => [...c, { role: "assistant", content: d.reply || (locale === "fa" ? "متاسفم، پاسخی پیدا نشد." : "Sorry, no answer.") }]);
    } catch {
      setChat((c) => [...c, { role: "assistant", content: locale === "fa" ? "خطای شبکه — دوباره تلاش کن." : "Network error." }]);
    } finally {
      setAsking(false);
    }
  };

  const related = posts.filter((x) => x.id !== p.id).slice(0, 3);

  return (
    <div className="mx-auto max-w-[820px] px-[22px] py-7">
      {/* breadcrumb */}
      <div className="mb-5 flex items-center gap-2 text-[13px]" style={{ color: "var(--muted)" }}>
        <LocaleLink href="/" className="no-underline" style={{ color: "var(--muted)" }}>{t.navHome}</LocaleLink>
        <span>/</span>
        <LocaleLink href="/blog" className="no-underline" style={{ color: "var(--muted)" }}>{t.blogTitle}</LocaleLink>
        <span>/</span>
        <span className="truncate" style={{ color: "var(--text)" }}>{title}</span>
      </div>

      {/* cover */}
      <div
        className="flex h-[260px] items-center justify-center overflow-hidden rounded-[16px] text-[90px] font-extrabold"
        style={{ background: grad(p.hue, dark), color: "rgba(255,255,255,.5)" }}
      >
        {p.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.cover} alt={title} className="h-full w-full object-cover" />
        ) : (
          title.charAt(0)
        )}
      </div>

      {/* title + meta */}
      <h1 className="mt-6 text-[28px] font-extrabold leading-tight tracking-tight">{title}</h1>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[13px]" style={{ color: "var(--muted)" }}>
        <span className="font-bold" style={{ color: "var(--text)" }}>{p.author}</span>
        <span>•</span>
        <span>{fmtDate(p.date)}</span>
        <span>•</span>
        <span className="rounded-full px-2.5 py-0.5 text-[12px] font-bold" style={{ background: "var(--surface2)", color: "var(--accent)", border: "1px solid var(--border)" }}>{cat}</span>
      </div>

      {/* AI summary box */}
      <div className="mt-6 overflow-hidden rounded-[16px]" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 px-5 py-3.5 text-[14px] font-bold text-white" style={{ background: "var(--accent)" }}>
          <Sparkle size={18} /> {t.blogAiSummary}
        </div>
        <div className="flex flex-col gap-4 p-5">
          <p className="text-[14px] leading-relaxed" style={{ color: "var(--text)" }}>{summary}</p>

          {/* clickable starter questions */}
          <div className="flex flex-wrap gap-2">
            {suggestions.map((q) => (
              <button
                key={q}
                onClick={() => askArticle(q)}
                disabled={asking}
                className="cursor-pointer rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition disabled:opacity-50"
                style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}
              >
                {q}
              </button>
            ))}
          </div>

          {/* conversation */}
          {chat.length > 0 && (
            <div className="flex flex-col gap-2.5">
              {chat.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className="max-w-[85%] whitespace-pre-wrap rounded-[14px] px-3.5 py-2.5 text-[13.5px] leading-relaxed"
                    style={m.role === "user" ? { background: "var(--accent)", color: "#fff" } : { background: "var(--surface2)", color: "var(--text)" }}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {asking && <div className="text-[13px]" style={{ color: "var(--muted)" }}>{locale === "fa" ? "در حال مطالعهٔ مقاله…" : "Reading the article…"}</div>}
            </div>
          )}

          {/* ask this article */}
          <div className="flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") askArticle(); }}
              placeholder={locale === "fa" ? "از این مقاله بپرس..." : "Ask this article..."}
              className="flex-1 rounded-[10px] px-3 py-2.5 text-[13.5px] outline-none"
              style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
            <button
              onClick={() => askArticle()}
              disabled={asking}
              aria-label={t.send}
              className="flex cursor-pointer items-center gap-1.5 rounded-[10px] border-none px-4 text-[13.5px] font-bold text-white disabled:opacity-50"
              style={{ background: "var(--accent)" }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* body */}
      <div
        className="prose-mini mt-7 text-[15.5px] leading-[1.9]"
        style={{ color: "var(--text)", textAlign: "start" }}
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />

      {/* related products */}
      {(() => {
        const rel = (p.relatedProducts || []).map((id) => productById(id)).filter(Boolean);
        if (!rel.length) return null;
        return (
          <div className="mt-9">
            <h3 className="mb-4 flex items-center gap-2 text-[18px] font-extrabold">
              {locale === "fa" ? "محصولات مرتبط" : "Related products"}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {rel.map((pr) => {
                const prod = pr!;
                const pName = locale === "fa" ? prod.fa : prod.en;
                return (
                  <LocaleLink
                    key={prod.id}
                    href={`/product/${prod.id}`}
                    className="flex flex-col overflow-hidden rounded-[16px] no-underline"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
                  >
                    <div className="flex h-[120px] items-center justify-center text-[44px] font-extrabold" style={{ background: grad(prod.hue, dark), color: "rgba(255,255,255,.5)" }}>
                      {pName.charAt(0)}
                    </div>
                    <div className="flex flex-1 flex-col gap-1.5 p-4">
                      {prod.brand && <span className="text-[11.5px] font-bold" style={{ color: "var(--muted)" }}>{prod.brand}</span>}
                      <span className="text-[14px] font-extrabold leading-snug">{pName}</span>
                      <span className="mt-auto text-[14px] font-extrabold" style={{ color: "var(--accent)" }}>{priceFmt(prod.price, locale, t.currency)}</span>
                    </div>
                  </LocaleLink>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* back to blog */}
      <div className="mt-8">
        <LocaleLink href="/blog" className="inline-flex items-center gap-2 text-[14px] font-bold no-underline" style={{ color: "var(--accent)" }}>
          <ArrowBack size={16} /> {t.blogTitle}
        </LocaleLink>
      </div>

      {/* related */}
      <div className="mt-9">
        <h3 className="mb-4 text-[18px] font-extrabold">{locale === "fa" ? "مقالات مرتبط" : "Related articles"}</h3>
        <div className="grid gap-5 md:grid-cols-3">
          {related.map((r) => {
            const rTitle = locale === "fa" ? r.fa : r.en;
            return (
              <article
                key={r.id}
                className="flex flex-col overflow-hidden rounded-[16px]"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <LocaleLink
                  href={`/blog/${r.slug}`}
                  className="flex h-[120px] items-center justify-center text-[44px] font-extrabold no-underline"
                  style={{ background: grad(r.hue, dark), color: "rgba(255,255,255,.5)" }}
                >
                  {rTitle.charAt(0)}
                </LocaleLink>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <span className="w-fit rounded-full px-2.5 py-1 text-[11.5px] font-bold" style={{ background: "var(--surface2)", color: "var(--accent)", border: "1px solid var(--border)" }}>
                    {locale === "fa" ? r.catFa : r.catEn}
                  </span>
                  <LocaleLink href={`/blog/${r.slug}`} className="text-[14.5px] font-extrabold leading-snug no-underline" style={{ color: "var(--text)" }}>
                    {rTitle}
                  </LocaleLink>
                  <LocaleLink href={`/blog/${r.slug}`} className="mt-auto inline-flex items-center gap-1.5 text-[12.5px] font-bold no-underline" style={{ color: "var(--accent)" }}>
                    {t.readMore} <ArrowForward size={13} />
                  </LocaleLink>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
