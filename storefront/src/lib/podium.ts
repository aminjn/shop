import "server-only";
import fs from "node:fs";
import path from "node:path";

/* Pod.ir / Podium → Shahkar (شاهکار) + civil-registry identity lookup.
   Config is read from DATA_DIR/podium.json (set in super admin) with a fallback
   to process.env, so secrets live in the data volume, never in the repo. */

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "podium.json");

export interface PodiumConfig {
  url: string;
  token: string;
  idKey: string;
  matchKey: string;
  idProduct: string;
  matchProduct: string;
}

const DEFAULT_URL = "https://api.pod.ir/srv/sc2/consumers/services/do";

function readFileCfg(): Partial<PodiumConfig> {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8")) as Partial<PodiumConfig>;
  } catch {
    return {};
  }
}

function cfg(): PodiumConfig {
  const f = readFileCfg();
  const pick = (fileVal: unknown, env: string, dflt = "") =>
    (typeof fileVal === "string" && fileVal.trim()) || (process.env[env] || "").trim() || dflt;
  return {
    url: pick(f.url, "PODIUM_URL", DEFAULT_URL),
    token: pick(f.token, "PODIUM_TOKEN"),
    idKey: pick(f.idKey, "GET_IDENTITY_INFO_API_KEY"),
    matchKey: pick(f.matchKey, "MATCH_NATIONAL_ID_AND_PHONE_NUMBER_API_KEY"),
    idProduct: pick(f.idProduct, "POD_IDENTITY_PRODUCT_ID", "46659320"),
    matchProduct: pick(f.matchProduct, "POD_MATCH_PRODUCT_ID", "46645324"),
  };
}

/** Read config for the admin UI — secrets masked. */
export function readPodiumPublic() {
  const c = cfg();
  const mask = (v: string) => (v ? "•••• " + v.slice(-6) : "");
  return {
    configured: podConfigured(),
    missing: podMissing(),
    url: c.url,
    idProduct: c.idProduct,
    matchProduct: c.matchProduct,
    tokenMasked: mask(c.token),
    idKeyMasked: mask(c.idKey),
    matchKeyMasked: mask(c.matchKey),
  };
}

/** Persist config (only non-empty fields overwrite existing ones). */
export function writePodium(patch: Partial<PodiumConfig>): void {
  const cur = readFileCfg();
  const next: Partial<PodiumConfig> = { ...cur };
  for (const k of ["url", "token", "idKey", "matchKey", "idProduct", "matchProduct"] as const) {
    const v = patch[k];
    if (typeof v === "string" && v.trim()) next[k] = v.trim();
  }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(next, null, 2), "utf8");
  fs.renameSync(tmp, FILE);
}

export function podConfigured(): boolean {
  const c = cfg();
  return Boolean(c.token && c.idKey && c.matchKey);
}
export function podMissing(): string[] {
  const c = cfg();
  const m: string[] = [];
  if (!c.token) m.push("PODIUM_TOKEN");
  if (!c.idKey) m.push("GET_IDENTITY_INFO_API_KEY");
  if (!c.matchKey) m.push("MATCH_NATIONAL_ID_AND_PHONE_NUMBER_API_KEY");
  return m;
}

type PodiumResponse = { hasError?: boolean; message?: string; httpStatusCode?: number; result?: string };

async function callPodium(payload: unknown): Promise<PodiumResponse> {
  const c = cfg();
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch(c.url, {
      method: "POST",
      headers: { Authorization: `bearer ${c.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    return (await res.json()) as PodiumResponse;
  } finally {
    clearTimeout(to);
  }
}

export interface Identity {
  nationalCode: string;
  firstName: string;
  lastName: string;
  fatherName?: string;
  gender?: string;
  birthPlace?: string;
  birthDate?: string;
  raw?: Record<string, unknown>;
}

/** Civil-registry lookup: national code + 8-digit Jalali birth date (YYYYMMDD). */
export async function getIdentity(nationalCode: string, jBirthDate: string): Promise<{ ok: boolean; identity?: Identity; error?: string }> {
  if (!podConfigured()) return { ok: false, error: "POD_NOT_CONFIGURED" };
  try {
    const data = await callPodium({ productEntityId: Number(cfg().idProduct), apiKey: cfg().idKey, providerParameters: { nationalCode, birthDate: jBirthDate } });
    if (data.hasError || !data.result) return { ok: false, error: data.message || "سرویس استعلام در دسترس نیست." };
    const parsed = JSON.parse(data.result) as { identityInfo?: Record<string, unknown>; message?: string };
    if (!parsed || !parsed.identityInfo) return { ok: false, error: parsed?.message || "کد ملی یا تاریخ تولد نادرست است." };
    const i = parsed.identityInfo as Record<string, unknown>;
    if (i.alive === false) return { ok: false, error: "شخصِ موردنظر در سامانه فوت‌شده ثبت شده است." };
    return {
      ok: true,
      identity: {
        nationalCode: String(i.nationalCode || nationalCode),
        firstName: String(i.firstName || ""),
        lastName: String(i.lastName || ""),
        fatherName: String(i.fatherName || ""),
        gender: String(i.gender || "").toLowerCase(),
        birthPlace: String(i.birthPlace || ""),
        birthDate: String(i.birthDate || jBirthDate || ""),
        raw: i,
      },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "IDENTITY_FETCH_ERROR" };
  }
}

/** Shahkar match: is this mobile registered to this national code? */
export async function shahkarMatch(nationalCode: string, mobileNumber: string): Promise<{ ok: boolean; matched: boolean; error?: string }> {
  if (!podConfigured()) return { ok: false, matched: false, error: "POD_NOT_CONFIGURED" };
  try {
    const data = await callPodium({ productEntityId: cfg().matchProduct, apiKey: cfg().matchKey, providerParameters: { body: { nationalCode, mobileNumber } } });
    if (!data.result) return { ok: false, matched: false, error: data.message || "سرویس شاهکار پاسخ نداد." };
    const parsed = JSON.parse(data.result) as { matched?: boolean };
    return { ok: true, matched: Boolean(parsed && parsed.matched) };
  } catch (e) {
    return { ok: false, matched: false, error: e instanceof Error ? e.message : "MATCH_FETCH_ERROR" };
  }
}

/** Iranian national-id checksum (offline validation before any API call). */
export function isValidNationalId(input: string): boolean {
  let code = String(input);
  const L = code.length;
  if (L < 8 || parseInt(code, 10) === 0) return false;
  code = ("0000" + code).substr(L + 4 - 10);
  if (parseInt(code.substr(3, 6), 10) === 0) return false;
  const c = parseInt(code.substr(9, 1), 10);
  let s = 0;
  for (let i = 0; i < 9; i++) s += parseInt(code.substr(i, 1), 10) * (10 - i);
  s = s % 11;
  return (s < 2 && c === s) || (s >= 2 && c === 11 - s);
}
