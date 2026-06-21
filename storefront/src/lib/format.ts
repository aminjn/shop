import type { Locale } from "./types";

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
