"use client";

import { useState } from "react";
import { useShop } from "@/lib/store";
import { PRODUCTS } from "@/data/products";
import { grad, num, priceFmt } from "@/lib/format";
import { ProductCard } from "@/components/ProductCard";
import { LocaleLink } from "@/components/LocaleLink";
import { Card, GhostButton, SectionHead, StatusBadge } from "@/components/account/ui";
import {
  User,
  Cart,
  Heart,
  Sparkle,
  Send,
  Download,
  Plus,
  Check,
  Chat,
} from "@/components/Icons";

type SectionKey =
  | "dashboard"
  | "orders"
  | "invoices"
  | "downloads"
  | "wallet"
  | "addresses"
  | "messages"
  | "notifications"
  | "tickets"
  | "loyalty"
  | "profile";

/* ------------------------------------------------------------------ */
/* demo data (bilingual)                                               */
/* ------------------------------------------------------------------ */

type OrderStatus = "processing" | "shipped" | "delivered" | "cancelled";
interface DemoOrder {
  id: string;
  date: [string, string];
  status: OrderStatus;
  total: number;
  items: number;
}
const ORDERS: DemoOrder[] = [
  { id: "MKT-10428", date: ["۱۴۰۳/۰۳/۲۸", "Jun 17, 2026"], status: "processing", total: 6480000, items: 3 },
  { id: "MKT-10391", date: ["۱۴۰۳/۰۳/۲۱", "Jun 10, 2026"], status: "shipped", total: 12500000, items: 1 },
  { id: "MKT-10355", date: ["۱۴۰۳/۰۳/۱۲", "Jun 1, 2026"], status: "delivered", total: 2840000, items: 2 },
  { id: "MKT-10298", date: ["۱۴۰۳/۰۲/۳۰", "May 19, 2026"], status: "cancelled", total: 980000, items: 1 },
];

const INVOICES: { id: string; date: [string, string]; total: number; paid: boolean }[] = [
  { id: "INV-2026-0428", date: ["۱۴۰۳/۰۳/۲۸", "Jun 17, 2026"], total: 6480000, paid: true },
  { id: "INV-2026-0391", date: ["۱۴۰۳/۰۳/۲۱", "Jun 10, 2026"], total: 12500000, paid: true },
  { id: "INV-2026-0355", date: ["۱۴۰۳/۰۳/۱۲", "Jun 1, 2026"], total: 2840000, paid: false },
];

const DOWNLOADS: { name: [string, string]; size: string; type: string }[] = [
  { name: ["کاتالوگ هدفون پرو.pdf", "Pro Headphones Catalog.pdf"], size: "2.4 MB", type: "PDF" },
  { name: ["راهنمای ساعت هوشمند.pdf", "Smartwatch User Guide.pdf"], size: "1.1 MB", type: "PDF" },
  { name: ["فاکتور رسمی فروردین.pdf", "Official Invoice March.pdf"], size: "320 KB", type: "PDF" },
  { name: ["لایسنس نرم‌افزار همراه.txt", "Companion App License.txt"], size: "4 KB", type: "TXT" },
];

const TXNS: { label: [string, string]; date: [string, string]; amount: number; credit: boolean }[] = [
  { label: ["افزایش موجودی", "Wallet top-up"], date: ["۱۴۰۳/۰۳/۲۵", "Jun 14, 2026"], amount: 5000000, credit: true },
  { label: ["پرداخت سفارش MKT-10428", "Payment for MKT-10428"], date: ["۱۴۰۳/۰۳/۲۸", "Jun 17, 2026"], amount: 6480000, credit: false },
  { label: ["استرداد سفارش لغوشده", "Refund for cancelled order"], date: ["۱۴۰۳/۰۲/۳۰", "May 19, 2026"], amount: 980000, credit: true },
  { label: ["تبدیل امتیاز به اعتبار", "Points converted to credit"], date: ["۱۴۰۳/۰۲/۲۰", "May 9, 2026"], amount: 250000, credit: true },
];

const ADDRESSES: { title: [string, string]; line: [string, string]; phone: string; def: boolean }[] = [
  { title: ["خانه", "Home"], line: ["تهران، سعادت‌آباد، خیابان علامه، پلاک ۱۲، واحد ۴", "Tehran, Saadat Abad, Allameh St, No. 12, Unit 4"], phone: "۰۹۱۲۱۲۳۴۵۶۷", def: true },
  { title: ["محل کار", "Office"], line: ["تهران، ونک، برج نگار، طبقه ۸", "Tehran, Vanak, Negar Tower, 8th Floor"], phone: "۰۹۳۵۹۸۷۶۵۴۳", def: false },
];

