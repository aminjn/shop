import "server-only";
import fs from "node:fs";
import path from "node:path";

/** Persisted settings live here. Mount a volume at this path in Docker so
 *  changes survive redeploys (e.g. -v /opt/shop-data:/app/data). */
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const SMS_FILE = path.join(DATA_DIR, "sms.json");

export interface StoredSms {
  apiKey?: string;
  from?: string;
  patternCode?: string;
  otpVar?: string;
}

export function readSms(): StoredSms {
  try {
    return JSON.parse(fs.readFileSync(SMS_FILE, "utf8")) as StoredSms;
  } catch {
    return {};
  }
}

export function writeSms(patch: StoredSms): StoredSms {
  const next = { ...readSms(), ...patch };
  // drop empty strings so env fallbacks still apply
  for (const k of Object.keys(next) as (keyof StoredSms)[]) {
    if (next[k] === "" || next[k] == null) delete next[k];
  }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(SMS_FILE, JSON.stringify(next, null, 2), "utf8");
  return next;
}
