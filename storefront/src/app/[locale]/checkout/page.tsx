"use client";

import { useState } from "react";
import { useShop } from "@/lib/store";
import { productById } from "@/data/products";
import { computeTotals } from "@/lib/cart";
import { grad, priceFmt, num } from "@/lib/format";
import { LocaleLink } from "@/components/LocaleLink";
import { Sparkle, Check } from "@/components/Icons";

const field =
  "rounded-[10px] px-3 py-3 text-[14px] outline-none w-full";

export default function CheckoutPage() {
  const { locale, t, dark, cart, clearCart, coupon } = useShop();
  const totals = computeTotals(cart, coupon);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", phone: "", email: "", province: "", city: "", postal: "", address: "", notes: "",
  });
  const [ship, setShip] = useState("standard");
  const [pay, setPay] = useState("online");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const place = () => {
    const id = (locale === "fa" ? "سفارش #" : "#") + Math.floor(100000 + Math.random() * 900000);
    setOrderId(id);
    clearCart();
    window.scrollTo(0, 0);
  };

  if (orderId) {
    return (
      <div className="mx-auto flex max-w-[600px] flex-col items-center px-[22px] py-20 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full text-white" style={{ background: "#1f8a5b" }}>
          <Check size={40} />
        </span>
        <h1 className="mt-5 text-[24px] font-extrabold">{t.orderPlaced}</h1>
        <p className="mt-2 text-[14px]" style={{ color: "var(--muted)" }}>{t.thankYou}</p>
        <div className="mt-4 rounded-[12px] px-6 py-3 text-[16px] font-extrabold" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>{orderId}</div>
        <div className="mt-6 flex gap-3">
          <LocaleLink href="/account" className="rounded-[12px] px-6 py-3 text-[14px] font-bold text-white no-underline" style={{ background: "var(--accent)" }}>{t.trackOrder}</LocaleLink>
          <LocaleLink href="/" className="rounded-[12px] px-6 py-3 text-[14px] font-bold no-underline" style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}>{t.backHome}</LocaleLink>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-[600px] px-[22px] py-20 text-center">
        <h1 className="text-[20px] font-extrabold">{t.emptyCart}</h1>
        <LocaleLink href="/shop" className="mt-5 inline-block rounded-[12px] px-7 py-3 text-[15px] font-bold text-white no-underline" style={{ background: "var(--accent)" }}>{t.continueShopping}</LocaleLink>
      </div>
    );
  }

  const radio = (group: string, val: string, cur: string, setF: (v: string) => void, label: string, sub?: string) => (
    <button onClick={() => setF(val)} className="flex w-full items-center gap-3 rounded-[10px] p-3 text-start" style={{ background: cur === val ? "var(--surface2)" : "var(--surface)", border: cur === val ? "2px solid var(--accent)" : "1px solid var(--border)", cursor: "pointer" }}>
      <span className="flex h-5 w-5 items-center justify-center rounded-full" style={{ border: "2px solid " + (cur === val ? "var(--accent)" : "var(--border)") }}>
        {cur === val && <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--accent)" }} />}
      </span>
      <span>
        <span className="block text-[14px] font-bold">{label}</span>
        {sub && <span className="block text-[12px]" style={{ color: "var(--muted)" }}>{sub}</span>}
      </span>
    </button>
  );

  return (
    <div className="mx-auto max-w-[1280px] px-[22px] py-7">
      <h1 className="mb-5 text-[24px] font-extrabold tracking-tight">{t.checkoutTitle}</h1>

      {/* smart checkout assistant */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[14px] p-4" style={{ background: "var(--surface2)", border: "1px dashed var(--accent)" }}>
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: "var(--accent)" }}><Sparkle size={16} /></span>
          <div>
            <div className="text-[13.5px] font-extrabold">{t.checkoutAiTitle}</div>
            <div className="text-[12.5px]" style={{ color: "var(--muted)" }}>{t.checkoutAiText}</div>
          </div>
        </div>
        <LocaleLink href="/product/14" className="rounded-[9px] px-4 py-2 text-[12.5px] font-bold text-white no-underline" style={{ background: "var(--accent)" }}>{t.checkoutAiAdd}</LocaleLink>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-5">
          <div className="rounded-[16px] p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <h2 className="mb-4 text-[16px] font-bold">{t.contactInfo}</h2>
            <div className="grid grid-cols-2 gap-3">
              {([["name", t.fullName], ["phone", t.phone], ["province", t.province], ["city", t.city], ["postal", t.postal], ["email", t.emailLabel]] as const).map(([k, label]) => (
                <label key={k} className="flex flex-col gap-1.5 text-[13px] font-semibold" style={{ color: "var(--muted)" }}>
                  {label}
                  <input value={form[k]} onChange={set(k)} className={field} style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }} />
                </label>
              ))}
            </div>
            <label className="mt-3 flex flex-col gap-1.5 text-[13px] font-semibold" style={{ color: "var(--muted)" }}>
              {t.addressLabel}
              <input value={form.address} onChange={set("address")} className={field} style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }} />
            </label>
            <label className="mt-3 flex flex-col gap-1.5 text-[13px] font-semibold" style={{ color: "var(--muted)" }}>
              {t.orderNotes}
              <textarea value={form.notes} onChange={set("notes")} rows={2} className={field} style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", resize: "vertical" }} />
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-[16px] p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <h2 className="mb-3 text-[16px] font-bold">{t.shippingMethod}</h2>
              <div className="flex flex-col gap-2.5">
                {radio("ship", "standard", ship, setShip, t.standardShip, priceFmt(50000, locale, t.currency))}
                {radio("ship", "express", ship, setShip, t.expressShip, priceFmt(120000, locale, t.currency))}
              </div>
            </div>
            <div className="rounded-[16px] p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <h2 className="mb-3 text-[16px] font-bold">{t.paymentMethod}</h2>
              <div className="flex flex-col gap-2.5">
                {radio("pay", "online", pay, setPay, t.payOnline)}
                {radio("pay", "wallet", pay, setPay, t.payWallet)}
                {radio("pay", "cod", pay, setPay, t.payCod)}
              </div>
            </div>
          </div>
        </div>

        {/* summary */}
        <div className="h-fit rounded-[16px] p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <h2 className="mb-4 text-[16px] font-bold">{t.orderSummary}</h2>
          <div className="mb-4 flex flex-col gap-3">
            {cart.map((line) => {
              const p = productById(line.id);
              if (!p) return null;
              return (
                <div key={line.key} className="flex items-center gap-3">
                  <span className="flex h-12 w-12 flex-none items-center justify-center rounded-[10px] text-[16px] font-extrabold" style={{ background: grad(p.hue, dark), color: "rgba(255,255,255,.5)" }}>{(locale === "fa" ? p.fa : p.en).charAt(0)}</span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{locale === "fa" ? p.fa : p.en}</span>
                  <span className="text-[12.5px]" style={{ color: "var(--muted)" }}>×{num(line.qty, locale)}</span>
                </div>
              );
            })}
          </div>
          <div className="flex flex-col gap-2.5 text-[14px]">
            <div className="flex justify-between"><span style={{ color: "var(--muted)" }}>{t.subtotal}</span><span className="font-bold">{priceFmt(totals.subtotal, locale, t.currency)}</span></div>
            {totals.discount > 0 && <div className="flex justify-between" style={{ color: "var(--accent)" }}><span style={{ color: "var(--muted)" }}>{t.discount}</span><span className="font-bold">−{priceFmt(totals.discount, locale, t.currency)}</span></div>}
            <div className="flex justify-between"><span style={{ color: "var(--muted)" }}>{t.shipping}</span><span className="font-bold">{totals.freeShip ? t.free : priceFmt(totals.shipping, locale, t.currency)}</span></div>
            <div className="flex justify-between"><span style={{ color: "var(--muted)" }}>{t.tax}</span><span className="font-bold">{priceFmt(totals.tax, locale, t.currency)}</span></div>
          </div>
          <div className="my-4 h-px" style={{ background: "var(--border)" }} />
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-bold">{t.grandTotal}</span>
            <span className="text-[20px] font-black" style={{ color: "var(--accent)" }}>{priceFmt(totals.grand, locale, t.currency)}</span>
          </div>
          <button onClick={place} className="mt-5 w-full cursor-pointer rounded-[12px] border-none py-3.5 text-[15px] font-extrabold text-white" style={{ background: "var(--accent)" }}>{t.placeOrder}</button>
        </div>
      </div>
    </div>
  );
}
