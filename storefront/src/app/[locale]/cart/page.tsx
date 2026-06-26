"use client";

import { useEffect, useState } from "react";
import { useShop, usePageTitle } from "@/lib/store";
import { computeTotals } from "@/lib/cart";
import { grad, priceFmt, num } from "@/lib/format";
import { LocaleLink } from "@/components/LocaleLink";
import { Plus, Minus, Trash, Cart as CartIcon, ArrowBack } from "@/components/Icons";

export default function CartPage() {
  const { locale, t, dark, cart, changeLine, removeLine, coupon, setCoupon, products, productById } = useShop();
  usePageTitle(t.cartTitle);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [cfg, setCfg] = useState<{ shipFee: number; freeShipThreshold: number; taxRate: number } | undefined>();

  useEffect(() => {
    fetch("/api/settings/store")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.settings && setCfg({ shipFee: d.settings.shipFee, freeShipThreshold: d.settings.freeShipThreshold, taxRate: d.settings.taxRate }))
      .catch(() => {});
  }, []);

  const subtotal = cart.reduce((sum, l) => { const p = productById(l.id); return sum + (p ? p.price * l.qty : 0); }, 0);
  const totals = computeTotals(cart, coupon, { products, config: cfg });

  const applyCoupon = async () => {
    try {
      const r = await fetch("/api/coupons/apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });
      const d = await r.json();
      if (d.ok && d.coupon) { setCoupon(d.coupon); setMsg(t.couponApplied); }
      else { setCoupon(null); setMsg(t.couponInvalid); }
    } catch {
      setCoupon(null); setMsg(t.couponInvalid);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="mx-auto flex max-w-[600px] flex-col items-center px-[22px] py-20 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full" style={{ background: "var(--surface2)", color: "var(--muted)" }}>
          <CartIcon size={36} />
        </span>
        <h1 className="mt-5 text-[22px] font-extrabold">{t.emptyCart}</h1>
        <p className="mt-2 text-[14px]" style={{ color: "var(--muted)" }}>{t.emptyCartSub}</p>
        <LocaleLink href="/shop" className="mt-6 rounded-[12px] px-7 py-3.5 text-[15px] font-bold text-white no-underline" style={{ background: "var(--accent)" }}>{t.continueShopping}</LocaleLink>
      </div>
    );
  }

  const row = (label: string, value: string, accent?: boolean) => (
    <div className="flex justify-between text-[14px]" style={{ color: accent ? "var(--accent)" : "var(--text)" }}>
      <span style={{ color: "var(--muted)" }}>{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1280px] px-[22px] py-7">
      <h1 className="mb-5 text-[24px] font-extrabold tracking-tight">{t.cartTitle}</h1>
      <div className="grid gap-6 md:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-3.5">
          {cart.map((line) => {
            const p = productById(line.id);
            if (!p) return null;
            const name = locale === "fa" ? p.fa : p.en;
            const pack = p.packSize && p.packSize > 1 ? p.packSize : 1;
            const dec = () => { if (line.qty - pack < pack) removeLine(line.key); else changeLine(line.key, -pack); };
            return (
              <div key={line.key} className="flex items-center gap-4 rounded-[16px] p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <LocaleLink href={`/product/${p.id}`} className="flex h-[88px] w-[88px] flex-none items-center justify-center rounded-[12px] text-[30px] font-extrabold no-underline" style={{ background: grad(p.hue, dark), color: "rgba(255,255,255,.5)" }}>{name.charAt(0)}</LocaleLink>
                <div className="min-w-0 flex-1">
                  <LocaleLink href={`/product/${p.id}`} className="block text-[15px] font-bold no-underline" style={{ color: "var(--text)" }}>{name}</LocaleLink>
                  <div className="mt-0.5 text-[12.5px]" style={{ color: "var(--muted)" }}>{p.brand}</div>
                  <div className="mt-1 text-[15px] font-extrabold" style={{ color: "var(--accent)" }}>{priceFmt(p.price, locale, t.currency)}{pack > 1 ? <span className="text-[11.5px] font-bold" style={{ color: "var(--muted)" }}> / {locale === "fa" ? "عدد" : "unit"}</span> : null}</div>
                  {pack > 1 && <div className="mt-0.5 text-[12px] font-bold" style={{ color: "var(--muted)" }}>📦 {locale === "fa" ? `${num(Math.round(line.qty / pack), locale)} کارتن (${num(line.qty, locale)} عدد)` : `${Math.round(line.qty / pack)} cartons (${line.qty} units)`}</div>}
                </div>
                <div className="flex items-center gap-2 rounded-[10px] px-1.5 py-1" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
                  <button onClick={dec} aria-label="-" className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border-none" style={{ background: "var(--surface)", color: "var(--text)" }}><Minus size={14} /></button>
                  <span className="min-w-[22px] text-center text-[14px] font-bold">{pack > 1 ? `${num(Math.round(line.qty / pack), locale)}×` : num(line.qty, locale)}</span>
                  <button onClick={() => changeLine(line.key, pack)} aria-label="+" className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border-none" style={{ background: "var(--surface)", color: "var(--text)" }}><Plus size={14} /></button>
                </div>
                <button onClick={() => removeLine(line.key)} aria-label={t.remove} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[10px] border-none" style={{ background: "var(--surface2)", color: "#e11d48" }}><Trash size={16} /></button>
              </div>
            );
          })}
          <LocaleLink href="/shop" className="inline-flex items-center gap-2 text-[14px] font-bold no-underline" style={{ color: "var(--accent)" }}>
            <ArrowBack size={16} /> {t.continueShopping}
          </LocaleLink>
        </div>

        {/* summary */}
        <div className="h-fit rounded-[16px] p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="mb-4 flex gap-2">
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={t.couponPh} className="flex-1 rounded-[10px] px-3 py-2.5 text-[13.5px] outline-none" style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }} />
            <button onClick={applyCoupon} className="cursor-pointer rounded-[10px] border-none px-4 text-[13.5px] font-bold text-white" style={{ background: "var(--accent)" }}>{t.apply}</button>
          </div>
          {msg && <div className="mb-3 text-[12.5px] font-bold" style={{ color: coupon ? "#1f8a5b" : "#e11d48" }}>{msg}</div>}

          <div className="flex flex-col gap-2.5">
            {row(t.subtotal, priceFmt(totals.subtotal, locale, t.currency))}
            {totals.discount > 0 && row(t.discount, "−" + priceFmt(totals.discount, locale, t.currency), true)}
            {row(t.shipping, totals.freeShip ? t.free : priceFmt(totals.shipping, locale, t.currency))}
            {row(t.tax, priceFmt(totals.tax, locale, t.currency))}
          </div>
          <div className="my-4 h-px" style={{ background: "var(--border)" }} />
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-bold">{t.grandTotal}</span>
            <span className="text-[20px] font-black" style={{ color: "var(--accent)" }}>{priceFmt(totals.grand, locale, t.currency)}</span>
          </div>
          <LocaleLink href="/checkout" className="mt-5 block cursor-pointer rounded-[12px] py-3.5 text-center text-[15px] font-extrabold text-white no-underline" style={{ background: "var(--accent)" }}>{t.checkout}</LocaleLink>
        </div>
      </div>
    </div>
  );
}
