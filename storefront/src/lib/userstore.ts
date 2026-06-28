import "server-only";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { readStore, readLoyalty } from "./settings";

/** Live store name (set in super admin) with a neutral fallback. */
function storeName(): string {
  try { return readStore().storeName || "فروشگاه"; } catch { return "فروشگاه"; }
}
/** Sign-up bonus points configured in the loyalty program (0 if disabled). */
function signupBonus(): number {
  try { const l = readLoyalty(); return l.enabled ? Math.max(0, l.signupBonus || 0) : 0; } catch { return 0; }
}

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const USERS_DIR = path.join(DATA_DIR, "users");

export interface Address {
  id: string;
  title: string;
  receiver: string;
  phone: string;
  province: string;
  city: string;
  postal: string;
  address: string;
  isDefault: boolean;
}
export interface Txn {
  id: string;
  type: "topup" | "withdraw" | "order" | "refund";
  amount: number;
  date: string;
  note?: string;
}
export interface OrderItem {
  id: number;
  name: string;
  qty: number;
  price: number;
}
export type OrderStatus = "processing" | "shipped" | "delivered" | "cancelled";
export interface Order {
  id: string;
  date: string;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  payment: string;
  shipping: string;
}
export interface TicketReply {
  from: "user" | "support";
  body: string;
  date: string;
}
export interface Ticket {
  id: string;
  subject: string;
  body: string;
  status: "open" | "answered" | "closed";
  date: string;
  replies: TicketReply[];
}
export interface AppNotification {
  id: string;
  text: string;
  date: string;
  read: boolean;
}
/** Official identity from Shahkar / civil registry — written ONCE at sign-up,
 *  immutable afterwards (the customer can never edit it). */
export interface UserIdentity {
  nationalId: string;
  firstName: string;
  lastName: string;
  fatherName?: string;
  gender?: string;
  birthDate?: string;
  birthPlace?: string;
  raw?: Record<string, unknown>;
  verifiedAt: string;
}
export interface UserData {
  mobile: string;
  status?: "active" | "blocked";
  profile: { firstName: string; lastName: string; email: string; avatar?: string };
  identity?: UserIdentity;
  addresses: Address[];
  wallet: { balance: number; txns: Txn[] };
  orders: Order[];
  tickets: Ticket[];
  notifications: AppNotification[];
  points: number;
  createdAt: string;
}

/** A half-finished registration awaiting OTP, after Shahkar verification. */
export interface PendingRegistration {
  mobile: string;
  identity: UserIdentity;
  matched: boolean;
  createdAt: string;
}

export const uid = () => crypto.randomBytes(6).toString("hex");
export const nowIso = () => new Date().toISOString();

function fileFor(mobile: string) {
  const safe = mobile.replace(/[^0-9]/g, "");
  return path.join(USERS_DIR, `${safe}.json`);
}

function defaultUser(mobile: string): UserData {
  return {
    mobile,
    profile: { firstName: "", lastName: "", email: "" },
    addresses: [],
    wallet: { balance: 0, txns: [] },
    orders: [],
    tickets: [],
    notifications: [
      {
        id: uid(),
        text: signupBonus() > 0
          ? `به ${storeName()} خوش آمدید! ${signupBonus().toLocaleString("fa-IR")} امتیاز هدیهٔ عضویت دریافت کردید.`
          : `به ${storeName()} خوش آمدید!`,
        date: nowIso(),
        read: false,
      },
    ],
    points: signupBonus(),
    createdAt: nowIso(),
  };
}

/** Whether a real account file already exists for this mobile. */
export function userExists(mobile: string): boolean {
  try {
    return fs.existsSync(fileFor(mobile.replace(/[^0-9]/g, "")));
  } catch {
    return false;
  }
}

const PENDING_DIR = path.join(DATA_DIR, "pending");
function pendingFile(mobile: string) {
  return path.join(PENDING_DIR, `${mobile.replace(/[^0-9]/g, "")}.json`);
}
export function getPending(mobile: string): PendingRegistration | null {
  try {
    return JSON.parse(fs.readFileSync(pendingFile(mobile), "utf8")) as PendingRegistration;
  } catch {
    return null;
  }
}
export function setPending(p: PendingRegistration): void {
  fs.mkdirSync(PENDING_DIR, { recursive: true });
  const tmp = pendingFile(p.mobile) + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(p, null, 2), "utf8");
  fs.renameSync(tmp, pendingFile(p.mobile));
}
export function deletePending(mobile: string): void {
  try { fs.unlinkSync(pendingFile(mobile)); } catch { /* ignore */ }
}

/** Permanently remove a customer account file. */
export function deleteUser(mobile: string): void {
  try { fs.unlinkSync(fileFor(mobile)); } catch { /* ignore */ }
}

export function getUser(mobile: string): UserData {
  try {
    const raw = JSON.parse(fs.readFileSync(fileFor(mobile), "utf8")) as UserData;
    const u = { ...defaultUser(mobile), ...raw, mobile };
    // migrate leftover template branding to the real store name
    if (Array.isArray(u.notifications)) {
      u.notifications = u.notifications.map((n) =>
        n.text && n.text.includes("مارکت‌لند")
          ? { ...n, text: n.text.replace(/مارکت‌لند/g, storeName()) }
          : n,
      );
    }
    return u;
  } catch {
    return defaultUser(mobile);
  }
}

export function saveUser(data: UserData): UserData {
  fs.mkdirSync(USERS_DIR, { recursive: true });
  fs.writeFileSync(fileFor(data.mobile), JSON.stringify(data, null, 2), "utf8");
  return data;
}

export function updateUser(
  mobile: string,
  fn: (u: UserData) => void,
): UserData {
  const u = getUser(mobile);
  fn(u);
  return saveUser(u);
}

export function notify(u: UserData, text: string) {
  u.notifications.unshift({ id: uid(), text, date: nowIso(), read: false });
}
