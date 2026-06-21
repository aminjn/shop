import "server-only";
import { toE164 } from "./auth";

const BASE = process.env.IPPANEL_BASE_URL || "https://edge.ippanel.com/v1";

export interface SmsConfig {
  apiKey: string;
  from: string;
  patternCode: string;
  otpVar: string;
  configured: boolean;
}

export function smsConfig(): SmsConfig {
  return {
    apiKey: process.env.IPPANEL_API_KEY || "",
    from: process.env.IPPANEL_FROM || "",
    patternCode: process.env.IPPANEL_PATTERN_CODE || "",
    otpVar: process.env.IPPANEL_OTP_VAR || "code",
    configured: Boolean(
      process.env.IPPANEL_API_KEY &&
        process.env.IPPANEL_FROM &&
        process.env.IPPANEL_PATTERN_CODE,
    ),
  };
}

/** Masked, client-safe view of the SMS config. */
export function smsConfigPublic() {
  const c = smsConfig();
  const mask = (v: string) =>
    v ? v.slice(0, 3) + "•".repeat(Math.max(0, v.length - 6)) + v.slice(-3) : "";
  return {
    configured: c.configured,
    from: c.from,
    patternCode: c.patternCode,
    otpVar: c.otpVar,
    apiKeyMasked: mask(c.apiKey),
  };
}

interface SendResult {
  ok: boolean;
  error?: string;
  outboxId?: number;
}

/** Send a pattern (template) SMS via IPPanel. */
export async function sendPattern(
  localMobile: string,
  params: Record<string, string>,
): Promise<SendResult> {
  const c = smsConfig();
  if (!c.configured) {
    return { ok: false, error: "sms-not-configured" };
  }
  try {
    const res = await fetch(`${BASE}/api/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: c.apiKey,
      },
      body: JSON.stringify({
        sending_type: "pattern",
        from_number: c.from,
        code: c.patternCode,
        recipients: [toE164(localMobile)],
        params,
      }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.meta?.status) {
      return { ok: true, outboxId: data?.data?.message_outbox_ids?.[0] };
    }
    return {
      ok: false,
      error: data?.meta?.message || `http ${res.status}`,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network" };
  }
}

/** Send an OTP code using the configured pattern variable. */
export async function sendOtp(localMobile: string, code: string) {
  const c = smsConfig();
  return sendPattern(localMobile, { [c.otpVar]: code });
}
