import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage } from "@/lib/pages";
import { renderMarkdown } from "@/lib/markdown";
import { isLocale } from "@/i18n/config";
import type { Locale } from "@/lib/types";

// pages are admin-editable → render per request from the live store
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc = (isLocale(locale) ? locale : "fa") as Locale;
  const p = getPage(slug);
  if (!p) return { title: "404" };
  const title = loc === "fa" ? p.titleFa : p.titleEn;
  return { title, openGraph: { title, type: "article" } };
}

export default async function SitePageView({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const loc = (isLocale(locale) ? locale : "fa") as Locale;
  const p = getPage(slug);
  if (!p || !p.published) notFound();
  const title = loc === "fa" ? p.titleFa : p.titleEn;
  const html = renderMarkdown((loc === "fa" ? p.bodyFa : p.bodyEn) || "");
  return (
    <div className="mx-auto max-w-[860px] px-[22px] py-10">
      <h1 className="mb-6 text-[30px] font-black tracking-tight">{title}</h1>
      <div className="prose-mini text-[15px] leading-loose" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
