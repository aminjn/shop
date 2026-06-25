import "server-only";
import { PRODUCTS as SEED } from "@/data/products";
import { readArray, writeArray, hasFile } from "./settings";
import type { Product } from "./types";

/** The live catalog: persisted products.json. Seeded ONCE on first run; after
 *  that the stored file is authoritative even if the admin emptied it. */
export function getCatalog(): Product[] {
  if (!hasFile("products.json")) {
    writeArray<Product>("products.json", SEED);
    return SEED;
  }
  return readArray<Product>("products.json", []);
}
export function saveCatalog(list: Product[]): Product[] {
  return writeArray<Product>("products.json", list);
}
export function getProduct(id: number): Product | undefined {
  return getCatalog().find((p) => p.id === id);
}
export function nextProductId(): number {
  return getCatalog().reduce((m, p) => Math.max(m, p.id), 0) + 1;
}
