"use client";

import { useRef, useState } from "react";
import { useShop } from "@/lib/store";
import { User, ArrowBack, Check } from "@/components/Icons";
import { LocaleLink } from "@/components/LocaleLink";

type Step = "mobile" | "shahkar" | "otp";
const onlyDigits = (s: string) => s.replace(/[^\d۰-۹]/g, "");

export default function LoginPage() {
  const { locale } = useShop();
  const fa = locale === "fa";
  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState("");
  const [nid, setNid] = useState("");
  const [by, setBy] = useState(""); const [bm, setBm] = useState(""); const [bd, setBd] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const yRef = useRef<HTMLInputElement>(null);
  const mRef = useRef<HTMLInputElement>(null);
  const dRef = useRef<HTMLInputElement>(null);

  const tr = (f: string, e: string) => (fa ? f : e);

  const start = async () => {
    setMsg(""); setLoading(true);
    try {
      const r = await fetch("/api/auth/request-otp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mobile }) });
      const d = await r.json();
      if (!d.ok) {
        setMsg(d.error === "invalid-mobile" ? tr("شماره موبایل معتبر نیست", "Invalid mobile")
          : d.error === "sms-not-configured" ? tr("سرویس پیامک هنوز تنظیم نشده است", "SMS not configured")
          : tr("ارسال کد ناموفق بود", "Failed to send code"));
        return;
      }
      if (d.exists) { setStep("otp"); setMsg(tr("کد تأیید برایت پیامک شد", "A code was sent to you")); }
      else { setStep("shahkar"); setMsg(tr("برای ثبت‌نام، هویتت را تأیید کن (شاهکار)", "Verify your identity to register")); }
    } catch { setMsg(tr("خطای شبکه", "Network error")); } finally { setLoading(false); }
  };

  const shahkar = async () => {
    const y = onlyDigits(by), m = onlyDigits(bm), d = onlyDigits(bd);
    if (y.length !== 4 || !m || !d) { setMsg(tr("تاریخ تولدِ شمسی را کامل وارد کن", "Enter your full Jalali birth date")); return; }
    const birthDate = y + m.padStart(2, "0") + d.padStart(2, "0");
    setMsg(""); setLoading(true);
    try {
      const r = await fetch("/api/auth/shahkar", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mobile, nationalCode: nid, birthDate }) });
      const dd = await r.json();
      if (!dd.ok) { setMsg(dd.error || tr("تأیید هویت ناموفق بود", "Identity verification failed")); return; }
      setStep("otp");
      setMsg(tr(`هویتت تأیید شد ✓ کد پیامک‌شده را وارد کن`, "Identity verified ✓ enter the code"));
    } catch { setMsg(tr("خطای شبکه", "Network error")); } finally { setLoading(false); }
  };

  const verify = async () => {
    setMsg(""); setLoading(true);
    try {
      const r = await fetch("/api/auth/verify-otp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mobile, code }) });
      const d = await r.json();
      if (!d.ok) {
        setMsg(d.error === "expired" ? tr("کد منقضی شده؛ دوباره تلاش کن", "Code expired")
          : d.error === "needs-identity" ? tr("ابتدا هویتت را با شاهکار تأیید کن", "Verify your identity first")
          : d.error === "blocked" ? tr("حساب شما مسدود شده است؛ با پشتیبانی تماس بگیرید", "Your account is blocked; contact support")
          : tr("کد وارد شده اشتباه است", "Incorrect code"));
        return;
      }
      const dest = d.role === "super_admin" ? "admin" : "account";
      window.location.href = `/${locale}/${dest}`;
    } catch { setMsg(tr("خطای شبکه", "Network error")); } finally { setLoading(false); }
  };

  const fieldStyle = { background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" } as const;

  return (
    <div className="mx-auto flex max-w-[440px] flex-col px-[22px] py-16">
      <div className="rounded-[18px] p-7" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[18px] text-white" style={{ background: "var(--accent)" }}>
          <User size={30} />
        </div>
        <h1 className="mt-4 text-center text-[22px] font-extrabold">{tr("ورود / ثبت‌نام", "Sign in / Sign up")}</h1>
        <p className="mt-1 text-center text-[13.5px]" style={{ color: "var(--muted)" }}>
          {step === "mobile" ? tr("شماره موبایلت را وارد کن", "Enter your mobile number")
            : step === "shahkar" ? tr("کد ملی و تاریخ تولد (شمسی) را وارد کن", "Enter your national code & Jalali birth date")
            : tr("کد ۵ رقمی پیامک‌شده را وارد کن", "Enter the 5-digit code")}
        </p>

        {step === "mobile" && (
          <div className="mt-6 flex flex-col gap-3">
            <input value={mobile} onChange={(e) => setMobile(e.target.value)} onKeyDown={(e) => e.key === "Enter" && start()} inputMode="tel" dir="ltr" placeholder="0912xxxxxxx" className="rounded-[12px] px-4 py-3.5 text-center text-[16px] tracking-widest outline-none" style={fieldStyle} />
            <button onClick={start} disabled={loading} className="cursor-pointer rounded-[12px] border-none py-3.5 text-[15px] font-extrabold text-white disabled:opacity-60" style={{ background: "var(--accent)" }}>
              {loading ? tr("لطفاً صبر کن…", "Please wait…") : tr("ادامه", "Continue")}
            </button>
          </div>
        )}

        {step === "shahkar" && (
          <div className="mt-6 flex flex-col gap-3">
            <input value={nid} onChange={(e) => { const v = onlyDigits(e.target.value).slice(0, 10); setNid(v); if (v.length === 10) yRef.current?.focus(); }} inputMode="numeric" dir="ltr" placeholder={tr("کد ملی (۱۰ رقم)", "National code (10 digits)")} className="rounded-[12px] px-4 py-3.5 text-center text-[16px] tracking-wider outline-none" style={fieldStyle} />
            <div className="text-[12.5px] font-bold" style={{ color: "var(--muted)" }}>{tr("تاریخ تولد (شمسی)", "Birth date (Jalali)")}</div>
            <div className="grid grid-cols-3 gap-2" dir="ltr">
              <input ref={yRef} value={by} onChange={(e) => { const v = onlyDigits(e.target.value).slice(0, 4); setBy(v); if (v.length === 4) mRef.current?.focus(); }} inputMode="numeric" placeholder={tr("سال ۱۳۷۰", "Year")} className="rounded-[12px] px-2 py-3 text-center text-[15px] outline-none" style={fieldStyle} />
              <input ref={mRef} value={bm} onChange={(e) => { const v = onlyDigits(e.target.value).slice(0, 2); setBm(v); if (v.length === 2) dRef.current?.focus(); }} inputMode="numeric" placeholder={tr("ماه", "Month")} className="rounded-[12px] px-2 py-3 text-center text-[15px] outline-none" style={fieldStyle} />
              <input ref={dRef} value={bd} onChange={(e) => setBd(onlyDigits(e.target.value).slice(0, 2))} onKeyDown={(e) => e.key === "Enter" && shahkar()} inputMode="numeric" placeholder={tr("روز", "Day")} className="rounded-[12px] px-2 py-3 text-center text-[15px] outline-none" style={fieldStyle} />
            </div>
            <button onClick={shahkar} disabled={loading} className="cursor-pointer rounded-[12px] border-none py-3.5 text-[15px] font-extrabold text-white disabled:opacity-60" style={{ background: "var(--accent)" }}>
              {loading ? tr("در حال استعلام…", "Verifying…") : tr("تأیید هویت و دریافت کد", "Verify & get code")}
            </button>
            <button onClick={() => { setStep("mobile"); setMsg(""); }} className="inline-flex cursor-pointer items-center justify-center gap-1.5 border-none bg-transparent text-[13px] font-bold" style={{ color: "var(--accent)" }}>
              <ArrowBack size={15} /> {tr("ویرایش شماره", "Change number")}
            </button>
          </div>
        )}

        {step === "otp" && (
          <div className="mt-6 flex flex-col gap-3">
            <input value={code} onChange={(e) => setCode(onlyDigits(e.target.value).slice(0, 5))} onKeyDown={(e) => e.key === "Enter" && verify()} inputMode="numeric" dir="ltr" placeholder="-----" className="rounded-[12px] px-4 py-3.5 text-center text-[22px] font-bold tracking-[0.5em] outline-none" style={fieldStyle} />
            <button onClick={verify} disabled={loading} className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[12px] border-none py-3.5 text-[15px] font-extrabold text-white disabled:opacity-60" style={{ background: "var(--accent)" }}>
              <Check size={18} /> {loading ? tr("در حال بررسی…", "Verifying…") : tr("ورود", "Sign in")}
            </button>
            <button onClick={() => { setStep("mobile"); setCode(""); setMsg(""); }} className="inline-flex cursor-pointer items-center justify-center gap-1.5 border-none bg-transparent text-[13px] font-bold" style={{ color: "var(--accent)" }}>
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
