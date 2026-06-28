"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useShop } from "@/lib/store";
import { catById } from "@/data/categories";
import { related } from "@/lib/selectors";
import { grad, priceFmt, num, isPerCm, perCmNote, hasVariations, totalStock, productBrands, productBrandList, isBrandPriced, priceFor } from "@/lib/format";
import { ProductCard } from "./ProductCard";
import { ProductReviews } from "./ProductReviews";
import { LocaleLink } from "./LocaleLink";
import { Heart, Play, Download, Plus, Minus, ArrowBack } from "./Icons";

export function ProductDetail({ id }: { id: number }) {
  const router = useRouter();
  const { locale, t, dark, addToCart, toggleWish, wishlist, products, productById } = useShop();
  const p = productById(id);
  const [gallery, setGallery] = useState(0);
  const [color, setColor] = useState(0);
  const [size, setSize] = useState(0);
  const [variant, setVariant] = useState(0);
  const [brandIdx, setBrandIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"desc" | "specs" | "reviews">("desc");
  const [showVideo, setShowVideo] = useState(false);
  // pack/carton products start at one full carton
  const packInit = p?.packSize && p.packSize > 1 ? p.packSize : 1;
  useEffect(() => { setQty(packInit); }, [packInit]);

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
  const pack = p.packSize && p.packSize > 1 ? p.packSize : 1; // units per carton (1 = normal)
  const cartons = Math.max(1, Math.round(qty / pack));
  const variations = p.variations ?? [];
  const brandList = productBrandList(p);
  const brandPriced = isBrandPriced(p);
  // price: brand price if brand-priced, else variant price, else unit price
  const price = priceFor(p, { variant, brandIdx });
  // stock: the chosen variant's stock when variants exist, else the product's
  const stock = hasVariations(p) ? (variations[variant]?.stock ?? 0) : p.stock;
  const disc = p.old ? Math.round((1 - p.price / p.old) * 100) : 0;
  const wished = wishlist.includes(p.id);

  const hasWarranty = !!p.warranty && p.warranty.trim() !== "" && p.warranty.trim() !== "-";
  const base: ([string, string] | null)[] =
    locale === "fa"
      ? [
          [productBrands(p).length > 1 ? "برندها" : "برند", productBrands(p).join("، ")],
          p.country ? ["کشور سازنده", p.country] : null,
          hasWarranty ? ["گارانتی", p.warranty] : null,
          ["کد کالا", p.sku || `SKU-${1000 + p.id}`],
          ["وضعیت", stock > 0 ? "موجود" : "ناموجود"],
        ]
      : [
          [productBrands(p).length > 1 ? "Brands" : "Brand", productBrands(p).join(", ")],
          p.country ? ["Origin", p.country] : null,
          hasWarranty ? ["Warranty", p.warranty] : null,
          ["SKU", p.sku || `SKU-${1000 + p.id}`],
          ["Status", stock > 0 ? "In stock" : "Out of stock"],
        ];
  // custom technical specs entered in admin come first; base specs are only
  // appended when their label isn't already covered by a custom spec (no dupes)
  const custom: [string, string][] = (p.specs || []).filter((s) => s && s[0] && s[1]);
  const seenLabels = new Set(custom.map(([k]) => k.trim().toLowerCase()));
  const baseList = base.filter((x): x is [string, string] => !!x).filter(([k]) => !seenLabels.has(k.trim().toLowerCase()));
  const specs: [string, string][] = [...custom, ...baseList];

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
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-[18px] text-[90px] font-extrabold" style={{ background: grad(p.hue + gallery * 12, dark), color: "rgba(255,255,255,.5)" }}>
            {p.images && p.images.length ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.images[Math.min(gallery, p.images.length - 1)]} alt={name} className="h-full w-full object-cover" />
            ) : (
              name.charAt(0)
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {(p.images && p.images.length ? p.images : [0, 1, 2, 3]).map((src, i) => (
              <button key={i} onClick={() => setGallery(i)} className="h-[70px] w-[70px] cursor-pointer overflow-hidden rounded-[12px]" style={{ background: grad(p.hue + i * 12, dark), border: gallery === i ? "2px solid var(--accent)" : "2px solid transparent" }}>
                {typeof src === "string" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt="" className="h-full w-full object-cover" />
                ) : null}
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2.5">
            {p.video ? (
              <button onClick={() => setShowVideo(true)} className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[10px] py-2.5 text-[13px] font-bold text-white" style={{ background: "var(--accent)" }}><Play size={15} /> {t.watchVideo}</button>
            ) : (
              <button disabled className="inline-flex flex-1 items-center justify-center gap-2 rounded-[10px] py-2.5 text-[13px] font-bold opacity-50" style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}><Play size={15} /> {t.watchVideo}</button>
            )}
            <button className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[10px] py-2.5 text-[13px] font-bold" style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}><Download size={15} /> {t.downloadCatalog}</button>
          </div>
        </div>

        {showVideo && p.video && (
          <div className="fixed inset-0 z-[95] flex items-center justify-center p-5" style={{ background: "rgba(0,0,0,.7)" }} onClick={() => setShowVideo(false)}>
            <video src={p.video} controls autoPlay className="max-h-[80vh] w-full max-w-[820px] rounded-[14px]" onClick={(e) => e.stopPropagation()} />
          </div>
        )}

        {/* info */}
        <div>
          {p.badge && (
            <span className="inline-block rounded-full px-2.5 py-1 text-[11.5px] font-extrabold" style={{ background: "var(--text)", color: "var(--surface)" }}>{locale === "fa" ? p.badge[0] : p.badge[1]}</span>
          )}
          <h1 className="mt-2 text-[28px] font-extrabold leading-tight tracking-tight">{name}</h1>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-[16px]" style={{ color: "#f59e0b", letterSpacing: 2 }}>{"★★★★★".slice(0, Math.round(p.rating))}</span>
            <span className="text-[13px]" style={{ color: "var(--muted)" }}>{num(p.rating, locale)} ({num(p.reviews, locale)} {t.tabReviews})</span>
            <span className="text-[13px] font-bold" style={{ color: stock > 0 ? "#1f8a5b" : "#e11d48" }}>{stock > 0 ? t.inStock : t.outStock}</span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <span className="text-[30px] font-black" style={{ color: "var(--accent)" }}>{priceFmt(price, locale, t.currency)}</span>
            {p.old && !isPerCm(p) && !hasVariations(p) && <span className="text-[18px] line-through" style={{ color: "var(--muted)" }}>{num(p.old, locale)}</span>}
            {disc > 0 && !isPerCm(p) && !hasVariations(p) && <span className="rounded-md px-2 py-1 text-[12px] font-extrabold text-white" style={{ background: "#e11d48" }}>{num(disc, locale)}٪-</span>}
          </div>
          {isPerCm(p) ? (
            <div className="mt-1 text-[13px]" style={{ color: "var(--muted)" }}>📏 {perCmNote(p, locale)} {t.currency}</div>
          ) : null}

          {/* brand selector — drives the price when brands are priced */}
          {(brandPriced || brandList.length > 1) && (
            <div className="mt-5">
              <div className="mb-2 text-[13.5px] font-bold">{locale === "fa" ? "انتخاب برند" : "Choose brand"}</div>
              <div className="flex flex-wrap gap-2">
                {brandList.map((b, i) => {
                  const sel = brandIdx === i;
                  const bp = isPerCm(p) ? (b.pricePerCm && b.pricePerCm > 0 ? b.pricePerCm * (p.width && p.width > 0 ? p.width : 1) : 0) : (b.price || 0);
                  return (
                    <button
                      key={i}
                      onClick={() => setBrandIdx(i)}
                      className="cursor-pointer rounded-[10px] px-3.5 py-2 text-[13.5px] font-bold"
                      style={{ background: sel ? "var(--accent)" : "var(--surface2)", color: sel ? "#fff" : "var(--text)", border: "1px solid var(--border)" }}
                    >
                      {b.name}
                      {brandPriced && bp > 0 && <span className="ms-1.5 text-[12px] font-extrabold" style={{ opacity: 0.85 }}>· {priceFmt(bp, locale, t.currency)}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* priced variants (e.g. خشک / روغنی) */}
          {variations.length > 0 && (
            <div className="mt-5">
              <div className="mb-2 text-[13.5px] font-bold">{locale === "fa" ? "انتخاب نوع" : "Choose option"}</div>
              <div className="flex flex-wrap gap-2">
                {variations.map((v, i) => {
                  const label = v.type || v.value || (locale === "fa" ? `نوع ${num(i + 1, locale)}` : `Option ${i + 1}`);
                  const sel = variant === i;
                  return (
                    <button
                      key={i}
                      onClick={() => setVariant(i)}
                      className="cursor-pointer rounded-[10px] px-3.5 py-2 text-[13.5px] font-bold"
                      style={{ background: sel ? "var(--accent)" : "var(--surface2)", color: sel ? "#fff" : "var(--text)", border: "1px solid var(--border)" }}
                    >
                      {label}
                      {v.price > 0 && <span className="ms-1.5 text-[12px] font-extrabold" style={{ opacity: 0.85 }}>· {priceFmt(v.price, locale, t.currency)}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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

          {/* pack/carton note */}
          {pack > 1 && (
            <div className="mt-5 rounded-[12px] p-3.5 text-[13.5px]" style={{ background: "color-mix(in srgb, var(--accent) 9%, var(--surface))", border: "1px solid var(--border)" }}>
              📦 <b>{locale === "fa" ? `این محصول کارتنی فروخته می‌شود — هر کارتن ${num(pack, locale)} عدد.` : `Sold by the carton — ${pack} units each.`}</b>
              <div className="mt-1" style={{ color: "var(--muted)" }}>{locale === "fa" ? `قیمت هر کارتن: ` : `Price per carton: `}<b style={{ color: "var(--accent)" }}>{priceFmt(price * pack, locale, t.currency)}</b></div>
            </div>
          )}

          {/* qty + actions */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 rounded-[12px] px-2 py-1.5" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
              <button onClick={() => setQty((q) => Math.max(pack, q - pack))} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-none" style={{ background: "var(--surface)", color: "var(--text)" }}><Minus size={16} /></button>
              <span className="min-w-[24px] text-center text-[15px] font-bold">{pack > 1 ? `${num(cartons, locale)} ${locale === "fa" ? "کارتن" : "carton"}` : num(qty, locale)}</span>
              <button onClick={() => setQty((q) => q + pack)} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-none" style={{ background: "var(--surface)", color: "var(--text)" }}><Plus size={16} /></button>
            </div>
            <button onClick={() => addToCart(p.id, qty, color, size, variant, brandIdx)} className="flex-1 cursor-pointer rounded-[12px] border-none px-6 py-3.5 text-[15px] font-extrabold text-white" style={{ background: "var(--accent)" }}>{t.addToCart}</button>
            <button onClick={() => { addToCart(p.id, qty, color, size, variant, brandIdx); router.push(`/${locale}/cart`); }} className="cursor-pointer rounded-[12px] px-6 py-3.5 text-[15px] font-extrabold" style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}>{t.buyNow}</button>
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
            <p className="max-w-[760px] whitespace-pre-line text-[14.5px] leading-loose" style={{ color: "var(--muted)" }}>
              {(() => {
                const custom = locale === "fa" ? p.shortFa : p.shortEn;
                if (custom && custom.trim()) return custom;
                const origin = locale === "fa"
                  ? (p.country ? ` این محصول ساخت کشور ${p.country} است.` : "")
                  : (p.country ? ` Made in ${p.country}.` : "");
                const warr = locale === "fa"
                  ? (hasWarranty ? ` دارای ${p.warranty} گارانتی معتبر است.` : "")
                  : (hasWarranty ? ` Comes with a valid ${p.warranty} warranty.` : "");
                return locale === "fa"
                  ? `${name} یکی از محصولات محبوب برند ${p.brand} است که با کیفیت ساخت بالا و طراحی مدرن عرضه می‌شود.${origin}${warr} مناسب برای استفاده‌ی روزمره با دوام و عملکرد عالی.`
                  : `${name} is one of ${p.brand}'s popular products, featuring premium build quality and a modern design.${origin}${warr} Ideal for everyday use with great durability and performance.`;
              })()}
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
            <ProductReviews productId={p.id} fallbackRating={p.rating} fallbackCount={p.reviews} />
          )}
        </div>
      </div>

      {/* related */}
      <div className="mt-8">
        <h2 className="mb-[18px] text-[22px] font-extrabold tracking-tight">{t.relatedTitle}</h2>
        <div className="grid grid-cols-2 gap-[18px] md:grid-cols-4">
          {related(p, products).map((rp) => (
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
