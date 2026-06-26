import "server-only";
import fs from "node:fs";
import path from "node:path";
import { hasFile } from "./settings";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const FILE = "home.json";

export interface BiText { fa: string; en: string }
export interface HomeFeature { icon: string; fa: string; faSub: string; en: string; enSub: string }
export interface HomeTestimonial { fa: string; faText: string; en: string; enText: string; rating: number }
export interface HomeFaq { qFa: string; aFa: string; qEn: string; aEn: string }

export interface HomeContent {
  // dictionary-overridable texts — empty means "use the built-in translation"
  heroBadge: BiText; heroTitle: BiText; heroSub: BiText;
  bannerBadge: BiText; bannerTitle: BiText; bannerSub: BiText; bannerCta: BiText; bannerCta2: BiText;
  promoATag: BiText; promoATitle: BiText;
  promoBTag: BiText; promoBTitle: BiText;
  titleSmartPicks: BiText; titleShopByCat: BiText; titleBrands: BiText; titleTestimonials: BiText; titleFaq: BiText;
  // link targets for the banner CTA and promo cards
  bannerCtaHref: string; promoAHref: string; promoBHref: string;
  // colors (HSL hue 0–360; <0 means "use default")
  heroHue: number; bannerHue: number; promoAHue: number;
  // blocks with real defaults (currently hardcoded on the page)
  examples: BiText[];
  features: HomeFeature[];
  testimonials: HomeTestimonial[];
  faqs: HomeFaq[];
}

const empty = (): BiText => ({ fa: "", en: "" });

export const HOME_DEFAULT: HomeContent = {
  heroBadge: empty(), heroTitle: empty(), heroSub: empty(),
  bannerBadge: empty(), bannerTitle: empty(), bannerSub: empty(), bannerCta: empty(), bannerCta2: empty(),
  promoATag: empty(), promoATitle: empty(),
  promoBTag: empty(), promoBTitle: empty(),
  titleSmartPicks: empty(), titleShopByCat: empty(), titleBrands: empty(), titleTestimonials: empty(), titleFaq: empty(),
  bannerCtaHref: "/shop", promoAHref: "/shop", promoBHref: "/shop",
  heroHue: -1, bannerHue: -1, promoAHue: -1,
  examples: [
    { fa: "یک گوشی تا ۲۰ میلیون", en: "A phone under 20M" },
    { fa: "برای پوست خشک چی خوبه؟", en: "Best for dry skin?" },
    { fa: "لپ‌تاپ برای برنامه‌نویسی", en: "Laptop for coding" },
    { fa: "هدفون نویزکنسلینگ", en: "Noise-cancelling headphones" },
  ],
  features: [
    { icon: "🚚", fa: "ارسال سریع", faSub: "تحویل ۲۴ ساعته", en: "Fast shipping", enSub: "24h delivery" },
    { icon: "🛡️", fa: "ضمانت اصالت", faSub: "۱۰۰٪ کالای اصل", en: "Authenticity", enSub: "100% genuine" },
    { icon: "↩️", fa: "بازگشت آسان", faSub: "۷ روز مهلت", en: "Easy returns", enSub: "7-day window" },
    { icon: "💬", fa: "پشتیبانی ۲۴/۷", faSub: "همیشه در دسترس", en: "24/7 support", enSub: "Always available" },
  ],
  // empty by default — the store owner adds real customer reviews from the editor
  testimonials: [],
  faqs: [
    { qFa: "چطور سفارش ثبت کنم؟", aFa: "محصول را به سبد اضافه کنید و مراحل تسویه را تکمیل کنید؛ پرداخت آنلاین، کیف پول یا پرداخت در محل.", qEn: "How do I place an order?", aEn: "Add to cart and complete checkout — pay online, by wallet or cash on delivery." },
    { qFa: "زمان ارسال چقدر است؟", aFa: "ارسال عادی ۳ تا ۵ روز کاری و ارسال اکسپرس طی ۲۴ ساعت انجام می‌شود.", qEn: "How long is delivery?", aEn: "Standard takes 3–5 business days, express within 24 hours." },
    { qFa: "امکان بازگشت کالا وجود دارد؟", aFa: "بله، تا ۷ روز پس از دریافت می‌توانید کالا را مرجوع کنید.", qEn: "Can I return items?", aEn: "Yes, you can return within 7 days of delivery." },
    { qFa: "گارانتی محصولات چگونه است؟", aFa: "تمام محصولات دارای ضمانت اصالت و گارانتی معتبر شرکتی هستند.", qEn: "What about warranty?", aEn: "All products come with authenticity and valid manufacturer warranty." },
  ],
};

export function getHome(): HomeContent {
  if (!hasFile(FILE)) {
    writeHome(HOME_DEFAULT);
    return HOME_DEFAULT;
  }
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, FILE), "utf8"));
    // merge over defaults so newly-added fields are always present
    return { ...HOME_DEFAULT, ...(raw && typeof raw === "object" ? raw : {}) };
  } catch {
    return HOME_DEFAULT;
  }
}

export function writeHome(c: HomeContent): HomeContent {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, FILE), JSON.stringify(c, null, 2), "utf8");
  return c;
}
