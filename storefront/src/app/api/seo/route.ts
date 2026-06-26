import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSeo, writeSeo, SEO_DEFAULT, type SeoSettings } from "@/lib/seo";

export async function GET() {
  return NextResponse.json({ ok: true, seo: getSeo() });
}

export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "super_admin") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const incoming = (b.seo || {}) as Partial<SeoSettings>;
  const cur = getSeo();
  const str = (v: unknown, max = 500) => (v === undefined ? undefined : String(v).slice(0, max));
  const merged: SeoSettings = {
    ...SEO_DEFAULT, ...cur,
    siteUrl: str(incoming.siteUrl) ?? cur.siteUrl,
    titleTemplate: str(incoming.titleTemplate, 120) ?? cur.titleTemplate,
    defaultTitle: str(incoming.defaultTitle, 120) ?? cur.defaultTitle,
    defaultDescription: str(incoming.defaultDescription, 320) ?? cur.defaultDescription,
    keywords: str(incoming.keywords, 400) ?? cur.keywords,
    ogImage: str(incoming.ogImage) ?? cur.ogImage,
    twitterHandle: str(incoming.twitterHandle, 40) ?? cur.twitterHandle,
    orgName: str(incoming.orgName, 120) ?? cur.orgName,
    orgLogo: str(incoming.orgLogo) ?? cur.orgLogo,
    phone: str(incoming.phone, 40) ?? cur.phone,
    email: str(incoming.email, 120) ?? cur.email,
    address: str(incoming.address, 300) ?? cur.address,
    sameAs: str(incoming.sameAs, 1000) ?? cur.sameAs,
    googleVerification: str(incoming.googleVerification, 200) ?? cur.googleVerification,
    bingVerification: str(incoming.bingVerification, 200) ?? cur.bingVerification,
    gaId: str(incoming.gaId, 40) ?? cur.gaId,
    gtmId: str(incoming.gtmId, 40) ?? cur.gtmId,
    noindex: typeof incoming.noindex === "boolean" ? incoming.noindex : cur.noindex,
    robotsExtra: str(incoming.robotsExtra, 2000) ?? cur.robotsExtra,
  };
  writeSeo(merged);
  return NextResponse.json({ ok: true, seo: getSeo() });
}
