import { productById as seedById } from "@/data/products";
import type { CartLine, Coupon, Product } from "./types";

export interface TotalsConfig {
  shipFee: number;
  freeShipThreshold: number;
  taxRate: number; // percent, e.g. 9
}
export const DEFAULT_TOTALS_CONFIG: TotalsConfig = {
  shipFee: 50_000,
  freeShipThreshold: 2_000_000,
  taxRate: 9,
};

export interface Totals {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  grand: number;
  freeShip: boolean;
}

export function computeTotals(
  cart: CartLine[],
  coupon: Coupon | null,
  opts?: { products?: Product[]; config?: Partial<TotalsConfig> },
): Totals {
  const cfg = { ...DEFAULT_TOTALS_CONFIG, ...(opts?.config || {}) };
  const lookup = (id: number) =>
    opts?.products ? opts.products.find((p) => p.id === id) : seedById(id);

  const subtotal = cart.reduce((s, l) => {
    const p = lookup(l.id);
    return s + (p ? p.price * l.qty : 0);
  }, 0);

  let discount = 0;
  if (coupon?.type === "percent") discount = Math.round((subtotal * coupon.value) / 100);
  else if (coupon?.type === "fixed") discount = Math.min(coupon.value, subtotal);

  const baseShip = subtotal >= cfg.freeShipThreshold || subtotal === 0 ? 0 : cfg.shipFee;
  const shipping = coupon?.type === "ship" ? 0 : baseShip;
  const tax = Math.round(((subtotal - discount) * cfg.taxRate) / 100);
  const grand = subtotal - discount + shipping + tax;

  return { subtotal, discount, shipping, tax, grand, freeShip: shipping === 0 };
}
