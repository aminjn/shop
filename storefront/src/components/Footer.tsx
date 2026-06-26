"use client";

import { useEffect, useState } from "react";
import { useShop } from "@/lib/store";
import { CATEGORIES } from "@/data/categories";
import { jalaliYearNow } from "@/lib/jalali";
import { LocaleLink } from "./LocaleLink";

type FootPage = { slug: string; titleFa: string; titleEn: string; published: boolean; footerCol?: string };

export function Footer() {
  const { t, locale, toast, categories: liveCats } = useShop();
  const [email, setEmail] = useState("");
  const [pages, setPages] = useState<FootPage[]>([]);
  useEffect(() => { fetch("/api/pages").then((r) => r.json()).then((d) => Array.isArray(d?.pages) && setPages(d.pages)).catch(() => {}); }, []);
  const cats = (liveCats.length ? liveCats : CATEGORIES).filter((c) => !c.hidden);
  const year =
    locale === "fa"
      ? jalaliYearNow().toLocaleString("fa-IR", { useGrouping: false })
      : String(new Date().getFullYear());

  // a column of links (href is required so links are real, not all "/shop")
  const col = (title: string, links: { label: string; href: string }[]) => (
    <div>
      <div className="mb-3 text-[14px] font-bold">{title}</div>
      <div className="flex flex-col gap-2.5">
        {links.map((l) => (
          <LocaleLink
            key={l.href + l.label}
            href={l.href}
            className="link-accent text-[13px] no-underline"
            style={{ color: "var(--muted)" }}
          >
            {l.label}
          </LocaleLink>
        ))}
      </div>
    </div>
  );

  const pageLinks = (group: "support" | "company") =>
    pages.filter((p) => p.published && p.footerCol === group).map((p) => ({ label: locale === "fa" ? p.titleFa : p.titleEn, href: `/p/${p.slug}` }));

  return (
    <footer style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
      {/* newsletter */}
      <div className="mx-auto max-w-[1280px] px-[22px] py-10">
        <div
          className="flex flex-wrap items-center justify-between gap-6 rounded-[18px] p-8 text-white"
          style={{ background: "var(--accent)" }}
        >
          <div>
            <div className="text-[22px] font-extrabold">{t.newsletterTitle}</div>
            <div className="mt-1 text-[14px] opacity-90">{t.newsletterSub}</div>
          </div>
          <div className="flex gap-2.5 rounded-[14px] bg-white p-2">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPh}
              className="w-[230px] border-none bg-transparent px-3 text-[14px] outline-none"
              style={{ color: "#111" }}
            />
            <button
              onClick={() => {
                setEmail("");
                toast(t.subscribed);
              }}
              className="cursor-pointer rounded-[10px] border-none px-5 py-2.5 text-[14px] font-bold text-white"
              style={{ background: "var(--text)" }}
            >
              {t.subscribe}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-8 px-[22px] pb-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] text-[20px] font-extrabold text-white"
              style={{ background: "var(--accent)" }}
            >
              {t.storeName.charAt(0)}
            </span>
            <span className="text-[20px] font-extrabold">{t.storeName}</span>
          </div>
          <p className="mt-3 max-w-[320px] text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>
            {t.footerAbout}
          </p>
        </div>
        {col(t.footerShop, cats.map((c) => ({ label: locale === "fa" ? c.fa : c.en, href: `/shop?cat=${c.id}` })))}
        {col(t.footerSupport, pageLinks("support"))}
        {col(t.footerCompany, pageLinks("company"))}
      </div>

      <div
        className="px-[22px] py-5 text-center text-[12.5px]"
        style={{ borderTop: "1px solid var(--border)", color: "var(--muted)" }}
      >
        © {year} {t.storeName} — {t.rights}
      </div>
    </footer>
  );
}
