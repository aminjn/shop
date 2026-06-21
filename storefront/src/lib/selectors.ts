import { PRODUCTS } from "@/data/products";
import type { Product } from "./types";

type List = Product[];
const seed = () => PRODUCTS;

export const featured = (list: List = seed()): Product[] =>
  list.filter((p) => p.badge || p.rating >= 4.7).slice(0, 8);

export const newest = (list: List = seed()): Product[] =>
  [...list].reverse().slice(0, 8);

export const bestSellers = (list: List = seed()): Product[] =>
  [...list].sort((a, b) => b.reviews - a.reviews).slice(0, 8);

export const onSale = (list: List = seed()): Product[] => list.filter((p) => p.old).slice(0, 8);

export const smartPicks = (list: List = seed()): Product[] =>
  [...list].sort((a, b) => b.rating - a.rating).slice(0, 4);

export const dealOfDay = (list: List = seed()): Product => onSale(list)[0] ?? list[0];

export const topBrands = (list: List = seed()): string[] => [
  ...new Set(list.map((p) => p.brand)),
];

export const related = (p: Product, list: List = seed()): Product[] =>
  list.filter((x) => x.cat === p.cat && x.id !== p.id).slice(0, 4);
