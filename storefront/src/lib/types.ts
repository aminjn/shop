export type Locale = "fa" | "en";

export interface Category {
  id: string;
  fa: string;
  en: string;
  hue: number;
  subs: [string, string][]; // [fa, en]
}

export interface Variation {
  type: string;
  value: string;
  price: number;
  stock: number;
  sku: string;
}

export interface Product {
  id: number;
  fa: string;
  en: string;
  cat: string;
  brand: string;
  price: number;
  old?: number;
  rating: number;
  reviews: number;
  hue: number;
  badge?: [string, string]; // [fa, en]
  colors?: [string, string][]; // [name, hex]
  sizes?: string[];
  country: string;
  warranty: string;
  stock: number;
  shortFa?: string;
  shortEn?: string;
  sku?: string;
  variations?: Variation[];
  images?: string[];
  video?: string;
  // per-centimeter pricing (e.g. rolls/fabric sold by length)
  pricingType?: "unit" | "per_cm";
  pricePerCm?: number; // price for 1 cm of length
  width?: number; // roll/sheet width in cm
}

export interface CartLine {
  key: string;
  id: number;
  qty: number;
  color: number;
  size: number;
}

export interface Coupon {
  code: string;
  type: "percent" | "ship" | "fixed";
  value: number;
}
