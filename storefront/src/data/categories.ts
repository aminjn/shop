import type { Category } from "@/lib/types";

export const CATEGORIES: Category[] = [
  {
    id: "tech",
    fa: "الکترونیک",
    en: "Electronics",
    hue: 215,
    subs: [
      ["موبایل و تبلت", "Mobiles"],
      ["لپ‌تاپ و کامپیوتر", "Laptops"],
      ["صوتی و تصویری", "Audio"],
      ["لوازم جانبی", "Accessories"],
      ["دوربین", "Cameras"],
      ["گیمینگ", "Gaming"],
    ],
  },
  {
    id: "fashion",
    fa: "مد و پوشاک",
    en: "Fashion",
    hue: 345,
    subs: [
      ["پوشاک مردانه", "Men"],
      ["پوشاک زنانه", "Women"],
      ["کیف و کفش", "Shoes & Bags"],
      ["اکسسوری", "Accessories"],
      ["ساعت", "Watches"],
      ["عینک", "Eyewear"],
    ],
  },
  {
    id: "home",
    fa: "خانه و آشپزخانه",
    en: "Home & Kitchen",
    hue: 152,
    subs: [
      ["لوازم آشپزخانه", "Kitchen"],
      ["دکوراسیون", "Decor"],
      ["روشنایی", "Lighting"],
      ["لوازم برقی", "Appliances"],
      ["سرویس خواب", "Bedding"],
      ["نظافت", "Cleaning"],
    ],
  },
  {
    id: "beauty",
    fa: "زیبایی و سلامت",
    en: "Beauty & Health",
    hue: 320,
    subs: [
      ["مراقبت پوست", "Skincare"],
      ["آرایشی", "Makeup"],
      ["عطر و ادکلن", "Fragrance"],
      ["مراقبت مو", "Hair"],
      ["سلامت", "Health"],
      ["لوازم شخصی", "Personal Care"],
    ],
  },
  {
    id: "sport",
    fa: "ورزش و سفر",
    en: "Sports & Travel",
    hue: 28,
    subs: [
      ["بدنسازی", "Fitness"],
      ["کوهنوردی", "Outdoor"],
      ["دوچرخه", "Cycling"],
      ["ورزش‌های آبی", "Water Sports"],
      ["چمدان و سفر", "Travel"],
      ["پوشاک ورزشی", "Sportswear"],
    ],
  },
];

export const BRANDS = [
  "Aria",
  "Novین",
  "TechPro",
  "Diako",
  "Parsan",
  "Maxon",
  "Elina",
  "Zenith",
  "Borna",
  "Kasra",
];

export const catById = (id: string) => CATEGORIES.find((c) => c.id === id);
