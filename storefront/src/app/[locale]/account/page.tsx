"use client";

import { useEffect, useState } from "react";
import { useShop } from "@/lib/store";
import { num, priceFmt, grad, formatDate } from "@/lib/format";
import { LocaleLink } from "@/components/LocaleLink";
import { LogoutButton } from "@/components/LogoutButton";
import { ProductCard } from "@/components/ProductCard";
import { UploadButton } from "@/components/UploadButton";
import {
  User, Cart, Heart, Download, Plus, Check, Send, Sparkle, Close,
} from "@/components/Icons";

/* ---- types mirrored from the API ---- */
interface Address { id: string; title: string; receiver: string; phone: string; province: string; city: string; postal: string; address: string; isDefault: boolean }
interface Txn { id: string; type: string; amount: number; date: string; note?: string }
interface OrderItem { id: number; name: string; qty: number; price: number }
interface Order { id: string; date: string; status: string; total: number; items: OrderItem[]; payment: string; shipping: string }
interface Ticket { id: string; subject: string; body: string; status: string; date: string; replies: { from: string; body: string; date: string }[] }
interface Notif { id: string; text: string; date: string; read: boolean }
interface UserData {
  mobile: string;
  profile: { firstName: string; lastName: string; email: string; avatar?: string };
  addresses: Address[];
  wallet: { balance: number; txns: Txn[] };
  orders: Order[];
  tickets: Ticket[];
  notifications: Notif[];
  points: number;
}

type Section =
  | "dashboard" | "assistant" | "orders" | "wallet" | "addresses"
  | "wishlist" | "tickets" | "notifications" | "loyalty" | "profile";

interface Rec { id: number; reason: string }

const TIERS = [
  { key: "bronze", fa: "برنزی", en: "Bronze", min: 0 },
  { key: "silver", fa: "نقره‌ای", en: "Silver", min: 50 },
  { key: "gold", fa: "طلایی", en: "Gold", min: 150 },
  { key: "platinum", fa: "پلاتینیوم", en: "Platinum", min: 400 },
];

