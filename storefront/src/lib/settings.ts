import "server-only";
import fs from "node:fs";
import path from "node:path";

/** Persisted settings live here. Mount a volume at this path in Docker so
 *  changes survive redeploys (e.g. -v /opt/shop-data:/app/data). */
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");

function readJson<T extends object>(file: string): T {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf8")) as T;
  } catch {
    return {} as T;
  }
}
function writeJson<T extends object>(file: string, patch: Partial<T>): T {
  const next = { ...readJson<T>(file), ...patch } as Record<string, unknown>;
  for (const k of Object.keys(next)) {
    if (next[k] === "" || next[k] == null) delete next[k];
  }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(next, null, 2), "utf8");
  return next as T;
}

export interface StoredSms {
  apiKey?: string;
  from?: string;
  patternCode?: string;
  otpVar?: string;
}
export const readSms = () => readJson<StoredSms>("sms.json");
export const writeSms = (patch: StoredSms) => writeJson<StoredSms>("sms.json", patch);

export interface StoredAi {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  /** per-task model overrides: { article, product, tool, image, chat, search } */
  models?: Record<string, string>;
}
export const readAi = () => readJson<StoredAi>("ai.json");
export function writeAi(patch: StoredAi) {
  const cur = readAi();
  const models = patch.models ? { ...cur.models, ...patch.models } : cur.models;
  // reuse object writer for scalar fields, then ensure models is preserved/merged
  const next = writeJson<StoredAi>("ai.json", { ...patch, models: undefined });
  if (models && Object.keys(models).length) {
    next.models = models;
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(path.join(DATA_DIR, "ai.json"), JSON.stringify(next, null, 2), "utf8");
  }
  return next;
}

export interface ShipMethod { id: string; fa: string; en: string; price: number; etaFa: string; etaEn: string; enabled: boolean }
export interface PayMethod { id: string; fa: string; en: string; kind: "online" | "wallet" | "cod"; enabled: boolean }

export interface StoreSettings {
  storeName?: string;
  tagline?: string; // شعار سایت
  currencyFa?: string;
  currencyEn?: string;
  logoUrl?: string;
  faviconUrl?: string;
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogImage?: string;
  shipFee?: number;
  freeShipThreshold?: number;
  taxRate?: number; // percent
  maintenance?: boolean;
  cod?: boolean;
  shippingMethods?: ShipMethod[];
  paymentMethods?: PayMethod[];
}
export const STORE_DEFAULTS: Required<StoreSettings> = {
  storeName: "",
  tagline: "",
  currencyFa: "",
  currencyEn: "",
  logoUrl: "",
  faviconUrl: "",
  metaTitle: "",
  metaDescription: "",
  metaKeywords: "",
  ogImage: "",
  shipFee: 50000,
  freeShipThreshold: 2000000,
  taxRate: 9,
  maintenance: false,
  cod: true,
  shippingMethods: [
    { id: "standard", fa: "ارسال عادی", en: "Standard", price: 50000, etaFa: "۳ تا ۵ روز کاری", etaEn: "3–5 business days", enabled: true },
    { id: "express", fa: "ارسال اکسپرس", en: "Express", price: 120000, etaFa: "تحویل ۲۴ ساعته", etaEn: "24-hour delivery", enabled: true },
  ],
  paymentMethods: [
    { id: "online", fa: "پرداخت آنلاین", en: "Online payment", kind: "online", enabled: true },
    { id: "wallet", fa: "کیف پول", en: "Wallet", kind: "wallet", enabled: true },
    { id: "cod", fa: "پرداخت در محل", en: "Cash on delivery", kind: "cod", enabled: true },
  ],
};
export function readStore(): Required<StoreSettings> {
  return { ...STORE_DEFAULTS, ...readJson<StoreSettings>("store.json") };
}
export function writeStore(patch: StoreSettings) {
  const cur = readJson<StoreSettings>("store.json");
  const next = { ...cur, ...patch };
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, "store.json"), JSON.stringify(next, null, 2), "utf8");
  return readStore();
}

/** Whether a data file already exists (used to seed only on first run). */
export function hasFile(file: string): boolean {
  try {
    return fs.existsSync(path.join(DATA_DIR, file));
  } catch {
    return false;
  }
}

/** Generic raw JSON array read/write (used for products & coupons). */
export function readArray<T>(file: string, fallback: T[]): T[] {
  try {
    const v = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf8"));
    return Array.isArray(v) ? (v as T[]) : fallback;
  } catch {
    return fallback;
  }
}
export function writeArray<T>(file: string, arr: T[]): T[] {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(arr, null, 2), "utf8");
  return arr;
}

export function listUsers(): string[] {
  try {
    return fs
      .readdirSync(path.join(DATA_DIR, "users"))
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(/\.json$/, ""));
  } catch {
    return [];
  }
}
