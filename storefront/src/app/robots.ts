import type { MetadataRoute } from "next";
import { siteOrigin, getSeo } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const BASE = siteOrigin();
  const seo = getSeo();
  return {
    rules: seo.noindex
      ? { userAgent: "*", disallow: "/" }
      : { userAgent: "*", allow: "/", disallow: ["/fa/admin", "/en/admin", "/api/"] },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
