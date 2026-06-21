import "server-only";
import { readArray, writeArray } from "./settings";

export interface AdminCoupon {
  code: string;
  type: "percent" | "fixed" | "ship";
  value: number;
  enabled: boolean;
  expiry?: string; // ISO date or empty = no expiry
  minPurchase?: number;
  usageLimit?: number;
  used?: number;
}

const SEED: AdminCoupon[] = [
  { code: "WELCOME10", type: "percent", value: 10, enabled: true, used: 0 },
  { code: "SALE20", type: "percent", value: 20, enabled: true, used: 0 },
  { code: "FREESHIP", type: "ship", value: 0, enabled: true, used: 0 },
];

export function getCoupons(): AdminCoupon[] {
  return readArray<AdminCoupon>("coupons.json", SEED);
}
export function saveCoupons(list: AdminCoupon[]): AdminCoupon[] {
  return writeArray<AdminCoupon>("coupons.json", list);
}

/** Validate a code for a given subtotal; returns the applicable coupon or null. */
export function findCoupon(code: string, subtotal = 0): AdminCoupon | null {
  const c = getCoupons().find((x) => x.code.toUpperCase() === code.trim().toUpperCase());
  if (!c || !c.enabled) return null;
  if (c.expiry && new Date(c.expiry).getTime() < Date.now()) return null;
  if (c.minPurchase && subtotal < c.minPurchase) return null;
  if (c.usageLimit != null && (c.used ?? 0) >= c.usageLimit) return null;
  return c;
}
