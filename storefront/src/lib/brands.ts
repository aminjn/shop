import "server-only";
import { BRANDS as SEED_NAMES } from "@/data/categories";
import { readArray, writeArray, hasFile } from "./settings";
import type { Brand } from "./types";

export function brandSlug(s: string): string {
  return (s || "").trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\p{L}\p{N}-]/gu, "").slice(0, 40);
}

const SEED: Brand[] = SEED_NAMES.map((name) => ({
  id: brandSlug(name) || name,
  name,
  en: /^[\x00-\x7F]+$/.test(name) ? name : undefined,
  featured: true,
}));

/** Live brands. Seeded ONCE; afterwards the file is authoritative. */
export function getBrands(): Brand[] {
  if (!hasFile("brands.json")) {
    writeArray<Brand>("brands.json", SEED);
    return SEED;
  }
  return readArray<Brand>("brands.json", []);
}
export function saveBrands(list: Brand[]): Brand[] {
  return writeArray<Brand>("brands.json", list);
}
