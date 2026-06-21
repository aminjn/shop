import type { Metadata } from "next";
import { BlogArticle } from "@/components/BlogArticle";
import { postBySlug, POSTS } from "@/data/posts";
import { getDict } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/config";
import type { Locale } from "@/lib/types";

export function generateStaticParams() {
  return POSTS.flatMap((p) =>
    (["fa", "en"] as const).map((locale) => ({ locale, slug: p.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc = (isLocale(locale) ? locale : "fa") as Locale;
  const t = getDict(loc);
  const p = postBySlug(slug);
  if (!p) return { title: t.blogTitle };
  const title = loc === "fa" ? p.fa : p.en;
  const desc = loc === "fa" ? p.excerptFa : p.excerptEn;
  return {
    title,
    description: desc,
    openGraph: { title, description: desc, type: "article" },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const loc = (isLocale(locale) ? locale : "fa") as Locale;
  const p = postBySlug(slug);

  const jsonLd = p
    ? {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: loc === "fa" ? p.fa : p.en,
        author: { "@type": "Person", name: p.author },
        datePublished: p.date,
        articleSection: loc === "fa" ? p.catFa : p.catEn,
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <BlogArticle slug={slug} />
    </>
  );
}
