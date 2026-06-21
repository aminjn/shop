"use client";

import { useEffect, useState } from "react";
import { useShop } from "@/lib/store";
import { postBySlug, POSTS, type Post } from "@/data/posts";
import { grad, formatDate } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown";
import { LocaleLink } from "./LocaleLink";
import { Sparkle, Send, ArrowBack, ArrowForward } from "./Icons";

export function BlogArticle({ slug }: { slug: string }) {
  const { locale, t, dark, toast } = useShop();
  const [question, setQuestion] = useState("");

  // Prefer dynamic published posts; fall back to the seed list.
  const [posts, setPosts] = useState<Post[]>(POSTS);
  useEffect(() => {
    fetch("/api/posts")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (Array.isArray(d?.posts) && d.posts.length) setPosts(d.posts as Post[]);
      })
      .catch(() => {});
  }, []);

  const p = posts.find((x) => x.slug === slug) ?? postBySlug(slug);

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

  const keyPoints =
    locale === "fa"
      ? [
          "نکات کلیدی پیش از خرید و تصمیم‌گیری آگاهانه",
          "مقایسه‌ی گزینه‌ها بر اساس نیاز و بودجه",
          "جمع‌بندی عملی برای انتخاب بهتر",
        ]
      : [
          "Key points before buying and deciding wisely",
          "Comparing options based on needs and budget",
          "A practical takeaway for a better choice",
        ];

  const askArticle = () => {
    toast(
      locale === "fa"
        ? "هوش مصنوعی در حال مطالعه‌ی مقاله است..."
        : "AI is reading the article...",
    );
    setQuestion("");
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
          <ul className="flex flex-col gap-2">
            {keyPoints.map((k, i) => (
              <li key={i} className="flex items-start gap-2 text-[13.5px]" style={{ color: "var(--text)" }}>
                <span className="mt-1.5 inline-block h-1.5 w-1.5 flex-none rounded-full" style={{ background: "var(--accent)" }} />
                <span>{k}</span>
              </li>
            ))}
          </ul>
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
              onClick={askArticle}
              aria-label={t.send}
              className="flex cursor-pointer items-center gap-1.5 rounded-[10px] border-none px-4 text-[13.5px] font-bold text-white"
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