const THREADS: { from: [string, string]; preview: [string, string]; time: [string, string]; unread: boolean }[] = [
  { from: ["پشتیبانی مارکت‌لند", "MarketLand Support"], preview: ["سفارش شما ارسال شد و کد رهگیری برایتان پیامک شد.", "Your order has shipped — tracking code sent by SMS."], time: ["۱۰:۲۴", "10:24"], unread: true },
  { from: ["تیم فروش", "Sales Team"], preview: ["پیشنهاد ویژه‌ای برای محصولات مورد علاقه شما داریم.", "We have a special offer on your favourite products."], time: ["دیروز", "Yesterday"], unread: false },
  { from: ["واحد مالی", "Billing"], preview: ["فاکتور رسمی سفارش اخیر شما صادر شد.", "The official invoice for your recent order is ready."], time: ["۲ روز پیش", "2 days ago"], unread: false },
];

const NOTIFS: { icon: string; text: [string, string]; time: [string, string]; unread: boolean }[] = [
  { icon: "📧", text: ["فاکتور سفارش MKT-10428 به ایمیل شما ارسال شد.", "Invoice for MKT-10428 was emailed to you."], time: ["۵ دقیقه پیش", "5 min ago"], unread: true },
  { icon: "📱", text: ["کد رهگیری مرسوله با پیامک ارسال شد.", "Tracking code sent via SMS."], time: ["۱ ساعت پیش", "1 hour ago"], unread: true },
  { icon: "🔔", text: ["محصول علاقه‌مندی شما دوباره موجود شد.", "A product in your wishlist is back in stock."], time: ["دیروز", "Yesterday"], unread: false },
  { icon: "🏷️", text: ["کد تخفیف ۱۰٪ برای خرید بعدی شما فعال شد.", "A 10% discount code is now active for you."], time: ["۲ روز پیش", "2 days ago"], unread: false },
];

type TicketStatus = "open" | "answered" | "closed";
const TICKETS: { id: string; subject: [string, string]; status: TicketStatus; date: [string, string] }[] = [
  { id: "TKT-882", subject: ["مشکل در فعال‌سازی گارانتی", "Issue activating warranty"], status: "open", date: ["۱۴۰۳/۰۳/۲۷", "Jun 16, 2026"] },
  { id: "TKT-871", subject: ["پیگیری مرجوعی سفارش", "Return follow-up"], status: "answered", date: ["۱۴۰۳/۰۳/۲۰", "Jun 9, 2026"] },
  { id: "TKT-840", subject: ["سوال درباره روش پرداخت", "Question about payment method"], status: "closed", date: ["۱۴۰۳/۰۳/۰۵", "May 25, 2026"] },
];

const POINTS = 2450;
const WALLET = 3270000;
const TOTAL_SPENT = 48700000;

/* ------------------------------------------------------------------ */

