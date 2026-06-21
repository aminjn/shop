import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";

const SECRET = process.env.SESSION_SECRET || "dev-insecure-secret-change-me";
export const SESSION_COOKIE = "shopx_session";
export const OTP_COOKIE = "shopx_otp";

export type Role = "super_admin" | "customer";
export interface Session {
  mobile: string;
  role: Role;
  exp: number; // epoch seconds
}

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString("base64url");
}
function sign(data: string): string {
  return crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
}
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

/** Encode an arbitrary payload as `<b64url(json)>.<hmac>`. */
export function seal(payload: unknown): string {
  const body = b64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}
export function unseal<T>(token: string | undefined | null): T | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  if (!safeEqual(sig, sign(body))) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString()) as T;
  } catch {
    return null;
  }
}

/** Normalize Iranian mobile numbers to local `09xxxxxxxxx` form. */
export function normalizeMobile(raw: string): string | null {
  let m = (raw || "").replace(/[\s\-()]/g, "");
  m = m.replace(/^\+98/, "0").replace(/^0098/, "0");
  if (/^98\d{10}$/.test(m)) m = "0" + m.slice(2);
  if (/^9\d{9}$/.test(m)) m = "0" + m;
  return /^09\d{9}$/.test(m) ? m : null;
}

/** Convert a normalized local number to E.164 (+98...). */
export function toE164(localMobile: string): string {
  return "+98" + localMobile.slice(1);
}

export function superAdminMobile(): string {
  return normalizeMobile(process.env.SUPER_ADMIN_MOBILE || "09122862184")!;
}
export function isSuperAdmin(mobile: string): boolean {
  const n = normalizeMobile(mobile);
  return !!n && n === superAdminMobile();
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const s = unseal<Session>(store.get(SESSION_COOKIE)?.value);
  if (!s || s.exp < Math.floor(Date.now() / 1000)) return null;
  return s;
}

export async function setSession(mobile: string, role: Role) {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30; // 30 days
  const store = await cookies();
  store.set(SESSION_COOKIE, seal({ mobile, role, exp } satisfies Session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** One-way hash of an OTP bound to a mobile (never store the plain code). */
export function hashOtp(code: string, mobile: string): string {
  return crypto.createHash("sha256").update(`${code}|${mobile}|${SECRET}`).digest("hex");
}

export interface OtpChallenge {
  m: string;
  h: string;
  exp: number;
}
