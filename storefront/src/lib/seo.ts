import "server-only";
import fs from "node:fs";
import path from "node:path";
import { hasFile } from "./settings";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const FILE = "seo.json";

export interface SeoSettings {
  siteUrl: string;            // canonical origin, e.g. https://tebtamin.ir
  titleTemplate: string;      // e.g. "%s | تامین طب" (%s = page title)
  defaultTitle: string;       // homepage / fallback title
  defaultDescription: string;
  keywords: string;           // comma/Persian-comma separated
  ogImage: string;            // social share image url
  twitterHandle: string;      // @handle
  // Organization structured data
  orgName: string;
  orgLogo: string;
  phone: string;
  email: string;
  address: string;
  sameAs: string;             // social profile URLs, one per line
  // search engines
  googleVerification: string; // google-site-verification token
  bingVerification: string;   // msvalidate.01 token
  gaId: string;               // GA4 measurement id (G-XXXXXXX)
  gtmId: string;              // Google Tag Manager (GTM-XXXX)
  noindex: boolean;           // block all indexing
  robotsExtra: string;        // extra lines appended to robots.txt
}

export const SEO_DEFAULT: SeoSettings = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "",
  titleTemplate: "",
  defaultTitle: "",
  defaultDescription: "",
  keywords: "",
  ogImage: "",
  twitterHandle: "",
  orgName: "",
  orgLogo: "",
  phone: "",
  email: "",
  address: "",
  sameAs: "",
  googleVerification: "",
  bingVerification: "",
  gaId: "",
  gtmId: "",
  noindex: false,
  robotsExtra: "",
};

export function getSeo(): SeoSettings {
  if (!hasFile(FILE)) return SEO_DEFAULT;
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, FILE), "utf8"));
    return { ...SEO_DEFAULT, ...(raw && typeof raw === "object" ? raw : {}) };
  } catch {
    return SEO_DEFAULT;
  }
}
export function writeSeo(s: SeoSettings): SeoSettings {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, FILE), JSON.stringify(s, null, 2), "utf8");
  return s;
}

/** Effective origin used for canonical URLs / sitemap. */
export function siteOrigin(): string {
  const s = getSeo();
  return (s.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://example.com").replace(/\/$/, "");
}
