import { productById } from "@/data/products";
import type { CartLine, Coupon } from "./types";

export const COUPONS: Record<string, Coupon> = {
  WELCOME10: { code: "WELCOME10", type: "percent", value: 10 },
  SALE20: { code: "SALE20", type: "percent", value: 20 },
  FREESHIP: { code: "FREESHIP", type: "ship", value: 0 },
};

const FREE_SHIP_THRESHOLD = 2_000_000;
const SHIP_FEE = 50_000;
const TAX_RATE = 0.09;

export interface Totals {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  grand: number;
  freeShip: boolean;
}

export function lineProduct(line: CartLine) {
  return productById(line.id);
}

export function computeTotals(cart: CartLine[], coupon: Coupon | null): Totals {
  const subtotal = cart.reduce((s, l) => {
    const p = productById(l.id);
    return s + (p ? p.price * l.qty : 0);
  }, 0);

  let discount = 0;
  if (coupon?.type === "percent") discount = Math.round((subtotal * coupon.value) / 100);

  const baseShip = subtotal >= FREE_SHIP_THRESHOLD || subtotal === 0 ? 0 : SHIP_FEE;
  const shipping = coupon?.type === "ship" ? 0 : baseShip;
  const tax = Math.round((subtotal - discount) * TAX_RATE);
  const grand = subtotal - discount + shipping + tax;

  return { subtotal, discount, shipping, tax, grand, freeShip: shipping === 0 };
}
