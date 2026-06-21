"use client";

import { useEffect, useMemo, useState } from "react";
import { useShop } from "@/lib/store";
import { POSTS, type Post } from "@/data/posts";
import { grad, num, formatDate } from "@/lib/format";
import { LocaleLink } from "@/components/LocaleLink";
import { ArrowForward } from "@/components/Icons";

export default function BlogPage() {
  const { locale, t, dark } = useShop();
  const [cat, setCat] = useState<string>("all");

  // Prefer dynamic published posts from the API; fall back to the seed list.
  const [posts, setPosts] = useState<Post[]>(POSTS);
  useEffect(() => {
    fetch("/api/posts")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (Array.isArray(d?.posts) && d.posts.length) setPosts(d.posts as Post[]);
      })
      .catch(() => {});
  }, []);

  const fmtDate = (d: string) => formatDate(d, locale, { year: "numeric", month: "short", day: "numeric" });

  const cats = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of posts) map.set(p.catEn, locale === "fa" ? p.catFa : p.catEn);
    return Array.from(map.entries()); // [catEn, label]
  }, [locale, posts]);

  const filtered = useMemo(
    () => (cat === "all" ? posts : posts.filter((p) => p.catEn === cat)),
    [cat, posts],
  );

  const [featured, ...rest] = filtered;

  const chip = (key: string, label: string) => {
    const active = cat === key;
    return (
      <button
        key={key}
        onClick={() => setCat(key)}
        className="cursor-pointer rounded-full px-4 py-2 text-[13px] font-bold"
        style={{
          background: active ? "var(--accent)" : "var(--surface)",
          color: active ? "#fff" : "var(--text)",
          border: "1px solid " + (active ? "var(--accent)" : "var(--border)"),
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="mx-auto max-w-[1280px] px-[22px] py-7">
      {/* header */}
      <div className="mb-6">
        <h1 className="text-[24px] font-extrabold tracking-tight">{t.blogTitle}</h1>
        <p className="mt-1.5 text-[14px]" style={{ color: "var(--muted)" }}>{t.blogSub}</p>
      </div>

      {/* category chips */}
      <div className="mb-6 flex flex-wrap gap-2.5">
        {chip("all", locale === "fa" ? "همه" : "All")}
        {cats.map(([key, label]) => chip(key, label))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center text-[15px] font-bold" style={{ color: "var(--muted)" }}>
          {t.noResults}
        </div>
      ) : (
        <>
          {/* featured / hero */}
          {featured && (
            <LocaleLink
              href={`/blog/${featured.slug}`}
              className="mb-7 grid overflow-hidden rounded-[16px] no-underline md:grid-cols-2"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div
                className="flex min-h-[220px] items-center justify-center text-[80px] font-extrabold"
                style={{ background: grad(featured.hue, dark), color: "rgba(255,255,255,.5)" }}
              >
                {(locale === "fa" ? featured.fa : featured.en).charAt(0)}
              </div>
              <div className="flex flex-col justify-center gap-3 p-6">
                <span
                  className="w-fit rounded-full px-3 py-1 text-[12px] font-bold"
                  style={{ background: "var(--surface2)", color: "var(--accent)", border: "1px solid var(--border)" }}
                >
                  {locale === "fa" ? featured.catFa : featured.catEn}
                </span>
                <h2 className="text-[22px] font-extrabold leading-snug" style={{ color: "var(--text)" }}>
                  {locale === "fa" ? featured.fa : featured.en}
                </h2>
                <p className="text-[14px]" style={{ color: "var(--muted)" }}>
                  {locale === "fa" ? featured.excerptFa : featured.excerptEn}
                </p>
                <div className="flex items-center justify-between text-[12.5px]" style={{ color: "var(--muted)" }}>
                  <span>{featured.author}</span>
                  <span>{fmtDate(featured.date)}</span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[13.5px] font-bold" style={{ color: "var(--accent)" }}>
                  {t.readMore} <ArrowForward size={15} />
                </span>
              </div>
            </LocaleLink>
          )}

          {/* grid */}
          <div className="grid gap-5 md:grid-cols-3">
            {rest.map((p) => {
              const title = locale === "fa" ? p.fa : p.en;
              return (
                <article
                  key={p.id}
                  className="flex flex-col overflow-hidden rounded-[16px]"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <LocaleLink
                    href={`/blog/${p.slug}`}
                    className="flex h-[160px] items-center justify-center text-[56px] font-extrabold no-underline"
                    style={{ background: grad(p.hue, dark), color: "rgba(255,255,255,.5)" }}
                  >
                    {title.charAt(0)}
                  </LocaleLink>
                  <div className="flex flex-1 flex-col gap-2.5 p-4">
                    <span
                      className="w-fit rounded-full px-2.5 py-1 text-[11.5px] font-bold"
                      style={{ background: "var(--surface2)", color: "var(--accent)", border: "1px solid var(--border)" }}
                    >
                      {locale === "fa" ? p.catFa : p.catEn}
                    </span>
                    <LocaleLink
                      href={`/blog/${p.slug}`}
                      className="text-[16px] font-extrabold leading-snug no-underline"
                      style={{ color: "var(--text)" }}
                    >
                      {title}
                    </LocaleLink>
                    <p className="flex-1 text-[13px]" style={{ color: "var(--muted)" }}>
                      {locale === "fa" ? p.excerptFa : p.excerptEn}
                    </p>
                    <div className="flex items-center justify-between text-[12px]" style={{ color: "var(--muted)" }}>
                      <span>{p.author}</span>
                      <span>{fmtDate(p.date)}</span>
                    </div>
                    <LocaleLink
                      href={`/blog/${p.slug}`}
                      className="inline-flex items-center gap-1.5 text-[13px] font-bold no-underline"
                      style={{ color: "var(--accent)" }}
                    >
                      {t.readMore} <ArrowForward size={14} />
                    </LocaleLink>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-7 text-[12.5px]" style={{ color: "var(--muted)" }}>
            {num(filtered.length, locale)} {locale === "fa" ? "مقاله" : "articles"}
          </div>
        </>
      )}
    </div>
  );
}
