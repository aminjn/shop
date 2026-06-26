import "server-only";
import { readArray, writeArray, hasFile } from "./settings";

export interface SitePage {
  slug: string;
  titleFa: string;
  titleEn: string;
  bodyFa: string;
  bodyEn: string;
  published: boolean;
  footerCol?: "support" | "company" | "";
}

export function pageSlug(s: string): string {
  return (s || "").trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 50);
}

const SEED: SitePage[] = [
  { slug: "about", titleFa: "درباره ما", titleEn: "About us", footerCol: "company", published: true,
    bodyFa: "## درباره ما\n\nاینجا دربارهٔ فروشگاه، تاریخچه و ماموریت خود بنویسید. این متن از پنل مدیریت قابل ویرایش است.",
    bodyEn: "## About us\n\nTell your store's story here. Editable from the admin panel." },
  { slug: "contact", titleFa: "تماس با ما", titleEn: "Contact us", footerCol: "support", published: true,
    bodyFa: "## تماس با ما\n\n- تلفن: \n- ایمیل: \n- آدرس: \n\nاین اطلاعات را از پنل مدیریت به‌روز کنید.",
    bodyEn: "## Contact us\n\n- Phone: \n- Email: \n- Address: " },
  { slug: "faq", titleFa: "سوالات متداول", titleEn: "FAQ", footerCol: "support", published: true,
    bodyFa: "## سوالات متداول\n\nپرسش‌ها و پاسخ‌های پرتکرار را اینجا بنویسید.",
    bodyEn: "## FAQ\n\nWrite frequently asked questions here." },
  { slug: "returns", titleFa: "بازگشت کالا", titleEn: "Returns", footerCol: "support", published: true,
    bodyFa: "## شرایط بازگشت کالا\n\nقوانین مرجوعی و بازگشت وجه را اینجا توضیح دهید.",
    bodyEn: "## Returns policy\n\nDescribe your return and refund terms here." },
  { slug: "shipping", titleFa: "نحوه ارسال", titleEn: "Shipping", footerCol: "support", published: true,
    bodyFa: "## نحوه ارسال\n\nروش‌ها، زمان و هزینهٔ ارسال را اینجا توضیح دهید.",
    bodyEn: "## Shipping\n\nExplain shipping methods, time and cost here." },
  { slug: "careers", titleFa: "فرصت‌های شغلی", titleEn: "Careers", footerCol: "company", published: true,
    bodyFa: "## فرصت‌های شغلی\n\nموقعیت‌های شغلی باز را اینجا اعلام کنید.",
    bodyEn: "## Careers\n\nList open positions here." },
  { slug: "terms", titleFa: "قوانین و مقررات", titleEn: "Terms", footerCol: "company", published: true,
    bodyFa: "## قوانین و مقررات\n\nشرایط استفاده از فروشگاه را اینجا بنویسید.",
    bodyEn: "## Terms & conditions\n\nWrite your store's terms here." },
  { slug: "privacy", titleFa: "حریم خصوصی", titleEn: "Privacy", footerCol: "company", published: true,
    bodyFa: "## حریم خصوصی\n\nسیاست حفظ حریم خصوصی و استفاده از داده‌ها را اینجا توضیح دهید.",
    bodyEn: "## Privacy policy\n\nDescribe your privacy and data policy here." },
];

export function getPages(): SitePage[] {
  if (!hasFile("pages.json")) { writeArray<SitePage>("pages.json", SEED); return SEED; }
  return readArray<SitePage>("pages.json", []);
}
export function savePages(list: SitePage[]): SitePage[] {
  return writeArray<SitePage>("pages.json", list);
}
export function getPage(slug: string): SitePage | undefined {
  return getPages().find((p) => p.slug === slug);
}