export default function AccountPage() {
  const { locale, t, dark, toast, wishlist } = useShop();
  const [active, setActive] = useState<SectionKey>("dashboard");
  const [orderFilter, setOrderFilter] = useState<"all" | OrderStatus>("all");
  const [twoFactor, setTwoFactor] = useState(false);

  const userName = locale === "fa" ? "آرمین امینی" : "Armin Amini";
  const userEmail = "naeiniamini@gmail.com";
  const tx = (fa: string, en: string) => (locale === "fa" ? fa : en);

  const orderStatusLabel = (s: OrderStatus) =>
    ({
      processing: tx("در حال پردازش", "Processing"),
      shipped: tx("ارسال شده", "Shipped"),
      delivered: tx("تحویل شده", "Delivered"),
      cancelled: tx("لغو شده", "Cancelled"),
    })[s];

  const NAV: { key: SectionKey; label: string; icon: React.ReactNode }[] = [
    { key: "dashboard", label: t.dashboard, icon: <User size={18} /> },
    { key: "orders", label: t.orders, icon: <Cart size={18} /> },
    { key: "invoices", label: t.invoices, icon: <Download size={18} /> },
    { key: "downloads", label: t.downloads, icon: <Download size={18} /> },
    { key: "wallet", label: t.wallet, icon: <Sparkle size={18} /> },
    { key: "addresses", label: t.addresses, icon: <Plus size={18} /> },
    { key: "messages", label: t.messages, icon: <Chat size={18} /> },
    { key: "notifications", label: t.notifications, icon: <Send size={18} /> },
    { key: "tickets", label: t.tickets, icon: <Chat size={18} /> },
    { key: "loyalty", label: t.loyalty, icon: <Sparkle size={18} /> },
    { key: "profile", label: t.profile, icon: <User size={18} /> },
  ];

  /* -------- shared bits -------- */
  const statCard = (icon: React.ReactNode, label: string, value: string) => (
    <Card pad={16} className="flex items-center gap-3.5">
      <span
        className="flex h-11 w-11 flex-none items-center justify-center rounded-[12px]"
        style={{ background: "var(--surface2)", color: "var(--accent)" }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[12.5px]" style={{ color: "var(--muted)" }}>
          {label}
        </div>
        <div className="text-[17px] font-extrabold" style={{ color: "var(--text)" }}>
          {value}
        </div>
      </div>
    </Card>
  );

  const filteredOrders =
    orderFilter === "all" ? ORDERS : ORDERS.filter((o) => o.status === orderFilter);

  /* ---------------------------------------------------------------- */
  /* sections                                                         */
  /* ---------------------------------------------------------------- */

  const Dashboard = (
    <>
      <SectionHead title={t.dashboard} sub={`${t.welcome}، ${userName}`} />

      {/* welcome banner */}
      <div
        className="relative mb-6 overflow-hidden rounded-[16px] p-6 text-white"
        style={{ background: grad(255, dark) }}
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-extrabold" style={{ background: "rgba(0,0,0,.28)" }}>
              <Sparkle size={13} /> {t.levelLabel}
            </div>
            <h2 className="mt-3 text-[22px] font-black">
              {t.welcome}، {userName}
            </h2>
            <p className="mt-1 text-[13.5px]" style={{ color: "rgba(255,255,255,.85)" }}>
              {tx("از پنل کاربری خود همه چیز را مدیریت کن.", "Manage everything from your account panel.")}
            </p>
          </div>
          <div className="flex gap-6">
            <div>
              <div className="text-[12px]" style={{ color: "rgba(255,255,255,.8)" }}>{t.yourPoints}</div>
              <div className="text-[20px] font-black">{num(POINTS, locale)}</div>
            </div>
            <div>
              <div className="text-[12px]" style={{ color: "rgba(255,255,255,.8)" }}>{t.walletBalance}</div>
              <div className="text-[20px] font-black">{priceFmt(WALLET, locale, t.currency)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* stats */}
      <div className="mb-6 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {statCard(<Cart size={20} />, t.orders, num(ORDERS.length, locale))}
        {statCard(<Sparkle size={20} />, tx("مجموع خرید", "Total spent"), priceFmt(TOTAL_SPENT, locale, t.currency))}
        {statCard(<Sparkle size={20} />, t.yourPoints, num(POINTS, locale))}
        {statCard(<User size={20} />, t.walletBalance, priceFmt(WALLET, locale, t.currency))}
      </div>

      {/* recent orders */}
      <Card className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[16px] font-extrabold">{t.recentOrders}</h3>
          <button onClick={() => setActive("orders")} className="cursor-pointer border-none bg-transparent text-[13px] font-bold" style={{ color: "var(--accent)" }}>
            {t.viewAll}
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {ORDERS.slice(0, 3).map((o) => (
            <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] p-3" style={{ background: "var(--surface2)" }}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px]" style={{ background: "var(--surface)", color: "var(--accent)" }}>
                  <Cart size={18} />
                </span>
                <div>
                  <div className="text-[13.5px] font-bold">{o.id}</div>
                  <div className="text-[12px]" style={{ color: "var(--muted)" }}>{o.date[locale === "fa" ? 0 : 1]}</div>
                </div>
              </div>
              <StatusBadge tone={o.status} label={orderStatusLabel(o.status)} />
              <span className="text-[14px] font-extrabold" style={{ color: "var(--accent)" }}>{priceFmt(o.total, locale, t.currency)}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* smart picks */}
      <div className="mb-3 flex items-center gap-2">
        <Sparkle size={18} />
        <h3 className="text-[16px] font-extrabold">{t.smartPicksTitle}</h3>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PRODUCTS.slice(0, 4).map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
    </>
  );

  const Orders = (
    <>
      <SectionHead title={t.orders} sub={tx("تاریخچه و وضعیت سفارش‌های شما", "Your order history and status")} />
      <div className="mb-5 flex flex-wrap gap-2">
        {(["all", "processing", "shipped", "delivered", "cancelled"] as const).map((f) => {
          const on = orderFilter === f;
          const label =
            f === "all" ? tx("همه", "All") : orderStatusLabel(f);
          return (
            <button
              key={f}
              onClick={() => setOrderFilter(f)}
              className="cursor-pointer rounded-full px-3.5 py-2 text-[12.5px] font-bold transition"
              style={{
                background: on ? "var(--accent)" : "var(--surface)",
                color: on ? "#fff" : "var(--text)",
                border: "1px solid " + (on ? "var(--accent)" : "var(--border)"),
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
      <div className="flex flex-col gap-3.5">
        {filteredOrders.map((o) => (
          <Card key={o.id} pad={16}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-[15px] font-extrabold">{o.id}</span>
                  <StatusBadge tone={o.status} label={orderStatusLabel(o.status)} />
                </div>
                <div className="mt-1 text-[12.5px]" style={{ color: "var(--muted)" }}>
                  {o.date[locale === "fa" ? 0 : 1]} · {num(o.items, locale)} {tx("کالا", "items")}
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-[15px] font-extrabold" style={{ color: "var(--accent)" }}>{priceFmt(o.total, locale, t.currency)}</span>
                <GhostButton accent onClick={() => toast(tx("به صفحه پیگیری منتقل شدید", "Opening order tracking"))}>
                  {t.trackOrder}
                </GhostButton>
                {o.status !== "cancelled" && (
                  <GhostButton onClick={() => toast(tx("درخواست مرجوعی ثبت شد", "Return request submitted"))}>
                    {t.returnRequest}
                  </GhostButton>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );

  const Invoices = (
    <>
      <SectionHead title={t.invoices} sub={tx("فاکتورهای رسمی سفارش‌های شما", "Official invoices for your orders")} />
      <Card pad={0} className="overflow-hidden">
        <div className="grid grid-cols-[1.4fr_1fr_1fr_auto] gap-3 px-4 py-3 text-[12.5px] font-bold" style={{ background: "var(--surface2)", color: "var(--muted)" }}>
          <span>{tx("شماره فاکتور", "Invoice no.")}</span>
          <span>{tx("تاریخ", "Date")}</span>
          <span>{t.status}</span>
          <span className="text-end">{tx("مبلغ", "Amount")}</span>
        </div>
        {INVOICES.map((inv) => (
          <div key={inv.id} className="grid grid-cols-[1.4fr_1fr_1fr_auto] items-center gap-3 px-4 py-3.5 text-[13px]" style={{ borderTop: "1px solid var(--border)" }}>
            <span className="font-bold">{inv.id}</span>
            <span style={{ color: "var(--muted)" }}>{inv.date[locale === "fa" ? 0 : 1]}</span>
            <span>
              <StatusBadge tone={inv.paid ? "paid" : "unpaid"} label={inv.paid ? tx("پرداخت شده", "Paid") : tx("پرداخت نشده", "Unpaid")} />
            </span>
            <span className="flex items-center justify-end gap-3">
              <span className="font-extrabold" style={{ color: "var(--accent)" }}>{priceFmt(inv.total, locale, t.currency)}</span>
              <GhostButton onClick={() => toast(tx("دانلود فاکتور آغاز شد", "Invoice download started"))}>
                <Download size={14} /> {t.downloads}
              </GhostButton>
            </span>
          </div>
        ))}
      </Card>
    </>
  );

  const Downloads = (
    <>
      <SectionHead title={t.downloads} sub={tx("فایل‌های قابل دانلود خریدهای شما", "Downloadable files from your purchases")} />
      <div className="flex flex-col gap-3">
        {DOWNLOADS.map((d, i) => (
          <Card key={i} pad={14} className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-[10px] text-[11px] font-extrabold" style={{ background: "var(--surface2)", color: "var(--accent)" }}>
              {d.type}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13.5px] font-bold">{d.name[locale === "fa" ? 0 : 1]}</div>
              <div className="text-[12px]" style={{ color: "var(--muted)" }}>{d.size}</div>
            </div>
            <GhostButton accent onClick={() => toast(tx("دانلود آغاز شد", "Download started"))}>
              <Download size={14} /> {t.downloads}
            </GhostButton>
          </Card>
        ))}
      </div>
    </>
  );

  const Wallet = (
    <>
      <SectionHead title={t.wallet} sub={tx("اعتبار و تراکنش‌های کیف پول", "Your wallet credit and transactions")} />
      <div className="mb-6 rounded-[16px] p-6 text-white" style={{ background: grad(255, dark) }}>
        <div className="text-[13px]" style={{ color: "rgba(255,255,255,.85)" }}>{t.walletBalance}</div>
        <div className="mt-1 text-[28px] font-black">{priceFmt(WALLET, locale, t.currency)}</div>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <button onClick={() => toast(tx("درگاه افزایش موجودی باز شد", "Top-up gateway opened"))} className="cursor-pointer rounded-[10px] border-none px-4 py-2.5 text-[13px] font-bold" style={{ background: "#fff", color: "var(--accent)" }}>
            <span className="inline-flex items-center gap-1.5"><Plus size={14} /> {t.topup}</span>
          </button>
          <button onClick={() => toast(tx("درخواست برداشت ثبت شد", "Withdrawal request submitted"))} className="cursor-pointer rounded-[10px] px-4 py-2.5 text-[13px] font-bold text-white" style={{ background: "rgba(0,0,0,.22)", border: "1px solid rgba(255,255,255,.3)" }}>
            {tx("برداشت", "Withdraw")}
          </button>
        </div>
      </div>
      <Card>
        <h3 className="mb-4 text-[16px] font-extrabold">{tx("تراکنش‌ها", "Transactions")}</h3>
        <div className="flex flex-col gap-3">
          {TXNS.map((txn, i) => (
            <div key={i} className="flex items-center justify-between gap-3 rounded-[12px] p-3" style={{ background: "var(--surface2)" }}>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full text-[15px] font-black" style={{ background: "var(--surface)", color: txn.credit ? "#1f8a5b" : "#e11d48" }}>
                  {txn.credit ? "+" : "−"}
                </span>
                <div>
                  <div className="text-[13.5px] font-bold">{txn.label[locale === "fa" ? 0 : 1]}</div>
                  <div className="text-[12px]" style={{ color: "var(--muted)" }}>{txn.date[locale === "fa" ? 0 : 1]}</div>
                </div>
              </div>
              <span className="text-[14px] font-extrabold" style={{ color: txn.credit ? "#1f8a5b" : "var(--text)" }}>
                {txn.credit ? "+" : "−"}{priceFmt(txn.amount, locale, t.currency)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </>
  );

  const Addresses = (
    <>
      <SectionHead
        title={t.addresses}
        sub={tx("آدرس‌های ارسال سفارش", "Your delivery addresses")}
        action={
          <button onClick={() => toast(tx("فرم افزودن آدرس باز شد", "Add address form opened"))} className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border-none px-4 py-2.5 text-[13px] font-bold text-white" style={{ background: "var(--accent)" }}>
            <Plus size={15} /> {tx("افزودن آدرس", "Add address")}
          </button>
        }
      />
      <div className="grid gap-3.5 md:grid-cols-2">
        {ADDRESSES.map((a, i) => (
          <Card key={i}>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-[15px] font-extrabold">{a.title[locale === "fa" ? 0 : 1]}</span>
              {a.def && (
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-extrabold" style={{ background: "rgba(31,138,91,.16)", color: "#1f8a5b" }}>
                  <Check size={12} /> {tx("پیش‌فرض", "Default")}
                </span>
              )}
            </div>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>{a.line[locale === "fa" ? 0 : 1]}</p>
            <div className="mt-2 text-[12.5px]" style={{ color: "var(--muted)" }}>{a.phone}</div>
            <div className="mt-4">
              <GhostButton accent onClick={() => toast(t.saved)}>{t.edit ?? tx("ویرایش", "Edit")}</GhostButton>
            </div>
          </Card>
        ))}
      </div>
    </>
  );

  const Messages = (
    <>
      <SectionHead title={t.messages} sub={tx("گفتگوهای شما با تیم فروشگاه", "Your conversations with the store team")} />
      <div className="flex flex-col gap-3">
        {THREADS.map((m, i) => (
          <Card key={i} pad={16} className="flex items-start gap-3.5">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full" style={{ background: "var(--surface2)", color: "var(--accent)" }}>
              <Chat size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[14px] font-bold" style={{ color: m.unread ? "var(--text)" : "var(--muted)" }}>
                  {m.from[locale === "fa" ? 0 : 1]}
                </span>
                <span className="flex items-center gap-2 text-[12px]" style={{ color: "var(--muted)" }}>
                  {m.time[locale === "fa" ? 0 : 1]}
                  {m.unread && <span className="h-2 w-2 rounded-full" style={{ background: "var(--accent)" }} />}
                </span>
              </div>
              <p className="mt-1 text-[13px]" style={{ color: "var(--muted)" }}>{m.preview[locale === "fa" ? 0 : 1]}</p>
            </div>
          </Card>
        ))}
      </div>
    </>
  );

  const Notifications = (
    <>
      <SectionHead title={t.notifications} sub={tx("اعلان‌های ایمیل، پیامک و سایت", "Email, SMS and on-site alerts")} />
      <div className="flex flex-col gap-3">
        {NOTIFS.map((n, i) => (
          <Card
            key={i}
            pad={14}
            className="flex items-center gap-3.5"
          >
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full text-[20px]" style={{ background: "var(--surface2)" }}>
              {n.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px]" style={{ color: n.unread ? "var(--text)" : "var(--muted)", fontWeight: n.unread ? 700 : 400 }}>
                {n.text[locale === "fa" ? 0 : 1]}
              </p>
              <div className="mt-0.5 text-[12px]" style={{ color: "var(--muted)" }}>{n.time[locale === "fa" ? 0 : 1]}</div>
            </div>
            {n.unread && <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: "var(--accent)" }} />}
          </Card>
        ))}
      </div>
    </>
  );

  const Tickets = (
    <>
      <SectionHead
        title={t.tickets}
        sub={tx("درخواست‌های پشتیبانی شما", "Your support requests")}
        action={
          <button onClick={() => toast(tx("فرم تیکت جدید باز شد", "New ticket form opened"))} className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border-none px-4 py-2.5 text-[13px] font-bold text-white" style={{ background: "var(--accent)" }}>
            <Plus size={15} /> {tx("تیکت جدید", "New ticket")}
          </button>
        }
      />
      <div className="flex flex-col gap-3">
        {TICKETS.map((k) => (
          <Card key={k.id} pad={16} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-[12.5px] font-bold" style={{ color: "var(--muted)" }}>{k.id}</span>
                <StatusBadge
                  tone={k.status}
                  label={
                    k.status === "open" ? tx("باز", "Open") : k.status === "answered" ? tx("پاسخ داده شد", "Answered") : tx("بسته", "Closed")
                  }
                />
              </div>
              <div className="mt-1 text-[14px] font-bold">{k.subject[locale === "fa" ? 0 : 1]}</div>
              <div className="mt-0.5 text-[12px]" style={{ color: "var(--muted)" }}>{k.date[locale === "fa" ? 0 : 1]}</div>
            </div>
            <GhostButton accent onClick={() => toast(tx("پیام شما ارسال شد", "Your reply was sent"))}>
              <Send size={14} /> {t.send}
            </GhostButton>
          </Card>
        ))}
      </div>
    </>
  );

  const tiers: { fa: string; en: string; min: number }[] = [
    { fa: "برنزی", en: "Bronze", min: 0 },
    { fa: "نقره‌ای", en: "Silver", min: 1000 },
    { fa: "طلایی", en: "Gold", min: 2000 },
    { fa: "پلاتینیوم", en: "Platinum", min: 4000 },
  ];
  const currentTierIdx = 2; // Gold

  const Loyalty = (
    <>
      <SectionHead title={t.loyalty} sub={tx("امتیازها و سطح وفاداری شما", "Your points and loyalty tier")} />
      <div className="mb-6 rounded-[16px] p-6 text-white" style={{ background: grad(255, dark) }}>
        <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-extrabold" style={{ background: "rgba(0,0,0,.28)" }}>
          <Sparkle size={13} /> {t.levelLabel}
        </div>
        <div className="mt-3 text-[13px]" style={{ color: "rgba(255,255,255,.85)" }}>{t.yourPoints}</div>
        <div className="text-[30px] font-black">{num(POINTS, locale)}</div>
        <button onClick={() => toast(tx("امتیازها به اعتبار تبدیل شد", "Points converted to credit"))} className="mt-4 cursor-pointer rounded-[10px] border-none px-4 py-2.5 text-[13px] font-bold" style={{ background: "#fff", color: "var(--accent)" }}>
          {tx("تبدیل امتیاز به اعتبار", "Convert points to credit")}
        </button>
      </div>

      <Card className="mb-6">
        <h3 className="mb-4 text-[16px] font-extrabold">{tx("نردبان سطح‌ها", "Tier ladder")}</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier, i) => {
            const on = i === currentTierIdx;
            return (
              <div
                key={tier.en}
                className="rounded-[12px] p-4 text-center"
                style={{
                  background: on ? "var(--accent)" : "var(--surface2)",
                  color: on ? "#fff" : "var(--text)",
                  border: "1px solid " + (on ? "var(--accent)" : "var(--border)"),
                }}
              >
                <div className="text-[14px] font-extrabold">{tier[locale === "fa" ? "fa" : "en"]}</div>
                <div className="mt-1 text-[12px]" style={{ color: on ? "rgba(255,255,255,.85)" : "var(--muted)" }}>
                  {num(tier.min, locale)}+ {tx("امتیاز", "pts")}
                </div>
                {on && (
                  <div className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-bold">
                    <Check size={13} /> {tx("سطح فعلی", "Current")}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-[16px] font-extrabold">{tx("تاریخچه فعالیت", "Activity history")}</h3>
        <div className="flex flex-col gap-3">
          {[
            { fa: "خرید سفارش MKT-10428", en: "Purchase MKT-10428", pts: 320 },
            { fa: "ثبت نظر برای محصول", en: "Wrote a product review", pts: 50 },
            { fa: "معرفی به دوستان", en: "Referred a friend", pts: 200 },
            { fa: "تبدیل امتیاز به اعتبار", en: "Converted points", pts: -250 },
          ].map((a, i) => (
            <div key={i} className="flex items-center justify-between gap-3 rounded-[12px] p-3" style={{ background: "var(--surface2)" }}>
              <span className="text-[13.5px] font-bold">{a[locale === "fa" ? "fa" : "en"]}</span>
              <span className="text-[14px] font-extrabold" style={{ color: a.pts >= 0 ? "#1f8a5b" : "#e11d48" }}>
                {a.pts >= 0 ? "+" : "−"}{num(Math.abs(a.pts), locale)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </>
  );

  const inputCls = "w-full rounded-[10px] px-3 py-2.5 text-[13.5px] outline-none";
  const inputStyle = { background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" } as const;
  const field = (label: string, defaultValue: string, type = "text") => (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-bold" style={{ color: "var(--muted)" }}>{label}</span>
      <input type={type} defaultValue={defaultValue} className={inputCls} style={inputStyle} />
    </label>
  );

  const Profile = (
    <>
      <SectionHead title={t.profile} sub={tx("اطلاعات حساب و امنیت", "Account details and security")} />
      <Card className="mb-6">
        <div className="mb-6 flex items-center gap-4">
          <span className="flex h-16 w-16 flex-none items-center justify-center rounded-full text-[24px] font-black text-white" style={{ background: grad(255, dark) }}>
            {userName.charAt(0)}
          </span>
          <div>
            <div className="text-[16px] font-extrabold">{userName}</div>
            <button onClick={() => toast(tx("انتخاب تصویر جدید", "Choose a new photo"))} className="mt-1.5 cursor-pointer rounded-[10px] px-3 py-1.5 text-[12.5px] font-bold" style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--accent)" }}>
              {tx("تغییر تصویر", "Change photo")}
            </button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {field(tx("نام", "First name"), locale === "fa" ? "آرمین" : "Armin")}
          {field(tx("نام خانوادگی", "Last name"), locale === "fa" ? "امینی" : "Amini")}
          {field(t.phone, "۰۹۱۲۱۲۳۴۵۶۷", "tel")}
          {field(t.emailLabel, userEmail, "email")}
        </div>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <button onClick={() => toast(t.saved)} className="cursor-pointer rounded-[10px] border-none px-5 py-2.5 text-[13.5px] font-bold text-white" style={{ background: "var(--accent)" }}>
            {t.saveChanges}
          </button>
          <button onClick={() => toast(tx("لینک تغییر رمز ارسال شد", "Password reset link sent"))} className="cursor-pointer rounded-[10px] px-5 py-2.5 text-[13.5px] font-bold" style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}>
            {t.changePassword}
          </button>
        </div>
      </Card>

      <Card>
        <h3 className="mb-1 text-[16px] font-extrabold">{t.securityTitle}</h3>
        <p className="mb-4 text-[13px]" style={{ color: "var(--muted)" }}>
          {tx("برای محافظت بیشتر، تأیید دو مرحله‌ای را فعال کن.", "Enable two-factor for extra protection.")}
        </p>
        <div className="flex items-center justify-between gap-3 rounded-[12px] p-3.5" style={{ background: "var(--surface2)" }}>
          <span className="text-[13.5px] font-bold">{t.twoFactor}</span>
          <button
            onClick={() => {
              setTwoFactor((v) => !v);
              toast(twoFactor ? tx("تأیید دو مرحله‌ای غیرفعال شد", "Two-factor disabled") : tx("تأیید دو مرحله‌ای فعال شد", "Two-factor enabled"));
            }}
            aria-label={t.twoFactor}
            className="relative h-[26px] w-[46px] flex-none cursor-pointer rounded-full border-none transition"
            style={{ background: twoFactor ? "var(--accent)" : "var(--border)" }}
          >
            <span
              className="absolute top-[3px] h-5 w-5 rounded-full bg-white transition-all"
              style={{ insetInlineStart: twoFactor ? 23 : 3 }}
            />
          </button>
        </div>
      </Card>
    </>
  );

  const content: Record<SectionKey, React.ReactNode> = {
    dashboard: Dashboard,
    orders: Orders,
    invoices: Invoices,
    downloads: Downloads,
    wallet: Wallet,
    addresses: Addresses,
    messages: Messages,
    notifications: Notifications,
    tickets: Tickets,
    loyalty: Loyalty,
    profile: Profile,
  };

  /* ---------------------------------------------------------------- */

  return (
    <div className="mx-auto max-w-[1280px] px-[22px] py-7">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* sidebar */}
        <aside className="h-fit lg:sticky lg:top-6">
          <Card className="mb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full text-[18px] font-black text-white" style={{ background: grad(255, dark) }}>
                {userName.charAt(0)}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[14.5px] font-extrabold">{userName}</div>
                <span className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-extrabold" style={{ background: "rgba(212,175,55,.18)", color: "#b8860b" }}>
                  <Sparkle size={11} /> {t.levelLabel}
                </span>
              </div>
            </div>
          </Card>

          <Card pad={8}>
            <nav className="flex flex-col gap-0.5">
              {NAV.map((n) => {
                const on = active === n.key;
                return (
                  <button
                    key={n.key}
                    onClick={() => setActive(n.key)}
                    className="flex cursor-pointer items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13.5px] font-bold transition"
                    style={{
                      background: on ? "var(--accent)" : "transparent",
                      color: on ? "#fff" : "var(--text)",
                      textAlign: "start",
                    }}
                  >
                    <span className="flex-none">{n.icon}</span>
                    <span className="truncate">{n.label}</span>
                  </button>
                );
              })}
              <div className="my-1 h-px" style={{ background: "var(--border)" }} />
              <LocaleLink href="/wishlist" className="flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13.5px] font-bold no-underline" style={{ color: "var(--text)" }}>
                <Heart size={18} />
                <span className="truncate">{t.wishlistTitle}</span>
                {wishlist.length > 0 && (
                  <span className="ms-auto rounded-full px-1.5 py-0.5 text-[10.5px] font-extrabold" style={{ background: "var(--surface2)", color: "var(--accent)" }}>
                    {num(wishlist.length, locale)}
                  </span>
                )}
              </LocaleLink>
              <button onClick={() => toast(tx("از حساب خود خارج شدید", "You have been logged out"))} className="flex cursor-pointer items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13.5px] font-bold transition" style={{ background: "transparent", color: "#e11d48", textAlign: "start" }}>
                <User size={18} />
                <span className="truncate">{t.logout}</span>
              </button>
            </nav>
          </Card>
        </aside>

        {/* content */}
        <section className="min-w-0">{content[active]}</section>
      </div>
    </div>
  );
}
