"use client";

import { useEffect, useMemo, useState } from "react";
import { useShop, usePageTitle } from "@/lib/store";
import { computeTotals } from "@/lib/cart";
import type { ShipMethod, PayMethod } from "@/lib/settings";
import { grad, priceFmt, num } from "@/lib/format";
import { LocaleLink } from "@/components/LocaleLink";
import { Sparkle, Check } from "@/components/Icons";

const field =
  "rounded-[10px] px-3 py-3 text-[14px] outline-none w-full";

export default function CheckoutPage() {
  const { locale, t, dark, cart, clearCart, coupon, toast, productById, products } = useShop();
  usePageTitle(t.checkoutTitle);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", phone: "", email: "", province: "", city: "", postal: "", address: "", notes: "",
  });
  const [ship, setShip] = useState("");
  const [pay, setPay] = useState("");
  const [placing, setPlacing] = useState(false);
  // shipping/payment methods + totals config come from store settings (admin-managed)
  const [shipMethods, setShipMethods] = useState<ShipMethod[]>([]);
  const [payMethods, setPayMethods] = useState<PayMethod[]>([]);
  const [cfg, setCfg] = useState({ freeShipThreshold: 2_000_000, taxRate: 9 });
  // loyalty tier auto-discount (read from the member's status)
  const [tier, setTier] = useState<{ fa: string; en: string; discountPct: number } | null>(null);

  useEffect(() => {
    fetch("/api/account/loyalty", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.ok && d.loyalty?.enabled && d.tier?.discountPct > 0) setTier(d.tier); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/settings/store").then((r) => r.json()).then((d) => {
      const sset = d?.settings;
      if (!sset) return;
      const sm: ShipMethod[] = (sset.shippingMethods || []).filter((m: ShipMethod) => m.enabled);
      const pm: PayMethod[] = (sset.paymentMethods || []).filter((m: PayMethod) => m.enabled);
      setShipMethods(sm); setPayMethods(pm);
      setCfg({ freeShipThreshold: sset.freeShipThreshold ?? 2_000_000, taxRate: sset.taxRate ?? 9 });
      setShip((s) => s || sm[0]?.id || "standard");
      setPay((p) => p || pm[0]?.id || "online");
    }).catch(() => {});
  }, []);

  // real upsell suggestion: cheapest in-stock product not already in the cart
  const suggestion = useMemo(() => {
    const inCart = new Set(cart.map((l) => l.id));
    return products.filter((p) => !inCart.has(p.id) && p.stock > 0).sort((a, b) => a.price - b.price)[0];
  }, [products, cart]);

  const selShip = shipMethods.find((m) => m.id === ship);
  const totals = useMemo(
    () => computeTotals(cart, coupon, { products, config: { shipFee: selShip?.price ?? 50000, freeShipThreshold: cfg.freeShipThreshold, taxRate: cfg.taxRate } }),
    [cart, coupon, products, selShip?.price, cfg.freeShipThreshold, cfg.taxRate],
  );
  const tierDiscount = tier ? Math.round((totals.grand * tier.discountPct) / 100) : 0;
  const grandFinal = Math.max(0, totals.grand - tierDiscount);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const place = async () => {
    if (placing || cart.length === 0) return;
    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: cart.map((c) => ({ id: c.id, qty: c.qty })),
          payment: pay,
          shipping: ship,
          coupon: coupon?.code,
        }),
      });
      if (res.status === 401) {
        // not logged in → send to login, come back to checkout
        window.location.href = `/${locale}/login`;
        return;
      }
      const d = await res.json();
      if (!d.ok) {
        toast(d.error === "insufficient-wallet" ? (locale === "fa" ? "موجودی کیف پول کافی نیست" : "Insufficient wallet balance") : (locale === "fa" ? "ثبت سفارش ناموفق بود" : "Order failed"));
        return;
      }
      setOrderId((locale === "fa" ? "سفارش #" : "#") + d.orderId);
      clearCart();
      window.scrollTo(0, 0);
    } catch {
      toast(locale === "fa" ? "خطای شبکه" : "Network error");
    } finally {
      setPlacing(false);
    }
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

      {/* real upsell — suggests an actual in-stock product not already in the cart */}
      {suggestion && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[14px] p-4" style={{ background: "var(--surface2)", border: "1px dashed var(--accent)" }}>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: "var(--accent)" }}><Sparkle size={16} /></span>
            <div>
              <div className="text-[13.5px] font-extrabold">{locale === "fa" ? "تکمیل خرید" : "Complete your order"}</div>
              <div className="text-[12.5px]" style={{ color: "var(--muted)" }}>{locale === "fa" ? `شاید به «${suggestion.fa}» هم نیاز داشته باشی — ${priceFmt(suggestion.price, locale, t.currency)}` : `You may also need “${suggestion.en}” — ${priceFmt(suggestion.price, locale, t.currency)}`}</div>
            </div>
          </div>
          <LocaleLink href={`/product/${suggestion.id}`} className="rounded-[9px] px-4 py-2 text-[12.5px] font-bold text-white no-underline" style={{ background: "var(--accent)" }}>{locale === "fa" ? "مشاهده محصول" : "View product"}</LocaleLink>
        </div>
      )}

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
                {shipMethods.length === 0 ? <span className="text-[13px]" style={{ color: "var(--muted)" }}>{locale === "fa" ? "روش ارسالی تنظیم نشده" : "No shipping method"}</span>
                  : shipMethods.map((m) => radio("ship", m.id, ship, setShip, locale === "fa" ? m.fa : m.en, `${m.price > 0 ? priceFmt(m.price, locale, t.currency) : (locale === "fa" ? "رایگان" : "Free")}${(locale === "fa" ? m.etaFa : m.etaEn) ? " · " + (locale === "fa" ? m.etaFa : m.etaEn) : ""}`))}
              </div>
            </div>
            <div className="rounded-[16px] p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <h2 className="mb-3 text-[16px] font-bold">{t.paymentMethod}</h2>
              <div className="flex flex-col gap-2.5">
                {payMethods.length === 0 ? <span className="text-[13px]" style={{ color: "var(--muted)" }}>{locale === "fa" ? "روش پرداختی تنظیم نشده" : "No payment method"}</span>
                  : payMethods.map((m) => radio("pay", m.id, pay, setPay, locale === "fa" ? m.fa : m.en))}
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
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{locale === "fa" ? p.fa : p.en}{(() => { const v = p.variations && typeof line.variant === "number" ? p.variations[line.variant] : undefined; return v ? <span style={{ color: "var(--muted)" }}> — {v.type || v.value}</span> : null; })()}</span>
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
            {tierDiscount > 0 && tier && (
              <div className="flex justify-between" style={{ color: "#1f8a5b" }}>
                <span style={{ color: "var(--muted)" }}>{locale === "fa" ? `تخفیف باشگاه (${tier.fa} ${num(tier.discountPct, locale)}٪)` : `Loyalty (${tier.en} ${tier.discountPct}%)`}</span>
                <span className="font-bold">−{priceFmt(tierDiscount, locale, t.currency)}</span>
              </div>
            )}
          </div>
          <div className="my-4 h-px" style={{ background: "var(--border)" }} />
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-bold">{t.grandTotal}</span>
            <span className="text-[20px] font-black" style={{ color: "var(--accent)" }}>{priceFmt(grandFinal, locale, t.currency)}</span>
          </div>
          <button onClick={place} disabled={placing} className="mt-5 w-full cursor-pointer rounded-[12px] border-none py-3.5 text-[15px] font-extrabold text-white disabled:opacity-60" style={{ background: "var(--accent)" }}>{placing ? (locale === "fa" ? "در حال ثبت…" : "Placing…") : t.placeOrder}</button>
        </div>
      </div>
    </div>
  );
}
