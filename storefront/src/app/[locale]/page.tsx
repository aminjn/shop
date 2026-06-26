"use client";

import { useState } from "react";
import { useShop } from "@/lib/store";
import { CATEGORIES } from "@/data/categories";
import {
  featured,
  newest,
  bestSellers,
  onSale,
  smartPicks,
  dealOfDay,
  topBrands,
} from "@/lib/selectors";
import { grad, priceFmt, num } from "@/lib/format";
import { ProductCard } from "@/components/ProductCard";
import { AiSearchBox } from "@/components/AiSearchBox";
import { Countdown } from "@/components/Countdown";
import { LocaleLink } from "@/components/LocaleLink";
import { Sparkle } from "@/components/Icons";

const SECTION = "mx-auto max-w-[1280px] px-[22px]";

export default function HomePage() {
  const { locale, t, dark, addToCart, setChatOpen, products, brands, home } = useShop();
  const [tab, setTab] = useState<"featured" | "new" | "best" | "deal">("featured");
  const L = locale === "fa";
  // pick admin-edited bilingual text, falling back to the built-in translation
  const tx = (b: { fa: string; en: string } | undefined, fallback: string) => {
    const v = b ? (L ? b.fa : b.en) : "";
    return v && v.trim() ? v : fallback;
  };
  const hue = (h: number | undefined, def: number) => (typeof h === "number" && h >= 0 ? h : def);

  const deal = dealOfDay(products);
  const dealName = deal ? (locale === "fa" ? deal.fa : deal.en) : "";
  const dealCat = deal ? CATEGORIES.find((c) => c.id === deal.cat) : undefined;

  const picks = smartPicks(products);
  const reasons =
    locale === "fa"
      ? ["چون قبلاً محصول مشابه دیدی", "چون کاربران مشابه انتخاب کرده‌اند", "پرتکرار در سبد خریدها", "متناسب با سلیقه‌ی تو"]
      : ["Because you viewed similar items", "Chosen by shoppers like you", "Frequently bought together", "Matches your taste"];
  const matches = [96, 93, 91, 89];

  const tabs = [
    { id: "featured" as const, label: t.tabFeatured, items: featured(products) },
    { id: "new" as const, label: t.tabNew, items: newest(products) },
    { id: "best" as const, label: t.tabBest, items: bestSellers(products) },
    { id: "deal" as const, label: t.tabDeal, items: onSale(products) },
  ];
  const active = tabs.find((x) => x.id === tab)!;

  // example chips, trust badges, FAQ and testimonials are all admin-editable
  const examples =
    home?.examples?.length
      ? home.examples.map((e) => (L ? e.fa : e.en)).filter(Boolean)
      : L
        ? ["یک گوشی تا ۲۰ میلیون", "برای پوست خشک چی خوبه؟", "لپ‌تاپ برای برنامه‌نویسی", "هدفون نویزکنسلینگ"]
        : ["A phone under 20M", "Best for dry skin?", "Laptop for coding", "Noise-cancelling headphones"];

  const trust: [string, string, string][] =
    home?.features?.length
      ? home.features.map((f) => [f.icon, L ? f.fa : f.en, L ? f.faSub : f.enSub] as [string, string, string])
      : L
        ? [["🚚", "ارسال سریع", "تحویل ۲۴ ساعته"], ["🛡️", "ضمانت اصالت", "۱۰۰٪ کالای اصل"], ["↩️", "بازگشت آسان", "۷ روز مهلت"], ["💬", "پشتیبانی ۲۴/۷", "همیشه در دسترس"]]
        : [["🚚", "Fast shipping", "24h delivery"], ["🛡️", "Authenticity", "100% genuine"], ["↩️", "Easy returns", "7-day window"], ["💬", "24/7 support", "Always available"]];

  const faqs: [string, string][] =
    home?.faqs?.length
      ? home.faqs.map((f) => [L ? f.qFa : f.qEn, L ? f.aFa : f.aEn] as [string, string])
      : L
        ? [["چطور سفارش ثبت کنم؟", "محصول را به سبد اضافه کنید و مراحل تسویه را تکمیل کنید؛ پرداخت آنلاین، کیف پول یا پرداخت در محل."], ["زمان ارسال چقدر است؟", "ارسال عادی ۳ تا ۵ روز کاری و ارسال اکسپرس طی ۲۴ ساعت انجام می‌شود."], ["امکان بازگشت کالا وجود دارد؟", "بله، تا ۷ روز پس از دریافت می‌توانید کالا را مرجوع کنید."], ["گارانتی محصولات چگونه است؟", "تمام محصولات دارای ضمانت اصالت و گارانتی معتبر شرکتی هستند."]]
        : [["How do I place an order?", "Add to cart and complete checkout — pay online, by wallet or cash on delivery."], ["How long is delivery?", "Standard takes 3–5 business days, express within 24 hours."], ["Can I return items?", "Yes, you can return within 7 days of delivery."], ["What about warranty?", "All products come with authenticity and valid manufacturer warranty."]];
  const [openFaq, setOpenFaq] = useState(0);

  const testimonials: [string, string, number][] =
    home?.testimonials?.length
      ? home.testimonials.map((tm) => [L ? tm.fa : tm.en, L ? tm.faText : tm.enText, tm.rating] as [string, string, number])
      : L
        ? [["سارا محمدی", "خرید فوق‌العاده‌ای بود، ارسال سریع و بسته‌بندی عالی.", 5], ["علی رضایی", "کیفیت محصولات واقعاً بالاست و قیمت‌ها منصفانه است.", 5], ["مریم کریمی", "پشتیبانی خیلی خوب جواب داد و مشکلم سریع حل شد.", 4]]
        : [["Sara M.", "Amazing purchase, fast shipping and great packaging.", 5], ["Ali R.", "Product quality is truly high and prices are fair.", 5], ["Maryam K.", "Support replied quickly and solved my issue fast.", 4]];

  return (
    <>
      {/* AI Landing hero */}
      <section className={`${SECTION} pt-6`}>
        <div className="relative overflow-hidden rounded-[22px] px-10 py-[38px] text-white" style={{ background: grad(hue(home?.heroHue, 255), dark) }}>
          <div className="relative z-[2] max-w-[760px]">
            <span className="inline-flex items-center gap-2 rounded-[30px] px-[15px] py-[7px] text-[13px] font-extrabold" style={{ background: "rgba(255,255,255,.2)", backdropFilter: "blur(6px)" }}>
              🤖 {tx(home?.heroBadge, t.aiSystemBadge)}
            </span>
            <h1 className="mt-4 text-[38px] font-black leading-tight tracking-tight">{tx(home?.heroTitle, t.aiHeroTitle)}</h1>
            <p className="mb-5 mt-3 text-[16px] leading-relaxed opacity-90">{tx(home?.heroSub, t.aiHeroSub)}</p>
            <AiSearchBox examples={examples} />
          </div>
          <div className="absolute h-[300px] w-[300px] rounded-full" style={{ insetInlineEnd: -50, bottom: -70, background: "rgba(255,255,255,.1)" }} />
        </div>
      </section>

      {/* Smart Picks */}
      <section className={`${SECTION} pt-8`}>
        <div className="flex items-center gap-3">
          <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[10px] text-white" style={{ background: grad(255, dark) }}>
            <Sparkle size={18} />
          </span>
          <div>
            <h2 className="text-[22px] font-extrabold tracking-tight">{tx(home?.titleSmartPicks, t.smartPicksTitle)}</h2>
            <div className="mt-0.5 text-[13px]" style={{ color: "var(--muted)" }}>{t.smartPicksSub}</div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-[18px] md:grid-cols-4">
          {picks.map((p, i) => (
            <ProductCard key={p.id} p={p} aiMatch={matches[i]} reason={reasons[i]} />
          ))}
        </div>
      </section>

      {/* Hero banner + promo cards */}
      <section className={`${SECTION} py-6`}>
        <div className="grid gap-[18px] md:grid-cols-[2fr_1fr]">
          <div className="relative flex min-h-[380px] items-center overflow-hidden rounded-[22px]" style={{ background: grad(hue(home?.bannerHue, 255), dark) }}>
            <div className="relative z-[2] max-w-[540px] p-12 text-white">
              <span className="inline-block rounded-[30px] px-3.5 py-[7px] text-[12.5px] font-bold" style={{ background: "rgba(255,255,255,.2)", backdropFilter: "blur(6px)" }}>{tx(home?.bannerBadge, t.heroBadge)}</span>
              <h2 className="mt-4 text-[46px] font-black leading-[1.12] tracking-tight">{tx(home?.bannerTitle, t.heroTitle)}</h2>
              <p className="mt-4 max-w-[420px] text-[16.5px] leading-relaxed opacity-90">{tx(home?.bannerSub, t.heroSub)}</p>
              <div className="mt-6 flex gap-3">
                <LocaleLink href="/shop" className="rounded-[12px] bg-white px-[26px] py-3.5 text-[15px] font-extrabold no-underline" style={{ color: "#111" }}>{tx(home?.bannerCta, t.heroCta)}</LocaleLink>
                <button onClick={() => setChatOpen(true)} className="inline-flex cursor-pointer items-center gap-2 rounded-[12px] px-[22px] py-3.5 text-[15px] font-bold text-white" style={{ background: "rgba(255,255,255,.16)", border: "1.5px solid rgba(255,255,255,.4)" }}>
                  <Sparkle size={17} />
                  {tx(home?.bannerCta2, t.heroCta2)}
                </button>
              </div>
            </div>
            <div className="absolute h-[340px] w-[340px] rounded-full" style={{ insetInlineEnd: -60, bottom: -60, background: "rgba(255,255,255,.12)" }} />
          </div>
          <div className="flex flex-col gap-[18px]">
            <LocaleLink href="/shop" className="flex flex-1 cursor-pointer flex-col justify-center rounded-[18px] p-[26px] text-white no-underline" style={{ background: grad(hue(home?.promoAHue, 28), dark) }}>
              <div className="text-[12.5px] font-bold opacity-85">{tx(home?.promoATag, t.promoCardTagA)}</div>
              <div className="mt-1.5 text-[24px] font-extrabold leading-tight">{tx(home?.promoATitle, t.promoCardA)}</div>
              <span className="mt-3 text-[13px] font-bold underline">{t.shopNow}</span>
            </LocaleLink>
            <LocaleLink href="/shop" className="flex flex-1 cursor-pointer flex-col justify-center rounded-[18px] p-[26px] no-underline" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="text-[12.5px] font-bold" style={{ color: "var(--accent)" }}>{tx(home?.promoBTag, t.promoCardTagB)}</div>
              <div className="mt-1.5 text-[24px] font-extrabold leading-tight" style={{ color: "var(--text)" }}>{tx(home?.promoBTitle, t.promoCardB)}</div>
              <span className="mt-3 text-[13px] font-bold underline" style={{ color: "var(--accent)" }}>{t.shopNow}</span>
            </LocaleLink>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className={`${SECTION} py-2`}>
        <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
          {trust.map(([icon, title, sub]) => (
            <div key={title} className="flex items-center gap-3.5 rounded-[14px] p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <span className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[11px] text-[20px]" style={{ background: "var(--surface2)" }}>{icon}</span>
              <span>
                <span className="block text-[14px] font-bold">{title}</span>
                <span className="block text-[12.5px]" style={{ color: "var(--muted)" }}>{sub}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className={`${SECTION} py-6`}>
        <div className="mb-[18px] flex items-baseline justify-between">
          <h2 className="text-[24px] font-extrabold tracking-tight">{tx(home?.titleShopByCat, t.shopByCat)}</h2>
          <LocaleLink href="/shop" className="text-[14px] font-bold no-underline" style={{ color: "var(--accent)" }}>{t.viewAll}</LocaleLink>
        </div>
        <div className="grid grid-cols-2 gap-3.5 md:grid-cols-5">
          {CATEGORIES.map((c) => {
            const count = products.filter((p) => p.cat === c.id).length;
            return (
              <LocaleLink key={c.id} href={`/shop?cat=${c.id}`} className="lift flex flex-col items-center gap-2.5 rounded-[16px] px-4 py-6 text-center text-white no-underline transition" style={{ background: grad(c.hue, dark) }}>
                <span className="flex h-[54px] w-[54px] items-center justify-center rounded-full text-[22px] font-extrabold" style={{ background: "rgba(255,255,255,.22)" }}>{(locale === "fa" ? c.fa : c.en).charAt(0)}</span>
                <span className="text-[14.5px] font-bold">{locale === "fa" ? c.fa : c.en}</span>
                <span className="text-[12px] opacity-85">{num(count, locale)} {t.resultsCount}</span>
              </LocaleLink>
            );
          })}
        </div>
      </section>

      {/* Deal of the day */}
      {deal && (
      <section className={`${SECTION} py-3`}>
        <div className="grid overflow-hidden rounded-[22px] md:grid-cols-[300px_1fr]" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="flex flex-col justify-center p-6 text-white md:p-[34px]" style={{ background: grad(deal.hue, dark) }}>
            <span className="text-[13px] font-extrabold uppercase tracking-widest opacity-90">{t.dealOfDay}</span>
            <div className="mb-1 mt-2.5 text-[28px] font-black leading-tight">{dealName}</div>
            <div className="text-[14px] opacity-85">{t.endsIn}</div>
            <Countdown />
            <LocaleLink href={`/product/${deal.id}`} className="mt-5 self-start rounded-[11px] bg-white px-[22px] py-3 text-[14px] font-extrabold no-underline" style={{ color: "#111" }}>{t.grabDeal}</LocaleLink>
          </div>
          <div className="flex flex-col items-stretch gap-4 p-5 sm:flex-row sm:items-center sm:gap-7 sm:p-7">
            <LocaleLink href={`/product/${deal.id}`} className="flex h-[170px] w-full flex-none items-center justify-center rounded-[18px] text-[64px] font-extrabold no-underline sm:h-[230px] sm:w-[230px]" style={{ background: grad(deal.hue, dark), color: "rgba(255,255,255,.55)" }}>{dealName.charAt(0)}</LocaleLink>
            <div>
              <div className="text-[13px] font-bold" style={{ color: "var(--accent)" }}>{dealCat ? (locale === "fa" ? dealCat.fa : dealCat.en) : ""}</div>
              <div className="my-1.5 text-[22px] font-extrabold tracking-tight">{dealName}</div>
              <div className="text-[17px]" style={{ color: "#f59e0b", letterSpacing: 2 }}>{"★★★★★".slice(0, Math.round(deal.rating))} <span className="text-[13px]" style={{ color: "var(--muted)" }}>({num(deal.reviews, locale)})</span></div>
              <div className="mt-3.5 flex items-center gap-3">
                <span className="text-[28px] font-black" style={{ color: "var(--accent)" }}>{priceFmt(deal.price, locale, t.currency)}</span>
                {deal.old && <span className="text-[16px] line-through" style={{ color: "var(--muted)" }}>{num(deal.old, locale)}</span>}
              </div>
              <button onClick={() => addToCart(deal.id)} className="mt-[18px] cursor-pointer rounded-[11px] border-none px-7 py-3 text-[14.5px] font-bold text-white" style={{ background: "var(--accent)" }}>{t.addToCart}</button>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Product tabs */}
      <section className={`${SECTION} py-3`}>
        <div className="scrollthin mb-5 flex gap-1.5 overflow-auto" style={{ borderBottom: "1px solid var(--border)" }}>
          {tabs.map((tb) => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className="cursor-pointer whitespace-nowrap border-none bg-transparent px-4 py-3 text-[14.5px] font-bold"
              style={{
                color: tab === tb.id ? "var(--accent)" : "var(--muted)",
                borderBottom: tab === tb.id ? "2px solid var(--accent)" : "2px solid transparent",
              }}
            >
              {tb.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-[18px] md:grid-cols-4">
          {active.items.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </section>

      {/* Brands marquee — managed brands (with logos); falls back to brands derived from products */}
      {(() => {
        const managed = brands.filter((b) => b.featured !== false);
        const cards = managed.length
          ? managed.map((b) => ({ key: b.id, label: b.name, brand: b.name, logo: b.logo, url: b.url }))
          : topBrands(products).map((b) => ({ key: b, label: b, brand: b, logo: undefined as string | undefined, url: undefined as string | undefined }));
        if (!cards.length) return null;
        const cardCls = "row-hover flex min-w-0 flex-col items-center justify-center gap-2 rounded-[14px] px-2 py-6 no-underline";
        const cardStyle = { background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" } as const;
        const inner = (b: (typeof cards)[number]) =>
          b.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.logo} alt={b.label} title={b.label} className="h-10 w-full max-w-[130px] object-contain" />
          ) : (
            <span className="truncate max-w-full text-center text-[17px] font-extrabold">{b.label}</span>
          );
        return (
          <section className={`${SECTION} py-6`}>
            <h2 className="mb-[18px] text-[24px] font-extrabold tracking-tight">{tx(home?.titleBrands, t.popularBrands)}</h2>
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-5">
              {cards.map((b) =>
                b.url ? (
                  <a key={b.key} href={b.url} target="_blank" rel="noopener noreferrer nofollow" className={cardCls} style={cardStyle}>
                    {inner(b)}
                  </a>
                ) : (
                  <LocaleLink key={b.key} href={`/shop?brand=${encodeURIComponent(b.brand)}`} className={cardCls} style={cardStyle}>
                    {inner(b)}
                  </LocaleLink>
                ),
              )}
            </div>
          </section>
        );
      })()}

      {/* Testimonials */}
      <section className={`${SECTION} py-6`}>
        <h2 className="mb-[18px] text-[24px] font-extrabold tracking-tight">{tx(home?.titleTestimonials, t.testimonials)}</h2>
        <div className="grid gap-[18px] md:grid-cols-3">
          {testimonials.map(([name, text, rate]) => (
            <div key={name as string} className="rounded-[16px] p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="text-[16px]" style={{ color: "#f59e0b", letterSpacing: 2 }}>{"★★★★★".slice(0, rate as number)}</div>
              <p className="my-3 text-[14px] leading-relaxed">{text}</p>
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full font-bold text-white" style={{ background: "var(--accent)" }}>{(name as string).charAt(0)}</span>
                <span className="text-[13.5px] font-bold">{name}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className={`${SECTION} pb-10 pt-3`}>
        <h2 className="mb-[18px] text-[24px] font-extrabold tracking-tight">{tx(home?.titleFaq, t.faqTitle)}</h2>
        <div className="flex flex-col gap-2.5">
          {faqs.map(([q, a], i) => (
            <div key={q} className="overflow-hidden rounded-[14px]" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)} className="flex w-full cursor-pointer items-center justify-between border-none bg-transparent p-4 text-[15px] font-bold" style={{ color: "var(--text)", textAlign: "start" }}>
                {q}
                <span style={{ color: "var(--accent)" }}>{openFaq === i ? "−" : "+"}</span>
              </button>
              {openFaq === i && <div className="px-4 pb-4 text-[14px] leading-relaxed" style={{ color: "var(--muted)" }}>{a}</div>}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
