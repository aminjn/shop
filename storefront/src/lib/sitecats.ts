import "server-only";
import { CATEGORIES as SEED } from "@/data/categories";
import { readArray, writeArray, hasFile } from "./settings";
import type { Category } from "./types";

/** Live product categories. Seeded ONCE; afterwards the file is authoritative. */
export function getCategories(): Category[] {
  if (!hasFile("categories.json")) {
    writeArray<Category>("categories.json", SEED);
    return SEED;
  }
  return readArray<Category>("categories.json", []);
}
export function saveCategories(list: Category[]): Category[] {
  return writeArray<Category>("categories.json", list);
}
