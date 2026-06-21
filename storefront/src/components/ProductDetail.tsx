"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useShop } from "@/lib/store";
import { productById } from "@/data/products";
import { catById } from "@/data/categories";
import { related } from "@/lib/selectors";
import { grad, priceFmt, num } from "@/lib/format";
import { ProductCard } from "./ProductCard";
import { LocaleLink } from "./LocaleLink";
import { Sparkle, Heart, Play, Download, Plus, Minus, ArrowBack } from "./Icons";

export function ProductDetail({ id }: { id: number }) {
  const router = useRouter();
  const { locale, t, dark, addToCart, toggleWish, wishlist } = useShop();
  const p = productById(id);
  const [gallery, setGallery] = useState(0);
  const [color, setColor] = useState(0);
  const [size, setSize] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"desc" | "specs" | "reviews">("desc");

  if (!p) {
    return (
      <div className="mx-auto max-w-[1280px] px-[22px] py-20 text-center">
        <div className="text-[18px] font-bold">{t.noResults}</div>
        <LocaleLink href="/shop" className="mt-4 inline-block text-[14px] font-bold no-underline" style={{ color: "var(--accent)" }}>{t.backToShop}</LocaleLink>
      </div>
    );
  }

  const name = locale === "fa" ? p.fa : p.en;
  const cat = catById(p.cat);
  const disc = p.old ? Math.round((1 - p.price / p.old) * 100) : 0;
  const wished = wishlist.includes(p.id);
  const match = 88 + (p.id % 9);

  const specs =
    locale === "fa"
      ? [
          ["برند", p.brand],
          ["کشور سازنده", p.country],
          ["گارانتی", p.warranty],
          ["کد کالا", p.sku || `SKU-${1000 + p.id}`],
          ["وضعیت", p.stock > 0 ? "موجود" : "ناموجود"],
        ]
      : [
          ["Brand", p.brand],
          ["Origin", p.country],
          ["Warranty", p.warranty],
          ["SKU", p.sku || `SKU-${1000 + p.id}`],
          ["Status", p.stock > 0 ? "In stock" : "Out of stock"],
        ];

  return (
    <div className="mx-auto max-w-[1280px] px-[22px] py-7">
      {/* breadcrumb */}
      <div className="mb-5 flex items-center gap-2 text-[13px]" style={{ color: "var(--muted)" }}>
        <LocaleLink href="/" className="no-underline" style={{ color: "var(--muted)" }}>{t.navHome}</LocaleLink>
        <span>/</span>
        <LocaleLink href={`/shop?cat=${p.cat}`} className="no-underline" style={{ color: "var(--muted)" }}>{cat ? (locale === "fa" ? cat.fa : cat.en) : ""}</LocaleLink>
        <span>/</span>
        <span style={{ color: "var(--text)" }}>{name}</span>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* gallery */}
        <div>
          <div className="flex aspect-square items-center justify-center rounded-[18px] text-[90px] font-extrabold" style={{ background: grad(p.hue + gallery * 12, dark), color: "rgba(255,255,255,.5)" }}>{name.charAt(0)}</div>
          <div className="mt-3 flex gap-2.5">
            {[0, 1, 2, 3].map((i) => (
              <button key={i} onClick={() => setGallery(i)} className="h-[70px] w-[70px] cursor-pointer rounded-[12px]" style={{ background: grad(p.hue + i * 12, dark), border: gallery === i ? "2px solid var(--accent)" : "2px solid transparent" }} />
            ))}
          </div>
          <div className="mt-3 flex gap-2.5">
            <button className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[10px] py-2.5 text-[13px] font-bold" style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}><Play size={15} /> {t.watchVideo}</button>
            <button className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[10px] py-2.5 text-[13px] font-bold" style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}><Download size={15} /> {t.downloadCatalog}</button>
          </div>
        </div>

        {/* info */}
        <div>
          {p.badge && (
            <span className="inline-block rounded-full px-2.5 py-1 text-[11.5px] font-extrabold" style={{ background: "var(--text)", color: "var(--surface)" }}>{locale === "fa" ? p.badge[0] : p.badge[1]}</span>
          )}
          <h1 className="mt-2 text-[28px] font-extrabold leading-tight tracking-tight">{name}</h1>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-[16px]" style={{ color: "#f59e0b", letterSpacing: 2 }}>{"★★★★★".slice(0, Math.round(p.rating))}</span>
            <span className="text-[13px]" style={{ color: "var(--muted)" }}>{num(p.rating, locale)} ({num(p.reviews, locale)} {t.tabReviews})</span>
            <span className="text-[13px] font-bold" style={{ color: p.stock > 0 ? "#1f8a5b" : "#e11d48" }}>{p.stock > 0 ? t.inStock : t.outStock}</span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <span className="text-[30px] font-black" style={{ color: "var(--accent)" }}>{priceFmt(p.price, locale, t.currency)}</span>
            {p.old && <span className="text-[18px] line-through" style={{ color: "var(--muted)" }}>{num(p.old, locale)}</span>}
            {disc > 0 && <span className="rounded-md px-2 py-1 text-[12px] font-extrabold text-white" style={{ background: "#e11d48" }}>{num(disc, locale)}٪-</span>}
          </div>

          {/* AI box */}
          <div className="mt-5 rounded-[14px] p-4" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg text-white" style={{ background: "var(--accent)" }}><Sparkle size={15} /></span>
              <span className="text-[14px] font-extrabold">{t.pdpAiTitle}</span>
              <span className="ms-auto rounded-full px-2.5 py-1 text-[11.5px] font-extrabold text-white" style={{ background: "var(--accent)" }}>✨ {num(match, locale)}٪ {t.aiMatchWord}</span>
            </div>
            <p className="mt-2.5 text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>{t.pdpAiVerdict}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[t.pdpAiQ1, t.pdpAiQ2, t.pdpAiQ3].map((q) => (
                <span key={q} className="rounded-full px-3 py-1.5 text-[12px] font-semibold" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>{q}</span>
              ))}
            </div>
          </div>

          {/* variations */}
          {p.colors && (
            <div className="mt-5">
              <div className="mb-2 text-[13.5px] font-bold">{t.colorLabel}: {locale === "fa" ? p.colors[color][0] : p.colors[color][0]}</div>
              <div className="flex gap-2">
                {p.colors.map(([n, hex], i) => (
                  <button key={n} onClick={() => setColor(i)} title={n} className="h-9 w-9 cursor-pointer rounded-full" style={{ background: hex, border: color === i ? "2px solid var(--accent)" : "2px solid var(--border)", outline: color === i ? "2px solid var(--accent)" : "none", outlineOffset: 2 }} />
                ))}
              </div>
            </div>
          )}
          {p.sizes && (
            <div className="mt-4">
              <div className="mb-2 text-[13.5px] font-bold">{t.sizeLabel}</div>
              <div className="flex gap-2">
                {p.sizes.map((sz, i) => (
                  <button key={sz} onClick={() => setSize(i)} className="min-w-[44px] cursor-pointer rounded-[10px] px-3 py-2 text-[14px] font-bold" style={{ background: size === i ? "var(--accent)" : "var(--surface2)", color: size === i ? "#fff" : "var(--text)", border: "1px solid var(--border)" }}>{sz}</button>
                ))}
              </div>
            </div>
          )}

          {/* qty + actions */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 rounded-[12px] px-2 py-1.5" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-none" style={{ background: "var(--surface)", color: "var(--text)" }}><Minus size={16} /></button>
              <span className="min-w-[24px] text-center text-[15px] font-bold">{num(qty, locale)}</span>
              <button onClick={() => setQty((q) => q + 1)} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-none" style={{ background: "var(--surface)", color: "var(--text)" }}><Plus size={16} /></button>
            </div>
            <button onClick={() => addToCart(p.id, qty, color, size)} className="flex-1 cursor-pointer rounded-[12px] border-none px-6 py-3.5 text-[15px] font-extrabold text-white" style={{ background: "var(--accent)" }}>{t.addToCart}</button>
            <button onClick={() => { addToCart(p.id, qty, color, size); router.push(`/${locale}/cart`); }} className="cursor-pointer rounded-[12px] px-6 py-3.5 text-[15px] font-extrabold" style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}>{t.buyNow}</button>
            <button onClick={() => toggleWish(p.id)} aria-label={t.addToWishlist} className="flex h-[50px] w-[50px] cursor-pointer items-center justify-center rounded-[12px]" style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: wished ? "#e11d48" : "var(--muted)" }}><Heart size={20} fill={wished ? "#e11d48" : "none"} /></button>
          </div>

          {/* quick specs */}
          <div className="mt-6 grid grid-cols-2 gap-2.5">
            {specs.slice(0, 4).map(([k, v]) => (
              <div key={k} className="rounded-[10px] p-3 text-[13px]" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <span style={{ color: "var(--muted)" }}>{k}: </span>
                <span className="font-bold">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* tabs */}
      <div className="mt-10">
        <div className="flex gap-1.5" style={{ borderBottom: "1px solid var(--border)" }}>
          {([["desc", t.tabDesc], ["specs", t.tabSpecs], ["reviews", t.tabReviews]] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className="cursor-pointer border-none bg-transparent px-4 py-3 text-[14.5px] font-bold" style={{ color: tab === id ? "var(--accent)" : "var(--muted)", borderBottom: tab === id ? "2px solid var(--accent)" : "2px solid transparent" }}>{label}</button>
          ))}
        </div>
        <div className="py-5">
          {tab === "desc" && (
            <p className="max-w-[760px] text-[14.5px] leading-loose" style={{ color: "var(--muted)" }}>
              {locale === "fa"
                ? `${name} یکی از محصولات محبوب برند ${p.brand} است که با کیفیت ساخت بالا و طراحی مدرن عرضه می‌شود. این محصول ساخت کشور ${p.country} بوده و دارای ${p.warranty} گارانتی معتبر است. مناسب برای استفاده‌ی روزمره با دوام و عملکرد عالی.`
                : `${name} is one of ${p.brand}'s popular products, featuring premium build quality and a modern design. Made in ${p.country} with a valid ${p.warranty} warranty. Ideal for everyday use with great durability and performance.`}
            </p>
          )}
          {tab === "specs" && (
            <div className="max-w-[600px] overflow-hidden rounded-[12px]" style={{ border: "1px solid var(--border)" }}>
              {specs.map(([k, v], i) => (
                <div key={k} className="flex justify-between px-4 py-3 text-[14px]" style={{ background: i % 2 ? "var(--surface)" : "var(--surface2)" }}>
                  <span style={{ color: "var(--muted)" }}>{k}</span>
                  <span className="font-bold">{v}</span>
                </div>
              ))}
            </div>
          )}
          {tab === "reviews" && (
            <div className="text-[14px]" style={{ color: "var(--muted)" }}>
              {locale === "fa" ? `${num(p.reviews, locale)} نظر ثبت‌شده با میانگین امتیاز ${num(p.rating, locale)} از ۵.` : `${num(p.reviews, locale)} reviews with an average rating of ${num(p.rating, locale)} / 5.`}
            </div>
          )}
        </div>
      </div>

      {/* related */}
      <div className="mt-8">
        <h2 className="mb-[18px] text-[22px] font-extrabold tracking-tight">{t.relatedTitle}</h2>
        <div className="grid grid-cols-2 gap-[18px] md:grid-cols-4">
          {related(p).map((rp) => (
            <ProductCard key={rp.id} p={rp} />
          ))}
        </div>
      </div>

      <LocaleLink href="/shop" className="mt-8 inline-flex items-center gap-2 text-[14px] font-bold no-underline" style={{ color: "var(--accent)" }}>
        <ArrowBack size={16} /> {t.backToShop}
      </LocaleLink>
    </div>
  );
}