export default function AccountPage() {
  const { locale, t, dark, toast, wishlist, productById } = useShop();
  const fa = locale === "fa";
  const [data, setData] = useState<UserData | null>(null);
  const [section, setSection] = useState<Section>("dashboard");

  const load = () =>
    fetch("/api/account")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.user && setData(d.user))
      .catch(() => {});

  useEffect(() => { load(); }, []);

  const post = async (url: string, body?: unknown, okMsg?: string) => {
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const d = await r.json();
      if (d.ok && d.user) { setData(d.user); if (okMsg) toast(okMsg); return d; }
      toast(fa ? "خطا: " + (d.error || "") : "Error: " + (d.error || ""));
      return d;
    } catch {
      toast(fa ? "خطای شبکه" : "Network error");
      return null;
    }
  };

  const dt = (iso: string) => formatDate(iso, locale);

  const fullName = data?.profile.firstName || data?.profile.lastName
    ? `${data?.profile.firstName ?? ""} ${data?.profile.lastName ?? ""}`.trim()
    : data?.mobile ?? "";

  const card = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16 };
  const inputStyle = { background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" };
  const inputCls = "w-full rounded-[10px] px-3 py-2.5 text-[14px] outline-none";

  if (!data) {
    return <div className="mx-auto max-w-[1280px] px-[22px] py-16 text-center" style={{ color: "var(--muted)" }}>{fa ? "در حال بارگذاری…" : "Loading…"}</div>;
  }

  const NAV: { id: Section; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "dashboard", label: t.dashboard, icon: <User size={17} /> },
    { id: "assistant", label: fa ? "دستیار هوشمند" : "AI assistant", icon: <Sparkle size={17} /> },
    { id: "orders", label: t.orders, icon: <Cart size={17} />, badge: data.orders.length },
    { id: "wallet", label: t.wallet, icon: <Download size={17} /> },
    { id: "addresses", label: t.addresses, icon: <Plus size={17} /> },
    { id: "wishlist", label: t.wishlist, icon: <Heart size={17} />, badge: wishlist.length },
    { id: "tickets", label: t.tickets, icon: <Send size={17} />, badge: data.tickets.length },
    { id: "notifications", label: t.notifications, icon: <Sparkle size={17} />, badge: data.notifications.filter((n) => !n.read).length },
    { id: "loyalty", label: t.loyalty, icon: <Sparkle size={17} /> },
    { id: "profile", label: t.profile, icon: <User size={17} /> },
  ];

  function H({ children }: { children: React.ReactNode }) {
    return <h1 className="mb-5 text-[22px] font-extrabold tracking-tight">{children}</h1>;
  }
  function Stat({ label, value }: { label: string; value: string }) {
    return (
      <div className="p-4" style={card}>
        <div className="text-[12.5px]" style={{ color: "var(--muted)" }}>{label}</div>
        <div className="mt-1 text-[20px] font-extrabold">{value}</div>
      </div>
    );
  }
  function statusBadge(status: string) {
    const map: Record<string, [string, string, string]> = {
      processing: ["#d97706", "rgba(217,119,6,.12)", fa ? "در حال پردازش" : "Processing"],
      shipped: ["#0ea5e9", "rgba(14,165,233,.12)", fa ? "ارسال شده" : "Shipped"],
      delivered: ["#1f8a5b", "rgba(31,138,91,.15)", fa ? "تحویل شده" : "Delivered"],
      cancelled: ["#e11d48", "rgba(225,29,72,.12)", fa ? "لغو شده" : "Cancelled"],
    };
    const [c, bg, label] = map[status] || map.processing;
    return <span className="rounded-full px-2.5 py-1 text-[11.5px] font-extrabold" style={{ color: c, background: bg }}>{label}</span>;
  }
  function Empty({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full" style={{ background: "var(--surface2)", color: "var(--muted)" }}>{icon}</span>
        <div className="mt-4 text-[17px] font-extrabold">{title}</div>
        {sub && <div className="mt-1 text-[13.5px]" style={{ color: "var(--muted)" }}>{sub}</div>}
        <LocaleLink href="/shop" className="mt-5 rounded-[12px] px-6 py-3 text-[14px] font-bold text-white no-underline" style={{ background: "var(--accent)" }}>{t.continueShopping}</LocaleLink>
      </div>
    );
  }
  function EmptyMini({ text }: { text: string }) {
    return <div className="py-6 text-center text-[13.5px]" style={{ color: "var(--muted)" }}>{text}</div>;
  }

  function Dashboard() {
    const tier = [...TIERS].reverse().find((x) => data!.points >= x.min) || TIERS[0];
    return (
      <>
        <div className="mb-5 overflow-hidden rounded-[18px] p-6 text-white" style={{ background: grad(255, dark) }}>
          <div className="text-[13px] opacity-90">{t.welcome} 👋</div>
          <div className="mt-1 text-[24px] font-extrabold">{fullName}</div>
          <div className="mt-3 flex flex-wrap gap-4 text-[13px]">
            <span>{fa ? `سطح: ${tier.fa}` : `Tier: ${tier.en}`}</span>
            <span>• {t.yourPoints}: {num(data!.points, locale)}</span>
            <span>• {t.walletBalance}: {priceFmt(data!.wallet.balance, locale, t.currency)}</span>
          </div>
        </div>

        {/* AI assistant CTA — prominent */}
        <button
          onClick={() => setSection("assistant")}
          className="mb-5 flex w-full cursor-pointer items-center gap-4 rounded-[16px] border-none p-5 text-start text-white"
          style={{ background: grad(265, dark) }}
        >
          <span className="flex h-12 w-12 flex-none items-center justify-center rounded-[14px]" style={{ background: "rgba(255,255,255,.2)" }}>
            <Sparkle size={24} />
          </span>
          <span className="flex-1">
            <span className="block text-[16px] font-extrabold">{fa ? "دستیار هوشمند خرید شما" : "Your AI shopping assistant"}</span>
            <span className="block text-[13px] opacity-90">{fa ? "بپرس «سفارشم کجاست؟» یا «چی برام پیشنهاد می‌دی؟»" : "Ask “where is my order?” or “what do you recommend?”"}</span>
          </span>
          <span className="rounded-full px-4 py-2 text-[13px] font-extrabold" style={{ background: "#fff", color: "#111" }}>{fa ? "گفتگو" : "Chat"}</span>
        </button>

        <SmartPicks />

        <div className="mb-5 grid grid-cols-2 gap-3.5 md:grid-cols-4">
          <Stat label={t.orders} value={num(data!.orders.length, locale)} />
          <Stat label={t.walletBalance} value={priceFmt(data!.wallet.balance, locale, t.currency)} />
          <Stat label={t.yourPoints} value={num(data!.points, locale)} />
          <Stat label={t.addresses} value={num(data!.addresses.length, locale)} />
        </div>
        <div className="p-5" style={card}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-extrabold">{t.recentOrders}</h2>
            <button onClick={() => setSection("orders")} className="cursor-pointer border-none bg-transparent text-[13px] font-bold" style={{ color: "var(--accent)" }}>{t.viewAll}</button>
          </div>
          {data!.orders.length === 0 ? (
            <EmptyMini text={fa ? "هنوز سفارشی ثبت نکرده‌اید" : "No orders yet"} />
          ) : (
            <div className="flex flex-col gap-2.5">
              {data!.orders.slice(0, 4).map((o) => (
                <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] px-3 py-2.5" style={{ background: "var(--surface2)" }}>
                  <span className="text-[13.5px] font-bold" dir="ltr">#{o.id}</span>
                  <span className="text-[12.5px]" style={{ color: "var(--muted)" }}>{dt(o.date)}</span>
                  <span className="text-[13.5px] font-extrabold" style={{ color: "var(--accent)" }}>{priceFmt(o.total, locale, t.currency)}</span>
                  {statusBadge(o.status)}
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    );
  }

  function SmartPicks() {
    const [recs, setRecs] = useState<Rec[]>([]);
    useEffect(() => {
      fetch("/api/account/recommend")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => Array.isArray(d?.recommendations) && setRecs(d.recommendations))
        .catch(() => {});
    }, []);
    if (recs.length === 0) return null;
    return (
      <div className="mb-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg text-white" style={{ background: "var(--accent)" }}><Sparkle size={15} /></span>
          <h2 className="text-[15px] font-extrabold">{fa ? "پیشنهادهای هوشمند برای شما" : "AI picks for you"}</h2>
        </div>
        <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
          {recs.map((r) => {
            const p = productById(r.id);
            return p ? <ProductCard key={r.id} p={p} reason={r.reason} /> : null;
          })}
        </div>
      </div>
    );
  }

  function Assistant() {
    const [msgs, setMsgs] = useState<{ role: "user" | "assistant"; content: string }[]>([
      { role: "assistant", content: fa ? `سلام ${fullName}! من دستیار هوشمند خرید تو هستم. می‌تونم وضعیت سفارش‌ها رو بگم، محصول پیشنهاد بدم و به سوال‌هات جواب بدم.` : `Hi ${fullName}! I'm your AI shopping assistant.` },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const chips = fa
      ? ["سفارشم کجاست؟", "چی برام پیشنهاد می‌دی؟", "موجودی کیف پولم چقدره؟", "بهترین تخفیف‌ها"]
      : ["Where is my order?", "What do you recommend?", "My wallet balance?", "Best deals"];

    const send = async (text?: string) => {
      const content = (text ?? input).trim();
      if (!content || loading) return;
      const next = [...msgs, { role: "user" as const, content }];
      setMsgs(next);
      setInput("");
      setLoading(true);
      try {
        const r = await fetch("/api/account/assistant", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messages: next }),
        });
        const d = await r.json();
        setMsgs((m) => [...m, { role: "assistant", content: d.reply || (fa ? "متاسفم، دوباره تلاش کن." : "Sorry, try again.") }]);
      } catch {
        setMsgs((m) => [...m, { role: "assistant", content: fa ? "خطای شبکه" : "Network error" }]);
      } finally {
        setLoading(false);
      }
    };

    return (
      <>
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-[14px] text-white" style={{ background: grad(265, dark) }}><Sparkle size={22} /></span>
          <div>
            <h1 className="text-[20px] font-extrabold tracking-tight">{fa ? "دستیار هوشمند" : "AI assistant"}</h1>
            <div className="text-[12.5px]" style={{ color: "var(--muted)" }}>{fa ? "شخصی‌سازی‌شده بر اساس سفارش‌ها و حساب شما" : "Personalized to your orders & account"}</div>
          </div>
        </div>

        <div className="flex flex-col" style={{ ...card, height: 520 }}>
          <div className="scrollthin flex-1 space-y-2.5 overflow-auto p-4">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[80%] whitespace-pre-wrap rounded-[14px] px-3.5 py-2.5 text-[13.5px] leading-relaxed"
                  style={m.role === "user" ? { background: "var(--accent)", color: "#fff" } : { background: "var(--surface2)", color: "var(--text)" }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && <div className="text-[13px]" style={{ color: "var(--muted)" }}>{fa ? "در حال فکر کردن…" : "Thinking…"}</div>}
          </div>
          <div className="flex flex-wrap gap-2 px-4 pb-2">
            {chips.map((c) => (
              <button key={c} onClick={() => send(c)} className="cursor-pointer rounded-full px-3 py-1.5 text-[12px] font-semibold" style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}>{c}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 p-3" style={{ borderTop: "1px solid var(--border)" }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={fa ? "سوالت را بنویس…" : "Type your question…"} className="flex-1 rounded-[10px] px-3 py-2.5 text-[14px] outline-none" style={inputStyle} />
            <button onClick={() => send()} aria-label="send" className="flex h-[42px] w-[42px] items-center justify-center rounded-[10px] border-none text-white" style={{ background: "var(--accent)", cursor: "pointer" }}><Send size={18} /></button>
          </div>
        </div>
      </>
    );
  }

  function Orders() {
    const [filter, setFilter] = useState("all");
    const filters = [["all", fa ? "همه" : "All"], ["processing", fa ? "در حال پردازش" : "Processing"], ["shipped", fa ? "ارسال شده" : "Shipped"], ["delivered", fa ? "تحویل شده" : "Delivered"], ["cancelled", fa ? "لغو شده" : "Cancelled"]];
    const list = data!.orders.filter((o) => filter === "all" || o.status === filter);
    return (
      <>
        <H>{t.orders}</H>
        <div className="mb-4 flex flex-wrap gap-2">
          {filters.map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)} className="cursor-pointer rounded-full px-3.5 py-1.5 text-[12.5px] font-bold"
              style={{ background: filter === id ? "var(--accent)" : "var(--surface)", color: filter === id ? "#fff" : "var(--text)", border: "1px solid var(--border)" }}>{label}</button>
          ))}
        </div>
        {list.length === 0 ? (
          <Empty icon={<Cart size={34} />} title={fa ? "سفارشی یافت نشد" : "No orders"} sub={fa ? "اولین خریدت را انجام بده" : "Place your first order"} />
        ) : (
          <div className="flex flex-col gap-3.5">
            {list.map((o) => (
              <div key={o.id} className="p-4" style={card}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[14px] font-extrabold" dir="ltr">#{o.id}</span>
                  <span className="text-[12.5px]" style={{ color: "var(--muted)" }}>{dt(o.date)}</span>
                  {statusBadge(o.status)}
                </div>
                <div className="flex flex-col gap-1.5">
                  {o.items.map((it, i) => (
                    <div key={i} className="flex justify-between text-[13px]">
                      <span>{it.name} <span style={{ color: "var(--muted)" }}>×{num(it.qty, locale)}</span></span>
                      <span className="font-bold">{priceFmt(it.price * it.qty, locale, t.currency)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between border-t pt-3" style={{ borderColor: "var(--border)" }}>
                  <span className="text-[13px]" style={{ color: "var(--muted)" }}>{t.grandTotal}</span>
                  <span className="text-[15px] font-extrabold" style={{ color: "var(--accent)" }}>{priceFmt(o.total, locale, t.currency)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  function Wallet() {
    const [amount, setAmount] = useState("");
    const amt = () => Math.max(0, parseInt((amount || "").replace(/\D/g, "")) || 0);
    return (
      <>
        <H>{t.wallet}</H>
        <div className="mb-5 overflow-hidden rounded-[18px] p-6 text-white" style={{ background: grad(255, dark) }}>
          <div className="text-[13px] opacity-90">{t.walletBalance}</div>
          <div className="mt-1 text-[30px] font-black">{priceFmt(data!.wallet.balance, locale, t.currency)}</div>
        </div>
        <div className="mb-5 p-5" style={card}>
          <div className="mb-3 text-[14px] font-bold">{t.topup} / {fa ? "برداشت" : "Withdraw"}</div>
          <div className="flex flex-wrap items-center gap-3">
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={fa ? "مبلغ (تومان)" : "Amount (Toman)"} dir="ltr" className={inputCls} style={{ ...inputStyle, flex: 1, minWidth: 200 }} />
            <button onClick={() => { if (amt()) { post("/api/account/wallet", { action: "topup", amount: amt() }, fa ? "کیف پول شارژ شد ✓" : "Topped up ✓"); setAmount(""); } }} className="cursor-pointer rounded-[10px] border-none px-5 py-2.5 text-[13.5px] font-extrabold text-white" style={{ background: "var(--accent)" }}>{t.topup}</button>
            <button onClick={() => { if (amt()) { post("/api/account/wallet", { action: "withdraw", amount: amt() }, fa ? "برداشت انجام شد ✓" : "Withdrawn ✓"); setAmount(""); } }} className="cursor-pointer rounded-[10px] px-5 py-2.5 text-[13.5px] font-extrabold" style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}>{fa ? "برداشت" : "Withdraw"}</button>
          </div>
        </div>
        <div className="p-5" style={card}>
          <div className="mb-3 text-[14px] font-bold">{fa ? "تراکنش‌ها" : "Transactions"}</div>
          {data!.wallet.txns.length === 0 ? <EmptyMini text={fa ? "تراکنشی ثبت نشده" : "No transactions"} /> : (
            <div className="flex flex-col gap-2">
              {data!.wallet.txns.map((tx) => (
                <div key={tx.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] px-3 py-2.5 text-[13px]" style={{ background: "var(--surface2)" }}>
                  <span className="font-bold">{tx.type === "topup" ? (fa ? "شارژ" : "Top-up") : tx.type === "order" ? (fa ? "خرید" : "Order") : (fa ? "برداشت" : "Withdraw")}</span>
                  <span style={{ color: "var(--muted)" }}>{dt(tx.date)}</span>
                  <span className="font-extrabold" style={{ color: tx.type === "topup" ? "#1f8a5b" : "#e11d48" }}>{tx.type === "topup" ? "+" : "−"}{priceFmt(tx.amount, locale, t.currency)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    );
  }

  function Addresses() {
    const empty = { title: "", receiver: "", phone: "", province: "", city: "", postal: "", address: "" };
    const [form, setForm] = useState(empty);
    const [editId, setEditId] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
    const save = async () => {
      if (!form.receiver || !form.address) { toast(fa ? "گیرنده و آدرس الزامی است" : "Receiver and address required"); return; }
      await post("/api/account/address", { action: editId ? "update" : "add", id: editId, ...form }, t.saved);
      setOpen(false); setForm(empty); setEditId(null);
    };
    return (
      <>
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-[22px] font-extrabold tracking-tight">{t.addresses}</h1>
          <button onClick={() => { setForm(empty); setEditId(null); setOpen(true); }} className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border-none px-4 py-2.5 text-[13px] font-extrabold text-white" style={{ background: "var(--accent)" }}><Plus size={15} /> {fa ? "افزودن آدرس" : "Add address"}</button>
        </div>
        {data!.addresses.length === 0 && !open ? (
          <Empty icon={<Plus size={34} />} title={fa ? "آدرسی ثبت نشده" : "No addresses"} sub={fa ? "یک آدرس اضافه کن" : "Add an address"} />
        ) : (
          <div className="grid gap-3.5 md:grid-cols-2">
            {data!.addresses.map((a) => (
              <div key={a.id} className="p-4" style={card}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[14px] font-extrabold">{a.title || a.receiver}</span>
                  {a.isDefault && <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: "rgba(31,138,91,.15)", color: "#1f8a5b" }}>{fa ? "پیش‌فرض" : "Default"}</span>}
                </div>
                <div className="text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>{a.receiver} • {a.phone}<br />{a.province}، {a.city} — {a.address} {a.postal && `(${a.postal})`}</div>
                <div className="mt-3 flex gap-3 text-[12.5px] font-bold">
                  {!a.isDefault && <button onClick={() => post("/api/account/address", { action: "default", id: a.id })} className="cursor-pointer border-none bg-transparent" style={{ color: "var(--accent)" }}>{fa ? "پیش‌فرض کن" : "Set default"}</button>}
                  <button onClick={() => { setForm({ title: a.title, receiver: a.receiver, phone: a.phone, province: a.province, city: a.city, postal: a.postal, address: a.address }); setEditId(a.id); setOpen(true); }} className="cursor-pointer border-none bg-transparent" style={{ color: "var(--accent)" }}>{t.edit}</button>
                  <button onClick={() => post("/api/account/address", { action: "delete", id: a.id })} className="cursor-pointer border-none bg-transparent" style={{ color: "#e11d48" }}>{t.del}</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {open && (
          <div className="fixed inset-0 z-[95] flex items-center justify-center p-5" style={{ background: "rgba(0,0,0,.5)" }} onClick={() => setOpen(false)}>
            <div className="anim-pop w-full max-w-[480px] rounded-[18px] p-6" style={card} onClick={(e) => e.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[16px] font-extrabold">{editId ? t.edit : fa ? "افزودن آدرس" : "Add address"}</h2>
                <button onClick={() => setOpen(false)} className="cursor-pointer border-none bg-transparent" style={{ color: "var(--muted)" }}><Close size={18} /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {([["title", fa ? "عنوان (خانه/کار)" : "Title"], ["receiver", fa ? "گیرنده" : "Receiver"], ["phone", fa ? "تلفن" : "Phone"], ["province", t.province], ["city", t.city], ["postal", t.postal]] as const).map(([k, label]) => (
                  <label key={k} className="flex flex-col gap-1 text-[12.5px] font-semibold" style={{ color: "var(--muted)" }}>{label}<input value={form[k]} onChange={set(k)} className={inputCls} style={inputStyle} /></label>
                ))}
                <label className="col-span-2 flex flex-col gap-1 text-[12.5px] font-semibold" style={{ color: "var(--muted)" }}>{t.addressLabel}<input value={form.address} onChange={set("address")} className={inputCls} style={inputStyle} /></label>
              </div>
              <button onClick={save} className="mt-4 w-full cursor-pointer rounded-[12px] border-none py-3 text-[14px] font-extrabold text-white" style={{ background: "var(--accent)" }}>{t.saveChanges}</button>
            </div>
          </div>
        )}
      </>
    );
  }

  function Wishlist() {
    const items = wishlist.map((id) => productById(id)).filter(Boolean);
    if (items.length === 0) return <><H>{t.wishlist}</H><Empty icon={<Heart size={34} />} title={t.emptyWish} sub={t.emptyWishSub} /></>;
    return (
      <>
        <H>{t.wishlist}</H>
        <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3">
          {items.map((p) => p && (
            <LocaleLink key={p.id} href={`/product/${p.id}`} className="p-3 no-underline" style={{ ...card, color: "var(--text)" }}>
              <span className="flex h-[120px] items-center justify-center rounded-[12px] text-[36px] font-extrabold" style={{ background: grad(p.hue, dark), color: "rgba(255,255,255,.5)" }}>{(fa ? p.fa : p.en).charAt(0)}</span>
              <div className="mt-2 text-[13.5px] font-bold leading-snug">{fa ? p.fa : p.en}</div>
              <div className="mt-1 text-[14px] font-extrabold" style={{ color: "var(--accent)" }}>{priceFmt(p.price, locale, t.currency)}</div>
            </LocaleLink>
          ))}
        </div>
      </>
    );
  }

  function Tickets() {
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const submit = async () => {
      if (!subject.trim() || !body.trim()) { toast(fa ? "موضوع و متن الزامی است" : "Subject and message required"); return; }
      await post("/api/account/ticket", { subject, body }, fa ? "تیکت ثبت شد ✓" : "Ticket submitted ✓");
      setSubject(""); setBody("");
    };
    return (
      <>
        <H>{t.tickets}</H>
        <div className="mb-5 p-5" style={card}>
          <div className="mb-3 text-[14px] font-bold">{fa ? "تیکت جدید" : "New ticket"}</div>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={fa ? "موضوع" : "Subject"} className={`${inputCls} mb-3`} style={inputStyle} />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder={fa ? "متن پیام…" : "Message…"} className={inputCls} style={{ ...inputStyle, resize: "vertical" }} />
          <button onClick={submit} className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-[10px] border-none px-5 py-2.5 text-[13.5px] font-extrabold text-white" style={{ background: "var(--accent)" }}><Send size={15} /> {fa ? "ارسال تیکت" : "Submit"}</button>
        </div>
        {data!.tickets.length === 0 ? <EmptyMini text={fa ? "تیکتی ثبت نشده" : "No tickets"} /> : (
          <div className="flex flex-col gap-3">
            {data!.tickets.map((tk) => (
              <div key={tk.id} className="p-4" style={card}>
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-extrabold">{tk.subject}</span>
                  <span className="rounded-full px-2.5 py-1 text-[11.5px] font-bold" style={{ background: "var(--surface2)", color: "var(--muted)" }}>{tk.status === "open" ? (fa ? "باز" : "Open") : tk.status === "answered" ? (fa ? "پاسخ داده شده" : "Answered") : (fa ? "بسته" : "Closed")}</span>
                </div>
                <div className="mt-1.5 text-[13px]" style={{ color: "var(--muted)" }}>{tk.body}</div>
                <div className="mt-1.5 text-[12px]" style={{ color: "var(--muted)" }}>{dt(tk.date)}</div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  function Notifications() {
    return (
      <>
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-[22px] font-extrabold tracking-tight">{t.notifications}</h1>
          <button onClick={() => post("/api/account/notifications", undefined, fa ? "همه خوانده شد" : "Marked read")} className="cursor-pointer border-none bg-transparent text-[13px] font-bold" style={{ color: "var(--accent)" }}>{fa ? "خواندن همه" : "Mark all read"}</button>
        </div>
        {data!.notifications.length === 0 ? <Empty icon={<Sparkle size={34} />} title={fa ? "اعلانی نیست" : "No notifications"} sub="" /> : (
          <div className="flex flex-col gap-2.5">
            {data!.notifications.map((n) => (
              <div key={n.id} className="flex items-start gap-3 p-4" style={{ ...card, borderInlineStartWidth: 3, borderInlineStartColor: n.read ? "var(--border)" : "var(--accent)" }}>
                <span className="mt-0.5">🔔</span>
                <div className="flex-1">
                  <div className="text-[13.5px]">{n.text}</div>
                  <div className="mt-1 text-[12px]" style={{ color: "var(--muted)" }}>{dt(n.date)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  function Loyalty() {
    const cur = [...TIERS].reverse().find((x) => data!.points >= x.min) || TIERS[0];
    const next = TIERS.find((x) => x.min > data!.points);
    return (
      <>
        <H>{t.loyalty}</H>
        <div className="mb-5 overflow-hidden rounded-[18px] p-6 text-white" style={{ background: grad(45, dark) }}>
          <div className="text-[13px] opacity-90">{t.yourPoints}</div>
          <div className="mt-1 text-[32px] font-black">{num(data!.points, locale)}</div>
          <div className="mt-1 text-[13px] opacity-90">{fa ? `سطح فعلی: ${cur.fa}` : `Current tier: ${cur.en}`}{next && (fa ? ` — ${num(next.min - data!.points, locale)} امتیاز تا ${next.fa}` : ` — ${num(next.min - data!.points, locale)} pts to ${next.en}`)}</div>
        </div>
        <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
          {TIERS.map((tr) => {
            const active = cur.key === tr.key;
            return (
              <div key={tr.key} className="p-4 text-center" style={{ ...card, outline: active ? "2px solid var(--accent)" : "none" }}>
                <div className="text-[15px] font-extrabold">{fa ? tr.fa : tr.en}</div>
                <div className="mt-1 text-[12.5px]" style={{ color: "var(--muted)" }}>{num(tr.min, locale)}+ {fa ? "امتیاز" : "pts"}</div>
                {active && <div className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold" style={{ color: "var(--accent)" }}><Check size={13} /> {fa ? "سطح شما" : "Your tier"}</div>}
              </div>
            );
          })}
        </div>
      </>
    );
  }

  function Profile() {
    const [f, setF] = useState({ firstName: data!.profile.firstName, lastName: data!.profile.lastName, email: data!.profile.email });
    const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
    return (
      <>
        <H>{t.profile}</H>
        <div className="max-w-[520px] p-5" style={card}>
          <div className="mb-4 flex items-center gap-3">
            {data!.profile.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data!.profile.avatar} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-full text-[24px] font-extrabold text-white" style={{ background: grad(255, dark) }}>{(f.firstName || data!.mobile).charAt(0)}</span>
            )}
            <div className="flex-1">
              <div className="text-[15px] font-extrabold">{`${f.firstName} ${f.lastName}`.trim() || (fa ? "کاربر" : "User")}</div>
              <div className="text-[12.5px]" dir="ltr" style={{ color: "var(--muted)" }}>{data!.mobile}</div>
            </div>
            <UploadButton accept="image/*" label={fa ? "تغییر عکس" : "Change photo"} onUploaded={(url) => post("/api/account/profile", { ...f, avatar: url }, t.saved)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-[12.5px] font-semibold" style={{ color: "var(--muted)" }}>{fa ? "نام" : "First name"}<input value={f.firstName} onChange={set("firstName")} className={inputCls} style={inputStyle} /></label>
            <label className="flex flex-col gap-1 text-[12.5px] font-semibold" style={{ color: "var(--muted)" }}>{fa ? "نام خانوادگی" : "Last name"}<input value={f.lastName} onChange={set("lastName")} className={inputCls} style={inputStyle} /></label>
            <label className="col-span-2 flex flex-col gap-1 text-[12.5px] font-semibold" style={{ color: "var(--muted)" }}>{t.emailLabel}<input value={f.email} onChange={set("email")} className={inputCls} style={inputStyle} dir="ltr" /></label>
            <label className="col-span-2 flex flex-col gap-1 text-[12.5px] font-semibold" style={{ color: "var(--muted)" }}>{t.phone}<input value={data!.mobile} readOnly className={inputCls} style={{ ...inputStyle, opacity: 0.7 }} dir="ltr" /></label>
          </div>
          <button onClick={() => post("/api/account/profile", f, t.saved)} className="mt-4 cursor-pointer rounded-[12px] border-none px-6 py-3 text-[14px] font-extrabold text-white" style={{ background: "var(--accent)" }}>{t.saveChanges}</button>
        </div>
      </>
    );
  }

  return (
    <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-6 px-[22px] py-7 lg:grid-cols-[260px_1fr]">
      {/* sidebar */}
      <aside className="h-fit p-4" style={card}>
        <div className="mb-4 flex items-center gap-3">
          {data.profile.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.profile.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-full text-[18px] font-extrabold text-white" style={{ background: grad(255, dark) }}>
              {(fullName || "?").charAt(0)}
            </span>
          )}
          <div className="min-w-0">
            <div className="truncate text-[14px] font-extrabold">{fullName}</div>
            <div className="text-[12px]" dir="ltr" style={{ color: "var(--muted)" }}>{data.mobile}</div>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => {
            const active = section === n.id;
            return (
              <button key={n.id} onClick={() => { setSection(n.id); if (n.id === "notifications") post("/api/account/notifications"); }}
                className="flex cursor-pointer items-center gap-2.5 rounded-[10px] border-none px-3 py-2.5 text-[13.5px] font-bold"
                style={{ textAlign: "start", background: active ? "var(--accent)" : "transparent", color: active ? "#fff" : "var(--text)" }}>
                <span style={{ opacity: active ? 1 : 0.7 }}>{n.icon}</span>
                <span className="flex-1">{n.label}</span>
                {!!n.badge && <span className="rounded-full px-1.5 text-[11px] font-extrabold" style={{ background: active ? "rgba(255,255,255,.25)" : "var(--surface2)", color: active ? "#fff" : "var(--muted)" }}>{num(n.badge, locale)}</span>}
              </button>
            );
          })}
          <div className="my-2 h-px" style={{ background: "var(--border)" }} />
          <LogoutButton to="/" />
        </nav>
      </aside>

      {/* content */}
      <section className="min-w-0">
        {section === "dashboard" && <Dashboard />}
        {section === "assistant" && <Assistant />}
        {section === "orders" && <Orders />}
        {section === "wallet" && <Wallet />}
        {section === "addresses" && <Addresses />}
        {section === "wishlist" && <Wishlist />}
        {section === "tickets" && <Tickets />}
        {section === "notifications" && <Notifications />}
        {section === "loyalty" && <Loyalty />}
        {section === "profile" && <Profile />}
      </section>
    </div>
  );
}
