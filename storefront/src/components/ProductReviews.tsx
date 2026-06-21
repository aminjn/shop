"use client";

import { useEffect, useState } from "react";
import { useShop } from "@/lib/store";
import { formatDate } from "@/lib/format";

interface Review {
  id: number;
  author: string;
  rating: number;
  text: string;
  date: string;
  reply?: string;
}

const stars = (n: number) => "★★★★★".slice(0, Math.round(n)) + "☆☆☆☆☆".slice(0, 5 - Math.round(n));

export function ProductReviews({ productId, fallbackRating, fallbackCount }: { productId: number; fallbackRating: number; fallbackCount: number }) {
  const { locale, toast } = useShop();
  const fa = locale === "fa";
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<{ avg: number; count: number }>({ avg: 0, count: 0 });
  const [loggedIn, setLoggedIn] = useState(false);

  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () =>
    fetch(`/api/reviews?productId=${productId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.ok) { setReviews(d.reviews); setStats(d.stats); } })
      .catch(() => {});
  useEffect(() => {
    load();
    fetch("/api/auth/me").then((r) => (r.ok ? r.json() : null)).then((d) => setLoggedIn(Boolean(d?.session))).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const submit = async () => {
    if (!text.trim()) { toast(fa ? "متن نظر را بنویس" : "Write your review"); return; }
    if (!loggedIn && !author.trim()) { toast(fa ? "نام را وارد کن" : "Enter your name"); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/reviews", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId, rating, text: text.trim(), author: author.trim() }) });
      const d = await r.json().catch(() => ({}));
      if (d.ok) { toast(fa ? "نظر شما ثبت شد و پس از تأیید نمایش داده می‌شود ✓" : "Submitted; visible after approval ✓"); setText(""); setAuthor(""); setRating(5); }
      else toast(fa ? "ثبت نظر ناموفق بود" : "Failed");
    } catch { toast(fa ? "خطای شبکه" : "Network error"); } finally { setBusy(false); }
  };

  const avg = stats.count ? stats.avg : fallbackRating;
  const count = stats.count || fallbackCount;
  const input = { background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" } as const;

  return (
    <div className="max-w-[760px]">
      {/* summary */}
      <div className="mb-5 flex items-center gap-3">
        <span className="text-[28px] font-extrabold">{avg ? avg.toLocaleString(fa ? "fa-IR" : "en-US") : "—"}</span>
        <div>
          <div className="text-[15px]" style={{ color: "#f59e0b", letterSpacing: 2 }}>{stars(avg)}</div>
          <div className="text-[12.5px]" style={{ color: "var(--muted)" }}>{fa ? `${count.toLocaleString("fa-IR")} نظر` : `${count} reviews`}</div>
        </div>
      </div>

      {/* list */}
      {reviews.length > 0 ? (
        <div className="mb-7 flex flex-col gap-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-[14px] p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between">
                <span className="text-[13.5px] font-bold">{r.author}</span>
                <span className="text-[12px]" style={{ color: "var(--muted)" }}>{formatDate(r.date, locale, { year: "numeric", month: "short", day: "numeric" })}</span>
              </div>
              <div className="mt-1 text-[13px]" style={{ color: "#f59e0b", letterSpacing: 1 }}>{stars(r.rating)}</div>
              <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: "var(--text)", textAlign: "start" }}>{r.text}</p>
              {r.reply && (
                <div className="mt-2 rounded-[10px] p-2.5 text-[12.5px]" style={{ background: "var(--surface2)" }}>
                  <b style={{ color: "var(--accent)" }}>{fa ? "پاسخ فروشگاه: " : "Reply: "}</b>{r.reply}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-7 text-[14px]" style={{ color: "var(--muted)" }}>{fa ? "هنوز نظری ثبت نشده. اولین نفر باش!" : "No reviews yet. Be the first!"}</p>
      )}

      {/* form */}
      <div className="rounded-[16px] p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <h3 className="mb-3 text-[15px] font-extrabold">{fa ? "ثبت نظر شما" : "Write a review"}</h3>
        <div className="mb-3 flex items-center gap-2">
          <span className="text-[13px]" style={{ color: "var(--muted)" }}>{fa ? "امتیاز:" : "Rating:"}</span>
          <div className="flex" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} aria-label={`${n}`} className="cursor-pointer border-none bg-transparent px-0.5 text-[22px] leading-none" style={{ color: (hover || rating) >= n ? "#f59e0b" : "var(--border)" }}>★</button>
            ))}
          </div>
        </div>
        {!loggedIn && (
          <input className="mb-2 w-full rounded-[10px] px-3 py-2.5 text-[14px] outline-none" style={input} value={author} onChange={(e) => setAuthor(e.target.value)} placeholder={fa ? "نام شما" : "Your name"} />
        )}
        <textarea className="mb-3 w-full rounded-[10px] px-3 py-2.5 text-[14px] outline-none" style={{ ...input, minHeight: 90, resize: "vertical" }} value={text} onChange={(e) => setText(e.target.value)} placeholder={fa ? "تجربه‌ات از این محصول را بنویس…" : "Share your experience…"} />
        <button onClick={submit} disabled={busy} className="cursor-pointer rounded-[11px] border-none px-6 py-2.5 text-[14px] font-extrabold text-white disabled:opacity-60" style={{ background: "var(--accent)" }}>
          {busy ? (fa ? "در حال ثبت…" : "Submitting…") : fa ? "ثبت نظر" : "Submit"}
        </button>
        <p className="mt-2 text-[11.5px]" style={{ color: "var(--muted)" }}>{fa ? "نظر شما پس از تأیید مدیر نمایش داده می‌شود." : "Your review appears after approval."}</p>
      </div>
    </div>
  );
}
