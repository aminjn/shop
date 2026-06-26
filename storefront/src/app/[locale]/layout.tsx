import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "../globals.css";
import { notFound } from "next/navigation";
import { isLocale, locales, dir } from "@/i18n/config";
import { getDict } from "@/i18n/dictionaries";
import { readStore } from "@/lib/settings";
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
  const name = store.storeName || t.storeName;
  const titleDefault = store.metaTitle || `${name} — ${store.tagline || t.heroTitle}`;
  const description = store.metaDescription || t.heroSub;
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"),
    title: { default: titleDefault, template: `%s | ${name}` },
    description,
    keywords: store.metaKeywords ? store.metaKeywords.split(/[,،]/).map((k) => k.trim()).filter(Boolean) : undefined,
    openGraph: {
      title: store.metaTitle || name,
      description,
      type: "website",
      ...(store.ogImage ? { images: [store.ogImage] } : {}),
    },
    alternates: { languages: { fa: "/fa", en: "/en" } },
    icons: {
      icon: store.faviconUrl || "/icons/icon-192.png",
      apple: "/icons/apple-touch-icon.png",
    },
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
    <html lang={locale} dir={dir(locale)} className={vazir.variable} suppressHydrationWarning>
      <body className="scrollthin pb-[calc(60px+env(safe-area-inset-bottom))] md:pb-0">
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
