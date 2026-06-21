import type { Metadata } from "next";
import { ProductDetail } from "@/components/ProductDetail";
import { productById, PRODUCTS } from "@/data/products";
import { getDict } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/config";
import type { Locale } from "@/lib/types";

export function generateStaticParams() {
  return PRODUCTS.flatMap((p) =>
    (["fa", "en"] as const).map((locale) => ({ locale, id: String(p.id) })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const loc = (isLocale(locale) ? locale : "fa") as Locale;
  const t = getDict(loc);
  const p = productById(Number(id));
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
  const p = productById(Number(id));

  const jsonLd = p
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: loc === "fa" ? p.fa : p.en,
        brand: { "@type": "Brand", name: p.brand },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: p.rating,
          reviewCount: p.reviews,
        },
        offers: {
          "@type": "Offer",
          price: p.price,
          priceCurrency: "IRT",
          availability:
            p.stock > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
        },
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
