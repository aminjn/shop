import { PRODUCTS } from "@/data/products";
import type { Product } from "./types";

export const featured = (): Product[] =>
  PRODUCTS.filter((p) => p.badge || p.rating >= 4.7).slice(0, 8);

export const newest = (): Product[] =>
  [...PRODUCTS].reverse().slice(0, 8);

export const bestSellers = (): Product[] =>
  [...PRODUCTS].sort((a, b) => b.reviews - a.reviews).slice(0, 8);

export const onSale = (): Product[] => PRODUCTS.filter((p) => p.old).slice(0, 8);

export const smartPicks = (): Product[] =>
  [...PRODUCTS].sort((a, b) => b.rating - a.rating).slice(0, 4);

export const dealOfDay = (): Product => onSale()[0] ?? PRODUCTS[0];

export const topBrands = (): string[] => [
  ...new Set(PRODUCTS.map((p) => p.brand)),
];

export const related = (p: Product): Product[] =>
  PRODUCTS.filter((x) => x.cat === p.cat && x.id !== p.id).slice(0, 4);
