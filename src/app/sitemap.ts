import type { MetadataRoute } from "next";
import { PRODUCTS } from "@/data/products";
import { locales } from "@/i18n/config";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = ["", "/shop", "/blog", "/cart", "/account"];
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const path of staticPaths) {
      entries.push({
        url: `${BASE}/${locale}${path}`,
        changeFrequency: "weekly",
        priority: path === "" ? 1 : 0.7,
      });
    }
    for (const p of PRODUCTS) {
      entries.push({
        url: `${BASE}/${locale}/product/${p.id}`,
        changeFrequency: "daily",
        priority: 0.8,
      });
    }
  }
  return entries;
}
