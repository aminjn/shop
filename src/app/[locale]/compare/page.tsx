"use client";

import { useShop } from "@/lib/store";
import { catById } from "@/data/categories";
import { grad, priceFmt, num } from "@/lib/format";
import { LocaleLink } from "@/components/LocaleLink";
import { Compare as CompareIcon, Close } from "@/components/Icons";

export default function ComparePage() {
  const { locale, t, dark, compare, toggleCompare, addToCart, productById } = useShop();
  const items = compare.map((id) => productById(id)).filter(Boolean);

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-[600px] flex-col items-center px-[22px] py-20 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full" style={{ background: "var(--surface2)", color: "var(--muted)" }}><CompareIcon size={36} /></span>
        <h1 className="mt-5 text-[22px] font-extrabold">{t.emptyCompare}</h1>
        <p className="mt-2 text-[14px]" style={{ color: "var(--muted)" }}>{t.emptyCompareSub}</p>
        <LocaleLink href="/shop" className="mt-6 rounded-[12px] px-7 py-3.5 text-[15px] font-bold text-white no-underline" style={{ background: "var(--accent)" }}>{t.continueShopping}</LocaleLink>
      </div>
    );
  }

  const rows: [string, (id: number) => string][] = [
    [t.brand, (id) => productById(id)!.brand],
    [t.fCategory, (id) => { const c = catById(productById(id)!.cat); return c ? (locale === "fa" ? c.fa : c.en) : ""; }],
    [t.thPrice, (id) => priceFmt(productById(id)!.price, locale, t.currency)],
    [t.fRating, (id) => `${num(productById(id)!.rating, locale)} ★`],
    [t.thStock, (id) => num(productById(id)!.stock, locale)],
    [t.origin, (id) => productById(id)!.country],
    [t.warranty, (id) => productById(id)!.warranty],
  ];

  return (
    <div className="mx-auto max-w-[1280px] px-[22px] py-7">
      <h1 className="mb-5 text-[24px] font-extrabold tracking-tight">{t.compareTitle}</h1>
      <div className="overflow-auto rounded-[16px]" style={{ border: "1px solid var(--border)" }}>
        <table className="w-full border-collapse text-[14px]">
          <thead>
            <tr>
              <th className="p-3" />
              {items.map((p) => p && (
                <th key={p.id} className="min-w-[180px] p-4 align-top">
                  <div className="relative flex flex-col items-center gap-2">
                    <button onClick={() => toggleCompare(p.id)} aria-label={t.remove} className="absolute top-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-none" style={{ insetInlineEnd: 0, background: "var(--surface2)", color: "#e11d48" }}><Close size={14} /></button>
                    <LocaleLink href={`/product/${p.id}`} className="flex h-[90px] w-[90px] items-center justify-center rounded-[12px] text-[28px] font-extrabold no-underline" style={{ background: grad(p.hue, dark), color: "rgba(255,255,255,.5)" }}>{(locale === "fa" ? p.fa : p.en).charAt(0)}</LocaleLink>
                    <LocaleLink href={`/product/${p.id}`} className="text-center text-[13.5px] font-bold no-underline" style={{ color: "var(--text)" }}>{locale === "fa" ? p.fa : p.en}</LocaleLink>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, val], i) => (
              <tr key={label} style={{ background: i % 2 ? "var(--surface)" : "var(--surface2)" }}>
                <td className="p-3 text-[13px] font-bold" style={{ color: "var(--muted)" }}>{label}</td>
                {items.map((p) => p && <td key={p.id} className="p-3 text-center font-semibold">{val(p.id)}</td>)}
              </tr>
            ))}
            <tr>
              <td className="p-3" />
              {items.map((p) => p && (
                <td key={p.id} className="p-3 text-center">
                  <button onClick={() => addToCart(p.id)} className="cursor-pointer rounded-[10px] border-none px-4 py-2.5 text-[13px] font-bold text-white" style={{ background: "var(--accent)" }}>{t.addToCart}</button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
