"use client";

import { useState } from "react";
import { useShop } from "@/lib/store";
import { User, ArrowBack, Check } from "@/components/Icons";
import { LocaleLink } from "@/components/LocaleLink";

export default function LoginPage() {
  const { locale } = useShop();
  const fa = locale === "fa";
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [devCode, setDevCode] = useState("");

  const tr = (f: string, e: string) => (fa ? f : e);

  const requestOtp = async () => {
    setMsg("");
    setLoading(true);
    try {
      const r = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mobile }),
      });
      const d = await r.json();
      if (!d.ok) {
        setMsg(d.error === "invalid-mobile" ? tr("شماره موبایل معتبر نیست", "Invalid mobile number") : tr("ارسال کد ناموفق بود", "Failed to send code"));
        return;
      }
      if (d.devCode) setDevCode(d.devCode);
      setStep("otp");
      setMsg(tr("کد تأیید برای شما پیامک شد", "A verification code was sent to you"));
    } catch {
      setMsg(tr("خطای شبکه", "Network error"));
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setMsg("");
    setLoading(true);
    try {
      const r = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mobile, code }),
      });
      const d = await r.json();
      if (!d.ok) {
        setMsg(d.error === "expired" ? tr("کد منقضی شده؛ دوباره تلاش کنید", "Code expired, try again") : tr("کد وارد شده اشتباه است", "Incorrect code"));
        return;
      }
      // full navigation so header re-reads auth state
      const dest = d.role === "super_admin" ? "admin" : "account";
      window.location.href = `/${locale}/${dest}`;
    } catch {
      setMsg(tr("خطای شبکه", "Network error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-[440px] flex-col px-[22px] py-16">
      <div className="rounded-[18px] p-7" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[18px] text-white" style={{ background: "var(--accent)" }}>
          <User size={30} />
        </div>
        <h1 className="mt-4 text-center text-[22px] font-extrabold">{tr("ورود / ثبت‌نام", "Sign in / Sign up")}</h1>
        <p className="mt-1 text-center text-[13.5px]" style={{ color: "var(--muted)" }}>
          {step === "mobile" ? tr("شماره موبایلت را وارد کن تا کد تأیید بفرستیم", "Enter your mobile to receive a verification code") : tr("کد ۵ رقمی پیامک‌شده را وارد کن", "Enter the 5-digit code we texted you")}
        </p>

        {step === "mobile" ? (
          <div className="mt-6 flex flex-col gap-3">
            <input
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && requestOtp()}
              inputMode="tel"
              dir="ltr"
              placeholder="0912xxxxxxx"
              className="rounded-[12px] px-4 py-3.5 text-center text-[16px] tracking-widest outline-none"
              style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
            <button onClick={requestOtp} disabled={loading} className="cursor-pointer rounded-[12px] border-none py-3.5 text-[15px] font-extrabold text-white disabled:opacity-60" style={{ background: "var(--accent)" }}>
              {loading ? tr("در حال ارسال…", "Sending…") : tr("ارسال کد تأیید", "Send code")}
            </button>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
              onKeyDown={(e) => e.key === "Enter" && verify()}
              inputMode="numeric"
              dir="ltr"
              placeholder="-----"
              className="rounded-[12px] px-4 py-3.5 text-center text-[22px] font-bold tracking-[0.5em] outline-none"
              style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
            {devCode && (
              <div className="rounded-[10px] p-2.5 text-center text-[12.5px]" style={{ background: "var(--surface2)", color: "var(--muted)" }}>
                {tr("حالت تست (پیامک تنظیم نشده): کد", "Test mode (SMS not configured): code")} <b style={{ color: "var(--accent)" }}>{devCode}</b>
              </div>
            )}
            <button onClick={verify} disabled={loading} className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[12px] border-none py-3.5 text-[15px] font-extrabold text-white disabled:opacity-60" style={{ background: "var(--accent)" }}>
              <Check size={18} /> {loading ? tr("در حال بررسی…", "Verifying…") : tr("ورود", "Sign in")}
            </button>
            <button onClick={() => { setStep("mobile"); setCode(""); setMsg(""); setDevCode(""); }} className="inline-flex cursor-pointer items-center justify-center gap-1.5 border-none bg-transparent text-[13px] font-bold" style={{ color: "var(--accent)" }}>
              <ArrowBack size={15} /> {tr("ویرایش شماره", "Change number")}
            </button>
          </div>
        )}

        {msg && <div className="mt-4 text-center text-[13px] font-semibold" style={{ color: "var(--muted)" }}>{msg}</div>}
      </div>

      <LocaleLink href="/" className="mt-5 inline-flex items-center justify-center gap-1.5 text-[13.5px] font-bold no-underline" style={{ color: "var(--muted)" }}>
        <ArrowBack size={15} /> {tr("بازگشت به خانه", "Back to home")}
      </LocaleLink>
    </div>
  );
}
