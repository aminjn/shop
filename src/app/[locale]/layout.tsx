import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "../globals.css";
import { notFound } from "next/navigation";
import { isLocale, locales, dir } from "@/i18n/config";
import { getDict } from "@/i18n/dictionaries";
import type { Locale } from "@/lib/types";
import { ShopProvider } from "@/lib/store";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FloatingChat } from "@/components/FloatingChat";
import { Toast } from "@/components/Toast";
import { Onboarding } from "@/components/Onboarding";

const vazir = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazir",
  display: "swap",
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
  const t = getDict((isLocale(locale) ? locale : "fa") as Locale);
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"),
    title: {
      default: `${t.storeName} — ${t.heroTitle}`,
      template: `%s | ${t.storeName}`,
    },
    description: t.heroSub,
    openGraph: {
      title: t.storeName,
      description: t.heroSub,
      type: "website",
    },
    alternates: {
      languages: { fa: "/fa", en: "/en" },
    },
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
      <body className="scrollthin">
        <ShopProvider locale={locale}>
          <Header />
          <main style={{ minHeight: "60vh" }}>{children}</main>
          <Footer />
          <FloatingChat />
          <Toast />
          <Onboarding />
        </ShopProvider>
      </body>
    </html>
  );
}
