import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "../globals.css";
import { notFound } from "next/navigation";
import { isLocale, locales, dir } from "@/i18n/config";
import { getDict } from "@/i18n/dictionaries";
import { readStore } from "@/lib/settings";
import { getSeo, siteOrigin } from "@/lib/seo";
import { SeoClient } from "@/components/SeoClient";
import type { Locale } from "@/lib/types";
import { ShopProvider } from "@/lib/store";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FloatingChat } from "@/components/FloatingChat";
import { Toast } from "@/components/Toast";
import { Onboarding } from "@/components/Onboarding";
import { MobileNav, PwaInstall } from "@/components/Mobile";

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const vazir = localFont({
  src: "../fonts/Vazirmatn.woff2",
  variable: "--font-vazir",
  display: "swap",
  weight: "100 900",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const loc = (isLocale(locale) ? locale : "fa") as Locale;
  const t = getDict(loc);
  const store = readStore();
  const seo = getSeo();
  const name = store.storeName || t.storeName;
  const titleDefault = seo.defaultTitle || store.metaTitle || `${name} — ${store.tagline || t.heroTitle}`;
  const template = seo.titleTemplate && seo.titleTemplate.includes("%s") ? seo.titleTemplate : `%s | ${name}`;
  const description = seo.defaultDescription || store.metaDescription || t.heroSub;
  const keywords = (seo.keywords || store.metaKeywords || "").split(/[,،\n]/).map((k) => k.trim()).filter(Boolean);
  const ogImg = seo.ogImage || store.ogImage;
  const origin = siteOrigin();
  return {
    metadataBase: new URL(origin),
    title: { default: titleDefault, template },
    description,
    keywords: keywords.length ? keywords : undefined,
    robots: seo.noindex ? { index: false, follow: false } : { index: true, follow: true },
    alternates: { canonical: `/${loc}`, languages: { fa: "/fa", en: "/en" } },
    openGraph: {
      siteName: name,
      title: titleDefault,
      description,
      type: "website",
      url: `${origin}/${loc}`,
      ...(ogImg ? { images: [ogImg] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: titleDefault,
      description,
      ...(seo.twitterHandle ? { site: seo.twitterHandle, creator: seo.twitterHandle } : {}),
      ...(ogImg ? { images: [ogImg] } : {}),
    },
    verification: {
      ...(seo.googleVerification ? { google: seo.googleVerification } : {}),
      ...(seo.bingVerification ? { other: { "msvalidate.01": seo.bingVerification } } : {}),
    },
    icons: {
      icon: store.faviconUrl || "/icons/icon-192.png",
      apple: "/icons/apple-touch-icon.png",
    },
    // Opt out of browser auto-translation, which rewrites text nodes and crashes
    // React with "removeChild of null" during navigation.
    other: { google: "notranslate" },
    appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: name },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={locale} dir={dir(locale)} translate="no" className={vazir.variable} suppressHydrationWarning>
      <body className="scrollthin pb-[calc(60px+env(safe-area-inset-bottom))] md:pb-0">
        <SeoClient origin={siteOrigin()} />
        <ShopProvider locale={locale}>
          <Header />
          <main style={{ minHeight: "60vh" }}>{children}</main>
          <Footer />
          <FloatingChat />
          <Toast />
          <Onboarding />
          <MobileNav />
          <PwaInstall />
        </ShopProvider>
      </body>
    </html>
  );
}
