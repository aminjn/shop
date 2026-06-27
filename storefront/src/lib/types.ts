export type Locale = "fa" | "en";

export interface Category {
  id: string;
  fa: string;
  en: string;
  hue: number;
  subs: [string, string][]; // [fa, en]
  hidden?: boolean; // hide from the site navigation menu
}

export interface Brand {
  id: string;
  name: string; // canonical brand value stored on products (e.g. "TechPro")
  en?: string; // latin/slug for links & SEO
  logo?: string; // logo image url
  url?: string; // the brand's own website (homepage links here when set)
  featured?: boolean; // show on homepage
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
  sub?: string; // subcategory slug (the subcategory's English/slug value)
  brand: string;
  featured?: boolean; // highlighted product (special)
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
  specs?: [string, string][]; // custom technical specs [label, value]
  sku?: string;
  variations?: Variation[];
  images?: string[];
  video?: string;
  // pack/carton sales: sold only in multiples of packSize units (no single unit)
  packSize?: number;
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
  variant?: number;
}

export interface Coupon {
  code: string;
  type: "percent" | "ship" | "fixed";
  value: number;
}
