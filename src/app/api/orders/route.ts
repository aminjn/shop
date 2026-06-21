import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { productById } from "@/data/products";
import { computeTotals, COUPONS } from "@/lib/cart";
import { updateUser, uid, nowIso, notify, type Order, type OrderItem } from "@/lib/userstore";
import type { CartLine } from "@/lib/types";

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));

  const rawItems: { id: number; qty: number }[] = Array.isArray(b.items) ? b.items : [];
  const lines: CartLine[] = rawItems
    .map((it) => ({ key: String(it.id), id: Number(it.id), qty: Math.max(1, Number(it.qty) || 1), color: 0, size: 0 }))
    .filter((l) => productById(l.id));
  if (!lines.length) return NextResponse.json({ ok: false, error: "empty-cart" }, { status: 400 });

  const coupon = b.coupon ? COUPONS[String(b.coupon).toUpperCase()] ?? null : null;
  const totals = computeTotals(lines, coupon);
  const payment = String(b.payment || "online");
  const shipping = String(b.shipping || "standard");

  const items: OrderItem[] = lines.map((l) => {
    const p = productById(l.id)!;
    return { id: p.id, name: p.fa, qty: l.qty, price: p.price };
  });

  let error = "";
  let orderId = "";
  const u = updateUser(s.mobile, (u) => {
    if (payment === "wallet") {
      if (u.wallet.balance < totals.grand) { error = "insufficient-wallet"; return; }
      u.wallet.balance -= totals.grand;
      u.wallet.txns.unshift({ id: uid(), type: "order", amount: totals.grand, date: nowIso(), note: "پرداخت سفارش" });
    }
    orderId = String(Math.floor(100000 + Math.random() * 900000));
    const order: Order = {
      id: orderId,
      date: nowIso(),
      status: "processing",
      total: totals.grand,
      items,
      payment,
      shipping,
    };
    u.orders.unshift(order);
    const earned = Math.floor(totals.grand / 100000); // 1 point per 100k Toman
    u.points += earned;
    notify(u, `سفارش #${orderId} با موفقیت ثبت شد و ${earned} امتیاز دریافت کردید.`);
  });

  if (error) return NextResponse.json({ ok: false, error }, { status: 400 });
  return NextResponse.json({ ok: true, orderId, total: totals.grand, user: u });
}
