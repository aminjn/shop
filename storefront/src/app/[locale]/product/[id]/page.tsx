import type { Metadata } from "next";
import { ProductDetail } from "@/components/ProductDetail";
import { getProduct } from "@/lib/catalog";
import { variantPrice } from "@/lib/format";
import { siteOrigin, getSeo } from "@/lib/seo";
import { readStore } from "@/lib/settings";
import { getDict } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/config";
import type { Locale } from "@/lib/types";

// Product data is admin-editable, so render per-request from the live catalog
// (otherwise the page title / metadata would keep the seed product's name).
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const loc = (isLocale(locale) ? locale : "fa") as Locale;
  const t = getDict(loc);
  const p = getProduct(Number(id));
  if (!p) return { title: t.noResults };
  const name = loc === "fa" ? p.fa : p.en;
  const desc =
    loc === "fa"
      ? `${name} از برند ${p.brand} — خرید با ضمانت اصالت و ارسال سریع.`
      : `${name} by ${p.brand} — buy with authenticity guarantee and fast shipping.`;
  return {
    title: name,
    description: desc,
    openGraph: { title: name, description: desc, type: "website" },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const loc = (isLocale(locale) ? locale : "fa") as Locale;
  const p = getProduct(Number(id));
  const origin = siteOrigin();
  const seo = getSeo();
  const store = readStore();
  const sellerName = seo.orgName || store.storeName || "";

  const name = p ? (loc === "fa" ? p.fa : p.en) : "";
  const url = `${origin}/${loc}/product/${id}`;
  const validUntil = `${new Date().getFullYear() + 1}-12-31`;
  const jsonLd = p
    ? {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Product",
            name,
            url,
            sku: p.sku || `SKU-${1000 + p.id}`,
            ...(p.images?.length ? { image: p.images.map((i) => (i.startsWith("http") ? i : origin + i)) } : {}),
            description: (loc === "fa" ? p.shortFa : p.shortEn) || `${name} — ${p.brand}`,
            brand: { "@type": "Brand", name: p.brand },
            ...(p.country ? { countryOfOrigin: p.country } : {}),
            ...(p.reviews > 0
              ? { aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.reviews, bestRating: 5 } }
              : {}),
            offers: {
              "@type": "Offer",
              price: variantPrice(p),
              priceCurrency: "IRR",
              url,
              priceValidUntil: validUntil,
              itemCondition: "https://schema.org/NewCondition",
              availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              ...(sellerName ? { seller: { "@type": "Organization", name: sellerName } } : {}),
            },
          },
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: loc === "fa" ? "خانه" : "Home", item: `${origin}/${loc}` },
              { "@type": "ListItem", position: 2, name: loc === "fa" ? "فروشگاه" : "Shop", item: `${origin}/${loc}/shop` },
              { "@type": "ListItem", position: 3, name, item: url },
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
      <ProductDetail id={Number(id)} />
    </>
  );
}
