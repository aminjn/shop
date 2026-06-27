"use client";

import type { Product } from "@/lib/types";
import { useShop } from "@/lib/store";
import { grad, priceFmt, num, unitPrice, isPerCm, perCmNote, variantPrice, hasVariations } from "@/lib/format";
import { LocaleLink } from "./LocaleLink";
import { Heart } from "./Icons";

export function ProductCard({
  p,
  aiMatch,
  reason,
}: {
  p: Product;
  aiMatch?: number;
  reason?: string;
}) {
  const { locale, t, dark, addToCart, toggleWish, wishlist } = useShop();
  const name = locale === "fa" ? p.fa : p.en;
  const disc = p.old ? Math.round((1 - p.price / p.old) * 100) : 0;
  const wished = wishlist.includes(p.id);
  const badge = p.badge ? (locale === "fa" ? p.badge[0] : p.badge[1]) : null;

  return (
    <div
      className="card-hover flex flex-col overflow-hidden"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
      }}
    >
      <div className="relative">
        <LocaleLink
          href={`/product/${p.id}`}
          className="flex h-[170px] items-center justify-center overflow-hidden text-[46px] font-extrabold no-underline"
          style={{ background: grad(p.hue, dark), color: "rgba(255,255,255,.5)" }}
        >
          {p.images && p.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.images[0]} alt={name} className="h-full w-full object-cover" />
          ) : (
            name.charAt(0)
          )}
        </LocaleLink>
        {aiMatch != null && (
          <span
            className="absolute top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold text-white"
            style={{ insetInlineStart: 12, background: "rgba(0,0,0,.55)", backdropFilter: "blur(4px)" }}
          >
            ✨ {num(aiMatch, locale)}٪ {t.aiMatchWord}
          </span>
        )}
        {badge && aiMatch == null && (
          <span
            className="absolute top-3 rounded-full px-2.5 py-1 text-[11px] font-extrabold"
            style={{ insetInlineStart: 12, background: "var(--text)", color: "var(--surface)" }}
          >
            {badge}
          </span>
        )}
        {disc > 0 && (
          <span
            className="absolute top-3 rounded-md px-2 py-1 text-[11.5px] font-extrabold text-white"
            style={{ insetInlineEnd: 12, background: "#e11d48" }}
          >
            {num(disc, locale)}٪-
          </span>
        )}
        {p.featured && (
          <span
            className="absolute rounded-full px-2.5 py-1 text-[11px] font-extrabold text-white"
            style={{ insetInlineStart: 12, top: badge || aiMatch != null ? 44 : 12, background: "linear-gradient(90deg,#f59e0b,#f97316)" }}
          >
            ⭐ {locale === "fa" ? "ویژه" : "Featured"}
          </span>
        )}
        <button
          onClick={() => toggleWish(p.id)}
          aria-label={t.addToWishlist}
          className="absolute bottom-3 flex h-[38px] w-[38px] items-center justify-center rounded-full border-none"
          style={{
            insetInlineEnd: 12,
            background: "var(--surface)",
            color: wished ? "#e11d48" : "var(--muted)",
            boxShadow: "0 4px 12px rgba(0,0,0,.12)",
            cursor: "pointer",
          }}
        >
          <Heart size={18} fill={wished ? "#e11d48" : "none"} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-[15px]">
        {reason && (
          <div
            className="mb-2.5 flex items-center gap-1.5 rounded-lg px-2.5 py-[7px]"
            style={{ background: "var(--surface2)" }}
          >
            <span>🤖</span>
            <span className="text-[11.5px] font-semibold leading-snug" style={{ color: "var(--muted)" }}>
              {reason}
            </span>
          </div>
        )}
        <div className="text-[12px]" style={{ color: "var(--accent)" }}>
          {p.brand}
        </div>
        <LocaleLink
          href={`/product/${p.id}`}
          className="mt-1 min-h-[38px] text-[14px] font-bold leading-snug no-underline"
          style={{ color: "var(--text)" }}
        >
          {name}
        </LocaleLink>
        <div className="mt-1 flex items-center gap-1.5 text-[13px]">
          <span style={{ color: "#f59e0b", letterSpacing: 2 }}>{"★★★★★".slice(0, Math.round(p.rating))}</span>
          {p.packSize && p.packSize > 1 ? (
            <span className="text-[12px] font-bold" style={{ color: "var(--muted)" }}>
              {locale === "fa" ? "تکی " : "each "}{priceFmt(unitPrice(p), locale, t.currency)}
            </span>
          ) : p.reviews > 0 ? (
            <span className="text-[12px]" style={{ color: "var(--muted)" }}>({num(p.reviews, locale)})</span>
          ) : null}
        </div>
        <div className="mb-1 mt-1.5 flex items-center gap-2">
          <span className="text-[16px] font-extrabold" style={{ color: "var(--accent)" }}>
            {hasVariations(p) && <span className="text-[12px] font-bold" style={{ color: "var(--muted)" }}>{locale === "fa" ? "از " : "from "}</span>}
            {priceFmt(
              hasVariations(p)
                ? variantPrice(p)
                : p.packSize && p.packSize > 1
                  ? unitPrice(p) * p.packSize
                  : unitPrice(p),
              locale,
              t.currency,
            )}
          </span>
          {p.old && !(p.packSize && p.packSize > 1) && !isPerCm(p) && !hasVariations(p) && (
            <span className="text-[13px] line-through" style={{ color: "var(--muted)" }}>
              {num(p.old, locale)}
            </span>
          )}
        </div>
        <div className="mb-3 flex flex-col gap-0.5 text-[11.5px] font-bold" style={{ color: "var(--muted)" }}>
          {isPerCm(p) && <span>📏 {perCmNote(p, locale)}</span>}
          {p.packSize && p.packSize > 1 ? <span>📦 {locale === "fa" ? `کارتن ${num(p.packSize, locale)} عددی` : `Carton of ${p.packSize}`}</span> : null}
        </div>
        <button
          onClick={() => addToCart(p.id, p.packSize && p.packSize > 1 ? p.packSize : 1)}
          className="add-btn mt-auto w-full cursor-pointer rounded-[10px] border p-2.5 text-[13px] font-bold transition"
          style={{ background: "var(--surface2)", color: "var(--text)", borderColor: "var(--border)" }}
        >
          {p.packSize && p.packSize > 1 ? (locale === "fa" ? "افزودن کارتن" : "Add carton") : t.addToCart}
        </button>
      </div>
    </div>
  );
}
