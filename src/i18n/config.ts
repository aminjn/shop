import type { Locale } from "@/lib/types";

export const locales: Locale[] = ["fa", "en"];
export const defaultLocale: Locale = "fa";

export const dir = (l: Locale): "rtl" | "ltr" => (l === "fa" ? "rtl" : "ltr");

export function isLocale(x: string): x is Locale {
  return (locales as string[]).includes(x);
}
