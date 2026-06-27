"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useShop } from "@/lib/store";
import { type Post } from "@/data/posts";
import { grad, num, formatDate } from "@/lib/format";
import { LocaleLink } from "@/components/LocaleLink";
import { ArrowForward, ArrowBack, Search } from "@/components/Icons";

type P = Post & { featured?: boolean };

export default function BlogPage() {
  const { locale, t, dark } = useShop();
  const fa = locale === "fa";
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [posts, setPosts] = useState<P[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/posts", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (Array.isArray(d?.posts)) setPosts(d.posts as P[]); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const fmtDate = (d: string) => formatDate(d, locale, { year: "numeric", month: "short", day: "numeric" });
  const title = (p: P) => (fa ? p.fa : p.en);
  const catLabel = (p: P) => (fa ? p.catFa : p.catEn);

  const cats = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of posts) m.set(p.catEn, fa ? p.catFa : p.catEn);
    return Array.from(m.entries());
  }, [posts, fa]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return posts.filter((p) => {
      if (cat !== "all" && p.catEn !== cat) return false;
      if (ql && !`${p.fa} ${p.en} ${p.excerptFa} ${p.excerptEn}`.toLowerCase().includes(ql)) return false;
      return true;
    });
  }, [posts, cat, q]);

  const slides = useMemo(() => {
    const feat = posts.filter((p) => p.featured);
    return (feat.length ? feat : posts).slice(0, 6);
  }, [posts]);

  const recent = posts.slice(0, 5);

  const card = { background: "var(--surface)", border: "1px solid var(--border)" } as const;
  const chip = (key: string, label: string) => {
    const active = cat === key;
    return (
      <button key={key} onClick={() => setCat(key)} className="cursor-pointer rounded-full px-3.5 py-1.5 text-[12.5px] font-bold" style={{ background: active ? "var(--accent)" : "var(--surface)", color: active ? "#fff" : "var(--text)", border: "1px solid " + (active ? "var(--accent)" : "var(--border)") }}>{label}</button>
    );
  };

  const Cover = ({ p, h, big }: { p: P; h: number; big?: boolean }) => (
    p.cover ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={p.cover} alt={title(p)} className="h-full w-full object-cover" style={{ height: h }} />
    ) : (
      <div className="flex w-full items-center justify-center font-extrabold" style={{ height: h, background: grad(p.hue, dark), color: "rgba(255,255,255,.5)", fontSize: big ? 90 : 56 }}>{title(p).charAt(0)}</div>
    )
  );

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-[22px] md:py-7">
      <div className="mb-5">
        <h1 className="text-[24px] font-extrabold tracking-tight">{t.blogTitle}</h1>
        <p className="mt-1.5 text-[14px]" style={{ color: "var(--muted)" }}>{t.blogSub}</p>
      </div>

      {!loaded ? (
        <div className="rounded-[16px] py-20 text-center text-[15px] font-bold" style={{ ...card, color: "var(--muted)" }}>
          {fa ? "در حال بارگذاری مقالات…" : "Loading articles…"}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-[16px] py-20 text-center text-[15px] font-bold" style={{ ...card, color: "var(--muted)" }}>
          {fa ? "هنوز مقاله‌ای منتشر نشده است." : "No articles published yet."}
        </div>
      ) : (
        <>
          {slides.length > 0 && <Slider slides={slides} locale={locale} dark={dark} t={t} fmtDate={fmtDate} />}

          <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_300px]">
            {/* main */}
            <div>
              {/* category chips */}
              <div className="mb-4 flex flex-wrap gap-2">
                {chip("all", fa ? "همه" : "All")}
                {cats.map(([k, l]) => chip(k, l))}
              </div>

              {filtered.length === 0 ? (
                <div className="rounded-[16px] py-16 text-center text-[14px]" style={{ ...card, color: "var(--muted)" }}>{t.noResults}</div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  {filtered.map((p) => (
                    <article key={p.id} className="flex flex-col overflow-hidden rounded-[16px]" style={card}>
                      <LocaleLink href={`/blog/${p.slug}`} className="block overflow-hidden no-underline"><Cover p={p} h={170} /></LocaleLink>
                      <div className="flex flex-1 flex-col gap-2.5 p-4">
                        <span className="w-fit rounded-full px-2.5 py-1 text-[11.5px] font-bold" style={{ background: "var(--surface2)", color: "var(--accent)", border: "1px solid var(--border)" }}>{catLabel(p)}</span>
                        <LocaleLink href={`/blog/${p.slug}`} className="text-[16px] font-extrabold leading-snug no-underline" style={{ color: "var(--text)" }}>{title(p)}</LocaleLink>
                        <p className="flex-1 text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>{fa ? p.excerptFa : p.excerptEn}</p>
                        <div className="flex items-center justify-between text-[12px]" style={{ color: "var(--muted)" }}>
                          <span>{p.author}</span><span>{fmtDate(p.date)}</span>
                        </div>
                        <LocaleLink href={`/blog/${p.slug}`} className="inline-flex items-center gap-1.5 text-[13px] font-bold no-underline" style={{ color: "var(--accent)" }}>{t.readMore} <ArrowForward size={14} /></LocaleLink>
                      </div>
                    </article>
                  ))}
                </div>
              )}
              <div className="mt-6 text-[12.5px]" style={{ color: "var(--muted)" }}>{num(filtered.length, locale)} {fa ? "مقاله" : "articles"}</div>
            </div>

            {/* sidebar */}
            <aside className="flex flex-col gap-5">
              <div className="rounded-[16px] p-4" style={card}>
                <div className="flex h-[44px] items-center gap-2 rounded-[12px] px-3" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
                  <Search size={18} style={{ color: "var(--muted)" }} />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={fa ? "جستجو در مقالات…" : "Search articles…"} className="h-full flex-1 border-none bg-transparent text-[14px] outline-none" style={{ color: "var(--text)" }} />
                </div>
              </div>

              <div className="rounded-[16px] p-4" style={card}>
                <h3 className="mb-3 text-[14px] font-extrabold">{fa ? "دسته‌بندی‌ها" : "Categories"}</h3>
                <div className="flex flex-col gap-1">
                  <button onClick={() => setCat("all")} className="flex cursor-pointer items-center justify-between rounded-[9px] border-none bg-transparent px-2.5 py-2 text-[13px] font-bold" style={{ color: cat === "all" ? "var(--accent)" : "var(--text)" }}>
                    <span>{fa ? "همه" : "All"}</span><span style={{ color: "var(--muted)" }}>{num(posts.length, locale)}</span>
                  </button>
                  {cats.map(([k, l]) => {
                    const c = posts.filter((p) => p.catEn === k).length;
                    return (
                      <button key={k} onClick={() => setCat(k)} className="flex cursor-pointer items-center justify-between rounded-[9px] border-none bg-transparent px-2.5 py-2 text-[13px] font-bold" style={{ color: cat === k ? "var(--accent)" : "var(--text)" }}>
                        <span>{l}</span><span style={{ color: "var(--muted)" }}>{num(c, locale)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {recent.length > 0 && (
                <div className="rounded-[16px] p-4" style={card}>
                  <h3 className="mb-3 text-[14px] font-extrabold">{fa ? "تازه‌ترین مطالب" : "Recent"}</h3>
                  <div className="flex flex-col gap-3">
                    {recent.map((p) => (
                      <LocaleLink key={p.id} href={`/blog/${p.slug}`} className="flex items-center gap-3 no-underline" style={{ color: "var(--text)" }}>
                        <span className="h-12 w-12 flex-none overflow-hidden rounded-[10px]">{<Cover p={p} h={48} />}</span>
                        <span className="min-w-0">
                          <span className="line-clamp-2 text-[12.5px] font-bold">{title(p)}</span>
                          <span className="text-[11px]" style={{ color: "var(--muted)" }}>{fmtDate(p.date)}</span>
                        </span>
                      </LocaleLink>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

/* ---- hero slider (auto-advance + arrows + dots + swipe) ---- */
function Slider({ slides, locale, dark, t, fmtDate }: { slides: P[]; locale: string; dark: boolean; t: ReturnType<typeof useShop>["t"]; fmtDate: (d: string) => string }) {
  const fa = locale === "fa";
  const [i, setI] = useState(0);
  const touch = useRef<number | null>(null);
  const n = slides.length;
  const go = (d: number) => setI((x) => (x + d + n) % n);

  useEffect(() => {
    if (n <= 1) return;
    const id = setInterval(() => setI((x) => (x + 1) % n), 5500);
    return () => clearInterval(id);
  }, [n]);

  const title = (p: P) => (fa ? p.fa : p.en);
  return (
    <div
      className="relative overflow-hidden rounded-[18px]"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => { if (touch.current == null) return; const dx = e.changedTouches[0].clientX - touch.current; if (Math.abs(dx) > 50) go(dx > 0 ? (fa ? 1 : -1) : (fa ? -1 : 1)); touch.current = null; }}
    >
      <div className="flex transition-transform duration-500" style={{ transform: `translateX(${(fa ? 1 : -1) * i * 100}%)` }}>
        {slides.map((p) => (
          <LocaleLink key={p.id} href={`/blog/${p.slug}`} className="grid w-full flex-none no-underline md:grid-cols-2" style={{ color: "var(--text)" }}>
            <div className="flex min-h-[200px] items-center justify-center overflow-hidden md:min-h-[300px]">
              {p.cover
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={p.cover} alt={title(p)} className="h-full w-full object-cover" />
                : <div className="flex h-full w-full items-center justify-center text-[90px] font-extrabold" style={{ background: grad(p.hue, dark), color: "rgba(255,255,255,.5)" }}>{title(p).charAt(0)}</div>}
            </div>
            <div className="flex flex-col justify-center gap-3 p-6 md:p-8">
              <span className="w-fit rounded-full px-3 py-1 text-[12px] font-bold" style={{ background: "var(--surface2)", color: "var(--accent)", border: "1px solid var(--border)" }}>{fa ? p.catFa : p.catEn}</span>
              <h2 className="text-[22px] font-extrabold leading-snug md:text-[26px]">{title(p)}</h2>
              <p className="text-[14px] leading-relaxed" style={{ color: "var(--muted)" }}>{fa ? p.excerptFa : p.excerptEn}</p>
              <div className="flex items-center gap-3 text-[12.5px]" style={{ color: "var(--muted)" }}><span>{p.author}</span><span>•</span><span>{fmtDate(p.date)}</span></div>
              <span className="inline-flex items-center gap-1.5 text-[13.5px] font-bold" style={{ color: "var(--accent)" }}>{t.readMore} <ArrowForward size={15} /></span>
            </div>
          </LocaleLink>
        ))}
      </div>

      {n > 1 && (
        <>
          <button onClick={() => go(-1)} aria-label="prev" className="absolute top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-none" style={{ insetInlineStart: 12, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}><span className="dir-flip"><ArrowBack size={18} /></span></button>
          <button onClick={() => go(1)} aria-label="next" className="absolute top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-none" style={{ insetInlineEnd: 12, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}><span className="dir-flip"><ArrowForward size={18} /></span></button>
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {slides.map((_, x) => (
              <button key={x} onClick={() => setI(x)} aria-label={`slide ${x + 1}`} className="h-2 cursor-pointer rounded-full border-none transition-all" style={{ width: x === i ? 22 : 8, background: x === i ? "var(--accent)" : "var(--border)" }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
