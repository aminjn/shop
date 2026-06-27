import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCatalog, getProduct } from "@/lib/catalog";
import { findCoupon } from "@/lib/coupons";
import { readStore, readLoyalty, tierFor } from "@/lib/settings";
import { computeTotals } from "@/lib/cart";
import { variantPrice } from "@/lib/format";
import { updateUser, uid, nowIso, notify, type Order, type OrderItem } from "@/lib/userstore";
import type { CartLine } from "@/lib/types";

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));

  const products = getCatalog();
  const rawItems: { id: number; qty: number }[] = Array.isArray(b.items) ? b.items : [];
  const lines: CartLine[] = rawItems
    .map((it) => ({ key: String(it.id), id: Number(it.id), qty: Math.max(1, Number(it.qty) || 1), color: 0, size: 0 }))
    .filter((l) => getProduct(l.id));
  if (!lines.length) return NextResponse.json({ ok: false, error: "empty-cart" }, { status: 400 });

  const store = readStore();
  const subtotalForCoupon = lines.reduce((sum, l) => {
    const p = getProduct(l.id);
    return sum + (p ? variantPrice(p, l.variant) * l.qty : 0);
  }, 0);
  const coupon = b.coupon ? findCoupon(String(b.coupon), subtotalForCoupon) : null;

  const payment = String(b.payment || "online");
  const shipping = String(b.shipping || "standard");
  // resolve the chosen shipping method's price (falls back to the legacy flat fee)
  const shipMethod = (store.shippingMethods || []).find((m) => m.id === shipping && m.enabled);
  const shipFee = shipMethod ? shipMethod.price : store.shipFee;
  // resolve payment behaviour by the method's kind (supports custom methods)
  const payMethod = (store.paymentMethods || []).find((m) => m.id === payment);
  const payKind = payMethod?.kind || (payment === "wallet" ? "wallet" : payment === "cod" ? "cod" : "online");

  const totals = computeTotals(lines, coupon, {
    products,
    config: { shipFee, freeShipThreshold: store.freeShipThreshold, taxRate: store.taxRate },
  });

  const items: OrderItem[] = lines.map((l) => {
    const p = getProduct(l.id)!;
    const v = p.variations && typeof l.variant === "number" ? p.variations[l.variant] : undefined;
    const vName = v ? ` (${v.type || v.value})` : "";
    return { id: p.id, name: p.fa + vName, qty: l.qty, price: variantPrice(p, l.variant) };
  });

  const loy = readLoyalty();
  let error = "";
  let orderId = "";
  let finalTotal = totals.grand;
  const u = updateUser(s.mobile, (u) => {
    // loyalty tier discount, based on the member's points before this order
    const tier = loy.enabled ? tierFor(u.points, loy) : null;
    const tierDisc = tier && tier.discountPct > 0 ? Math.round(totals.grand * tier.discountPct / 100) : 0;
    finalTotal = Math.max(0, totals.grand - tierDisc);
    if (payKind === "wallet") {
      if (u.wallet.balance < finalTotal) { error = "insufficient-wallet"; return; }
      u.wallet.balance -= finalTotal;
      u.wallet.txns.unshift({ id: uid(), type: "order", amount: finalTotal, date: nowIso(), note: "پرداخت سفارش" });
    }
    orderId = String(Math.floor(100000 + Math.random() * 900000));
    const order: Order = { id: orderId, date: nowIso(), status: "processing", total: finalTotal, items, payment, shipping };
    u.orders.unshift(order);
    const earned = loy.enabled ? Math.floor(finalTotal / loy.earnPerToman) : 0;
    u.points += earned;
    const parts = [`سفارش #${orderId} با موفقیت ثبت شد`];
    if (earned > 0) parts.push(`${earned} امتیاز دریافت کردید`);
    if (tierDisc > 0) parts.push(`تخفیف باشگاه ${tier!.discountPct}٪ اعمال شد`);
    notify(u, parts.join(" و ") + ".");
  });

  if (error) return NextResponse.json({ ok: false, error }, { status: 400 });
  return NextResponse.json({ ok: true, orderId, total: finalTotal, user: u });
}
