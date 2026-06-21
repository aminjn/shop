import "server-only";
import { PRODUCTS as SEED } from "@/data/products";
import { readArray, writeArray } from "./settings";
import type { Product } from "./types";

/** The live catalog: persisted products.json, or the seed on first run. */
export function getCatalog(): Product[] {
  return readArray<Product>("products.json", SEED);
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
