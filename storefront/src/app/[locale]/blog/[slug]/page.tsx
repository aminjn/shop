import type { Metadata } from "next";
import { BlogArticle } from "@/components/BlogArticle";
import { postBySlugStore } from "@/lib/posts";
import { siteOrigin, getSeo } from "@/lib/seo";
import { readStore } from "@/lib/settings";
import { getDict } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/config";
import type { Locale } from "@/lib/types";

// articles are admin/AI-generated at runtime → read live, render on demand
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc = (isLocale(locale) ? locale : "fa") as Locale;
  const t = getDict(loc);
  const p = postBySlugStore(slug);
  if (!p) return { title: t.blogTitle };
  const title = (p.seoTitle && p.seoTitle.trim()) || (loc === "fa" ? p.fa : p.en);
  const desc = (p.metaDesc && p.metaDesc.trim()) || (loc === "fa" ? p.excerptFa : p.excerptEn);
  return {
    title,
    description: desc,
    keywords: p.keyword ? [p.keyword] : undefined,
    openGraph: { title, description: desc, type: "article", ...(p.cover ? { images: [p.cover] } : {}) },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const loc = (isLocale(locale) ? locale : "fa") as Locale;
  const p = postBySlugStore(slug);
  const origin = siteOrigin();
  const seo = getSeo();
  const store = readStore();
  const orgName = seo.orgName || store.storeName || "";
  const url = p ? `${origin}/${loc}/blog/${p.slug}` : "";

  const jsonLd = p
    ? {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "BlogPosting",
            headline: (loc === "fa" ? p.fa : p.en).slice(0, 110),
            description: (loc === "fa" ? p.excerptFa : p.excerptEn) || undefined,
            ...(p.cover ? { image: [p.cover.startsWith("http") ? p.cover : origin + p.cover] } : {}),
            author: { "@type": "Organization", name: p.author || orgName },
            publisher: {
              "@type": "Organization",
              name: orgName,
              ...(seo.orgLogo || store.logoUrl ? { logo: { "@type": "ImageObject", url: seo.orgLogo || store.logoUrl } } : {}),
            },
            datePublished: p.date,
            dateModified: p.date,
            mainEntityOfPage: url,
            articleSection: loc === "fa" ? p.catFa : p.catEn,
            ...(p.keyword ? { keywords: p.keyword } : {}),
          },
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: loc === "fa" ? "خانه" : "Home", item: `${origin}/${loc}` },
              { "@type": "ListItem", position: 2, name: loc === "fa" ? "بلاگ" : "Blog", item: `${origin}/${loc}/blog` },
              { "@type": "ListItem", position: 3, name: loc === "fa" ? p.fa : p.en, item: url },
            ],
          },
        ],
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
