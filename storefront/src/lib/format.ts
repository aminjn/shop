import type { Locale, Product } from "./types";

/** Price of ONE unit. For per-cm products the unit is a piece of «width» cm,
 *  so the piece price = pricePerCm × width (e.g. 5cm × 320,000 = 1,600,000). */
export function unitPrice(p: Pick<Product, "price" | "pricingType" | "pricePerCm" | "width">): number {
  if (p.pricingType === "per_cm") {
    const per = p.pricePerCm || 0;
    const size = p.width && p.width > 0 ? p.width : 1;
    return per * size;
  }
  return p.price || 0;
}
/** True when the product is priced by the centimetre. */
export function isPerCm(p: Pick<Product, "pricingType">): boolean {
  return p.pricingType === "per_cm";
}
/** True when the product is sold in priced variants (e.g. خشک / روغنی). */
export function hasVariations(p: Pick<Product, "variations">): boolean {
  return !!(p.variations && p.variations.length);
}
/** Effective stock. For variant products the base stock is usually 0 and the
 *  real stock lives on each variant, so sum the variants. */
export function totalStock(p: Pick<Product, "stock" | "variations">): number {
  if (p.variations && p.variations.length) {
    return p.variations.reduce((s, v) => s + (v.stock || 0), 0);
  }
  return p.stock || 0;
}
/** Effective unit price. When a product has variations its base price is often
 *  0 and the real prices live on each variant — so use the chosen variant
 *  (by index) or, if none is chosen, the cheapest variant. Falls back to
 *  unitPrice() for ordinary / per-cm / carton products. */
export function variantPrice(
  p: Pick<Product, "price" | "pricingType" | "pricePerCm" | "width" | "variations">,
  idx?: number,
): number {
  const vs = p.variations;
  if (vs && vs.length) {
    if (typeof idx === "number" && vs[idx]) return vs[idx].price || 0;
    const prices = vs.map((v) => v.price || 0).filter((n) => n > 0);
    return prices.length ? Math.min(...prices) : vs[0].price || 0;
  }
  return unitPrice(p);
}
/** Human breakdown for a per-cm piece, e.g. "۵ سانت × ۳۲۰٬۰۰۰". */
export function perCmNote(p: Pick<Product, "pricingType" | "pricePerCm" | "width">, locale: Locale): string {
  if (p.pricingType !== "per_cm") return "";
  const size = p.width && p.width > 0 ? p.width : 1;
  const fa = locale === "fa";
  return `${num(size, locale)} ${fa ? "سانت" : "cm"} × ${num(p.pricePerCm || 0, locale)}`;
}

export function num(n: number, locale: Locale): string {
  return Number(n).toLocaleString(locale === "fa" ? "fa-IR" : "en-US");
}

export function priceFmt(n: number, locale: Locale, currency: string): string {
  return num(n, locale) + " " + currency;
}

/** Short price for header pill (e.g. ۴٫۲ م تومان) */
export function priceShort(n: number, locale: Locale, currency: string): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    const s = num(Math.round(m * 10) / 10, locale);
    return locale === "fa" ? `${s} م ${currency}` : `${s}M ${currency}`;
  }
  return priceFmt(n, locale, currency);
}

/** Reproduces the prototype's radial brand gradient for a hue. */
export function grad(hue: number, dark: boolean): string {
  const l1 = dark ? 32 : 88;
  const l2 = dark ? 15 : 72;
  return `radial-gradient(130% 120% at 28% 22%, hsl(${hue} 66% ${l1}%), hsl(${hue + 30} 58% ${l2}%))`;
}

export function stars(rating: number): string {
  const full = Math.round(rating);
  return "★★★★★".slice(0, full) + "☆☆☆☆☆".slice(0, 5 - full);
}

export const ROUNDNESS: Record<string, string> = {
  sharp: "7px",
  soft: "14px",
  round: "22px",
};

/** Format a date — Persian (Jalali) calendar with Persian digits for fa,
 *  Gregorian for en. Used everywhere so all dates are Shamsi on the fa site. */
export function formatDate(
  input: string | number | Date,
  locale: Locale,
  opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" },
): string {
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return typeof input === "string" ? input : "";
  const loc = locale === "fa" ? "fa-IR-u-ca-persian" : "en-US";
  return new Intl.DateTimeFormat(loc, opts).format(d);
}

