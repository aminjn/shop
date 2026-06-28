import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { siteOrigin } from "@/lib/seo";
import { getCatalog } from "@/lib/catalog";
import { getPages } from "@/lib/pages";
import { getPublishedPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const BASE = siteOrigin();
  const staticPaths = ["", "/shop", "/blog"];
  const products = getCatalog();
  const pages = getPages().filter((p) => p.published);
  const posts = getPublishedPosts();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const path of staticPaths) {
      entries.push({ url: `${BASE}/${locale}${path}`, changeFrequency: "weekly", priority: path === "" ? 1 : 0.7 });
    }
    for (const p of products) {
      entries.push({ url: `${BASE}/${locale}/product/${p.id}`, changeFrequency: "daily", priority: 0.8 });
    }
    for (const a of posts) {
      entries.push({ url: `${BASE}/${locale}/blog/${a.slug}`, lastModified: a.date, changeFrequency: "weekly", priority: 0.6 });
    }
    for (const pg of pages) {
      entries.push({ url: `${BASE}/${locale}/p/${pg.slug}`, changeFrequency: "monthly", priority: 0.5 });
    }
  }
  return entries;
}
