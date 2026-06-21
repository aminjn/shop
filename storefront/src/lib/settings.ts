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
}
export const readAi = () => readJson<StoredAi>("ai.json");
export const writeAi = (patch: StoredAi) => writeJson<StoredAi>("ai.json", patch);
