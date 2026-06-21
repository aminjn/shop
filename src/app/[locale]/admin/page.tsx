"use client";

import { useEffect, useState } from "react";
import { useShop } from "@/lib/store";
import { PRODUCTS } from "@/data/products";
import { CATEGORIES, catById } from "@/data/categories";
import type { Product } from "@/lib/types";
import { grad, priceFmt, num } from "@/lib/format";
import { AI_MODELS } from "@/data/aiModels";
import { ProductModal } from "@/components/admin/ProductModal";
import {
  Grid,
  List,
  Sparkle,
  Plus,
  Trash,
  Check,
  Close,
} from "@/components/Icons";

type Section =
  | "dashboard"
  | "products"
  | "orders"
  | "customers"
  | "discounts"
  | "reviews"
  | "reports"
  | "ai"
  | "settings";

const cardStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
} as const;
const inputCls = "w-full rounded-[10px] px-3 py-2.5 text-[13.5px] outline-none";
const inputStyle = {
  background: "var(--surface2)",
  border: "1px solid var(--border)",
  color: "var(--text)",
} as const;

export default function AdminPage() {
  const { locale, t, dark, toast } = useShop();
  const [section, setSection] = useState<Section>("dashboard");
  const [products, setProducts] = useState<Product[]>(() => [...PRODUCTS]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const fa = locale === "fa";

  const NAV: { id: Section; label: string }[] = [
    { id: "dashboard", label: t.aDashboard },
    { id: "products", label: t.aProducts },
    { id: "orders", label: t.aOrders },
    { id: "customers", label: t.aCustomers },
    { id: "discounts", label: t.aDiscounts },
    { id: "reviews", label: t.aReviews },
    { id: "reports", label: t.aReports },
    { id: "ai", label: t.aAi },
    { id: "settings", label: t.aSettings },
  ];

  const statusOf = (stock: number) =>
    stock === 0
      ? { label: t.stOut, color: "#e11d48" }
      : stock <= 20
        ? { label: t.stLow, color: "#d97706" }
        : { label: t.stActive, color: "#1f8a5b" };

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setModalOpen(true);
  };
  const saveProduct = (p: Product) => {
    setProducts((prev) => {
      const i = prev.findIndex((x) => x.id === p.id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = p;
        return next;
      }
      return [p, ...prev];
    });
  };
  const deleteProduct = (id: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast(fa ? "محصول حذف شد ✓" : "Product deleted ✓");
  };

  return (
    <div className="mx-auto max-w-[1280px] px-[22px] py-7">
      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        {/* sidebar */}
        <aside className="h-fit rounded-[16px] p-4" style={cardStyle}>
          <div className="mb-4 flex items-center gap-2 px-1">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-[10px] text-white"
              style={{ background: "var(--accent)" }}
            >
              <Grid size={18} />
            </span>
            <span className="text-[15px] font-extrabold">
              {fa ? "پنل مدیریت" : "Admin panel"}
            </span>
          </div>
          <nav className="flex flex-col gap-1">
            {NAV.map((n) => {
              const active = section === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => setSection(n.id)}
                  className="cursor-pointer rounded-[10px] border-none px-3.5 py-2.5 text-[13.5px] font-bold"
                  style={{
                    textAlign: "start",
                    background: active ? "var(--accent)" : "transparent",
                    color: active ? "#fff" : "var(--text)",
                  }}
                >
                  {n.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* content */}
        <section className="min-w-0">
          {section === "dashboard" && <Dashboard products={products} />}
          {section === "products" && (
            <Products
              products={products}
              statusOf={statusOf}
              onAdd={openAdd}
              onEdit={openEdit}
              onDelete={deleteProduct}
            />
          )}
          {section === "orders" && <Orders />}
          {section === "customers" && <Customers />}
          {section === "discounts" && <Discounts />}
          {section === "reviews" && <Reviews />}
          {section === "reports" && <Reports />}
          {section === "ai" && <AiStudio />}
          {section === "settings" && <Settings />}
        </section>
      </div>

      {modalOpen && (
        <ProductModal
          initial={editing}
          onClose={() => setModalOpen(false)}
          onSave={saveProduct}
        />
      )}
    </div>
  );
}

/* ---------- shared bits ---------- */

function H1({ children }: { children: React.ReactNode }) {
  return <h1 className="mb-5 text-[24px] font-extrabold tracking-tight">{children}</h1>;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[16px] ${className}`} style={cardStyle}>
      {children}
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-block rounded-full px-2.5 py-1 text-[11.5px] font-bold"
      style={{ background: color + "1f", color }}
    >
      {label}
    </span>
  );
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-[16px] scrollthin" style={cardStyle}>
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {head.map((h, i) => (
              <th
                key={i}
                className="px-4 py-3.5 font-bold"
                style={{ textAlign: "start", color: "var(--muted)" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function ActBtn({
  onClick,
  color,
  label,
  children,
}: {
  onClick: () => void;
  color: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[9px] border-none"
      style={{ background: "var(--surface2)", color }}
    >
      {children}
    </button>
  );
}

function pill(onClick: () => void, label: string, color = "var(--accent)") {
  return (
    <button
      onClick={onClick}
      className="cursor-pointer rounded-[9px] border-none px-3 py-1.5 text-[12px] font-bold"
      style={{ background: color + "1f", color }}
    >
      {label}
    </button>
  );
}

/* ---------- dashboard ---------- */

const WEEK = [42, 65, 58, 80, 73, 95, 88];

function Dashboard({ products }: { products: Product[] }) {
  const { locale, t, dark } = useShop();
  const fa = locale === "fa";

  const kpis = [
    { label: t.salesToday, value: priceFmt(48_500_000, locale, t.currency), hue: 215 },
    { label: t.salesMonth, value: priceFmt(1_240_000_000, locale, t.currency), hue: 152 },
    { label: t.ordersCount, value: num(1284, locale), hue: 28 },
    { label: t.customersCount, value: num(8642, locale), hue: 320 },
  ];

  const top = products.slice(0, 6);
  const sales = [320, 280, 210, 190, 150, 120];

  const orderStatus = [
    { label: fa ? "در انتظار" : "Pending", n: 38, color: "#d97706" },
    { label: fa ? "ارسال شده" : "Shipped", n: 124, color: "#2a6fdb" },
    { label: fa ? "تحویل شده" : "Delivered", n: 1086, color: "#1f8a5b" },
    { label: fa ? "لغو شده" : "Cancelled", n: 36, color: "#e11d48" },
  ];

  return (
    <>
      <H1>{t.aDashboard}</H1>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="overflow-hidden rounded-[16px] p-4" style={cardStyle}>
            <div
              className="mb-3 flex h-10 w-10 items-center justify-center rounded-[12px]"
              style={{ background: grad(k.hue, dark), color: "rgba(255,255,255,.85)" }}
            >
              <Sparkle size={18} />
            </div>
            <div className="text-[12.5px] font-bold" style={{ color: "var(--muted)" }}>
              {k.label}
            </div>
            <div className="mt-1 text-[19px] font-black">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="p-5">
          <h2 className="mb-5 text-[15px] font-extrabold">{t.salesChart}</h2>
          <div className="flex h-[200px] items-end gap-3">
            {WEEK.map((h, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-[8px]"
                  style={{ height: `${h}%`, background: "var(--accent)" }}
                />
                <span className="text-[11px]" style={{ color: "var(--muted)" }}>
                  {num(i + 1, locale)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-[15px] font-extrabold">
            {fa ? "وضعیت سفارش‌ها" : "Order status"}
          </h2>
          <div className="flex flex-col gap-3">
            {orderStatus.map((s) => (
              <div key={s.label} className="flex items-center justify-between text-[13px]">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                  <span style={{ color: "var(--muted)" }}>{s.label}</span>
                </span>
                <span className="font-bold">{num(s.n, locale)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <h2 className="mb-4 text-[15px] font-extrabold">{t.topProducts}</h2>
        <div className="flex flex-col gap-3">
          {top.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3">
              <span
                className="flex h-11 w-11 flex-none items-center justify-center rounded-[10px] text-[16px] font-extrabold"
                style={{ background: grad(p.hue, dark), color: "rgba(255,255,255,.5)" }}
              >
                {(fa ? p.fa : p.en).charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-bold">{fa ? p.fa : p.en}</div>
                <div className="text-[12px]" style={{ color: "var(--muted)" }}>
                  {priceFmt(p.price, locale, t.currency)}
                </div>
              </div>
              <div className="text-[13px] font-bold" style={{ color: "var(--accent)" }}>
                {num(sales[i] ?? 90, locale)} {fa ? "فروش" : "sold"}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

/* ---------- products ---------- */

function Products({
  products,
  statusOf,
  onAdd,
  onEdit,
  onDelete,
}: {
  products: Product[];
  statusOf: (s: number) => { label: string; color: string };
  onAdd: () => void;
  onEdit: (p: Product) => void;
  onDelete: (id: number) => void;
}) {
  const { locale, t, dark } = useShop();
  const fa = locale === "fa";

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <H1>{t.aProducts}</H1>
        <button
          onClick={onAdd}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-[12px] border-none px-4 py-2.5 text-[13.5px] font-extrabold text-white"
          style={{ background: "var(--accent)" }}
        >
          <Plus size={16} /> {fa ? "افزودن محصول" : "Add product"}
        </button>
      </div>

      <Table
        head={[t.thProduct, t.thCat, t.thPrice, t.thStock, t.thStatus, t.thActions]}
      >
        {products.map((p) => {
          const st = statusOf(p.stock);
          const c = catById(p.cat);
          return (
            <tr key={p.id} style={{ borderTop: "1px solid var(--border)" }}>
              <td className="px-4 py-3" style={{ textAlign: "start" }}>
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 flex-none items-center justify-center rounded-[9px] text-[14px] font-extrabold"
                    style={{ background: grad(p.hue, dark), color: "rgba(255,255,255,.5)" }}
                  >
                    {(fa ? p.fa : p.en).charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-bold">{fa ? p.fa : p.en}</div>
                    <div className="text-[11.5px]" style={{ color: "var(--muted)" }}>
                      {p.brand}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3" style={{ textAlign: "start", color: "var(--muted)" }}>
                {c ? (fa ? c.fa : c.en) : p.cat}
              </td>
              <td className="px-4 py-3 font-bold" style={{ textAlign: "start" }}>
                {priceFmt(p.price, locale, t.currency)}
              </td>
              <td className="px-4 py-3" style={{ textAlign: "start" }}>
                {num(p.stock, locale)}
              </td>
              <td className="px-4 py-3" style={{ textAlign: "start" }}>
                <Badge label={st.label} color={st.color} />
              </td>
              <td className="px-4 py-3" style={{ textAlign: "start" }}>
                <div className="flex gap-2">
                  <ActBtn onClick={() => onEdit(p)} color="var(--accent)" label={t.edit}>
                    <List size={15} />
                  </ActBtn>
                  <ActBtn onClick={() => onDelete(p.id)} color="#e11d48" label={t.del}>
                    <Trash size={15} />
                  </ActBtn>
                </div>
              </td>
            </tr>
          );
        })}
      </Table>
    </>
  );
}

/* ---------- orders ---------- */

function Orders() {
  const { locale, t, toast } = useShop();
  const fa = locale === "fa";

  const orders = [
    { id: "10241", cust: ["آرش رضایی", "Arash Rezaei"], total: 4200000, st: ["در انتظار", "Pending"], color: "#d97706" },
    { id: "10240", cust: ["مینا کریمی", "Mina Karimi"], total: 8900000, st: ["ارسال شده", "Shipped"], color: "#2a6fdb" },
    { id: "10239", cust: ["سینا مرادی", "Sina Moradi"], total: 1850000, st: ["تحویل شده", "Delivered"], color: "#1f8a5b" },
    { id: "10238", cust: ["نگار احمدی", "Negar Ahmadi"], total: 12500000, st: ["در انتظار", "Pending"], color: "#d97706" },
    { id: "10237", cust: ["پویا حسینی", "Pouya Hosseini"], total: 690000, st: ["لغو شده", "Cancelled"], color: "#e11d48" },
  ];

  const act = (key: string) => {
    const m: Record<string, [string, string]> = {
      confirm: ["سفارش تأیید شد ✓", "Order confirmed ✓"],
      ship: ["سفارش ارسال شد ✓", "Order shipped ✓"],
      cancel: ["سفارش لغو شد ✓", "Order cancelled ✓"],
      return: ["درخواست مرجوعی ثبت شد ✓", "Return requested ✓"],
    };
    toast(fa ? m[key][0] : m[key][1]);
  };

  return (
    <>
      <H1>{t.aOrders}</H1>
      <Table
        head={[
          fa ? "شماره سفارش" : "Order #",
          fa ? "مشتری" : "Customer",
          t.thPrice,
          t.thStatus,
          t.thActions,
        ]}
      >
        {orders.map((o) => (
          <tr key={o.id} style={{ borderTop: "1px solid var(--border)" }}>
            <td className="px-4 py-3 font-bold" style={{ textAlign: "start" }}>
              #{num(Number(o.id), locale)}
            </td>
            <td className="px-4 py-3" style={{ textAlign: "start" }}>
              {fa ? o.cust[0] : o.cust[1]}
            </td>
            <td className="px-4 py-3 font-bold" style={{ textAlign: "start" }}>
              {priceFmt(o.total, locale, t.currency)}
            </td>
            <td className="px-4 py-3" style={{ textAlign: "start" }}>
              <Badge label={fa ? o.st[0] : o.st[1]} color={o.color} />
            </td>
            <td className="px-4 py-3" style={{ textAlign: "start" }}>
              <div className="flex flex-wrap gap-1.5">
                {pill(() => act("confirm"), fa ? "تأیید" : "Confirm", "#1f8a5b")}
                {pill(() => act("ship"), fa ? "ارسال" : "Ship", "#2a6fdb")}
                {pill(() => act("cancel"), fa ? "لغو" : "Cancel", "#e11d48")}
                {pill(() => act("return"), fa ? "مرجوع" : "Return", "#d97706")}
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}

/* ---------- customers ---------- */

function Customers() {
  const { locale, t } = useShop();
  const fa = locale === "fa";

  const customers = [
    { name: ["آرش رضایی", "Arash Rezaei"], orders: 24, spent: 142000000, tier: ["طلایی", "Gold"], color: "#d4af37" },
    { name: ["مینا کریمی", "Mina Karimi"], orders: 16, spent: 98000000, tier: ["نقره‌ای", "Silver"], color: "#9ca3af" },
    { name: ["سینا مرادی", "Sina Moradi"], orders: 9, spent: 41000000, tier: ["برنزی", "Bronze"], color: "#b45309" },
    { name: ["نگار احمدی", "Negar Ahmadi"], orders: 31, spent: 210000000, tier: ["طلایی", "Gold"], color: "#d4af37" },
    { name: ["پویا حسینی", "Pouya Hosseini"], orders: 4, spent: 12000000, tier: ["برنزی", "Bronze"], color: "#b45309" },
  ];

  return (
    <>
      <H1>{t.aCustomers}</H1>
      <Table
        head={[
          fa ? "مشتری" : "Customer",
          t.ordersCount,
          fa ? "مجموع خرید" : "Total spent",
          fa ? "سطح" : "Tier",
        ]}
      >
        {customers.map((c, i) => {
          const nm = fa ? c.name[0] : c.name[1];
          return (
            <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
              <td className="px-4 py-3" style={{ textAlign: "start" }}>
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-[14px] font-extrabold text-white"
                    style={{ background: "var(--accent)" }}
                  >
                    {nm.charAt(0)}
                  </span>
                  <span className="text-[13px] font-bold">{nm}</span>
                </div>
              </td>
              <td className="px-4 py-3" style={{ textAlign: "start" }}>
                {num(c.orders, locale)}
              </td>
              <td className="px-4 py-3 font-bold" style={{ textAlign: "start" }}>
                {priceFmt(c.spent, locale, t.currency)}
              </td>
              <td className="px-4 py-3" style={{ textAlign: "start" }}>
                <Badge label={fa ? c.tier[0] : c.tier[1]} color={c.color} />
              </td>
            </tr>
          );
        })}
      </Table>
    </>
  );
}

/* ---------- discounts ---------- */

function Discounts() {
  const { locale, t, toast } = useShop();
  const fa = locale === "fa";

  const [codes, setCodes] = useState([
    { code: "WELCOME10", type: ["درصدی", "Percent"], value: "۱۰٪", usage: 482, expiry: "1404/12/29", active: true },
    { code: "FREESHIP", type: ["ارسال", "Shipping"], value: fa ? "رایگان" : "Free", usage: 1203, expiry: "1404/10/01", active: true },
    { code: "SUMMER50", type: ["مبلغی", "Fixed"], value: "500K", usage: 96, expiry: "1404/06/31", active: false },
  ]);

  const toggle = (i: number) => {
    setCodes((prev) => prev.map((c, idx) => (idx === i ? { ...c, active: !c.active } : c)));
    toast(fa ? "وضعیت کد تخفیف تغییر کرد ✓" : "Coupon status updated ✓");
  };

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <H1>{t.aDiscounts}</H1>
        <button
          onClick={() => toast(fa ? "کد تخفیف اضافه شد ✓" : "Coupon added ✓")}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-[12px] border-none px-4 py-2.5 text-[13.5px] font-extrabold text-white"
          style={{ background: "var(--accent)" }}
        >
          <Plus size={16} /> {fa ? "افزودن کد" : "Add code"}
        </button>
      </div>
      <Table
        head={[
          fa ? "کد" : "Code",
          fa ? "نوع" : "Type",
          fa ? "مقدار" : "Value",
          fa ? "تعداد استفاده" : "Usage",
          fa ? "انقضا" : "Expiry",
          fa ? "فعال" : "Active",
        ]}
      >
        {codes.map((c, i) => (
          <tr key={c.code} style={{ borderTop: "1px solid var(--border)" }}>
            <td className="px-4 py-3 font-bold" style={{ textAlign: "start", color: "var(--accent)" }}>
              {c.code}
            </td>
            <td className="px-4 py-3" style={{ textAlign: "start", color: "var(--muted)" }}>
              {fa ? c.type[0] : c.type[1]}
            </td>
            <td className="px-4 py-3 font-bold" style={{ textAlign: "start" }}>
              {c.value}
            </td>
            <td className="px-4 py-3" style={{ textAlign: "start" }}>
              {num(c.usage, locale)}
            </td>
            <td className="px-4 py-3" style={{ textAlign: "start", color: "var(--muted)" }}>
              {c.expiry}
            </td>
            <td className="px-4 py-3" style={{ textAlign: "start" }}>
              <button
                onClick={() => toggle(i)}
                aria-label={fa ? "فعال/غیرفعال" : "Toggle"}
                className="relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full border-none transition-colors"
                style={{ background: c.active ? "var(--accent)" : "var(--surface2)" }}
              >
                <span
                  className="absolute h-4.5 w-4.5 rounded-full bg-white transition-all"
                  style={{
                    width: 18,
                    height: 18,
                    insetInlineStart: c.active ? 22 : 4,
                  }}
                />
              </button>
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}

/* ---------- reviews ---------- */

function Reviews() {
  const { locale, t, toast } = useShop();
  const fa = locale === "fa";

  const reviews = [
    { name: ["آرش رضایی", "Arash Rezaei"], product: ["هدفون بی‌سیم پرو", "Pro Wireless Headphones"], rating: 5, text: ["کیفیت صدا فوق‌العاده است و باتری عالی کار می‌کند.", "Amazing sound quality and the battery lasts forever."] },
    { name: ["مینا کریمی", "Mina Karimi"], product: ["ساعت هوشمند سری ۷", "Smartwatch Series 7"], rating: 4, text: ["ظاهر زیبایی دارد ولی شارژ کمی سریع تمام می‌شود.", "Looks great but the battery drains a bit fast."] },
    { name: ["سینا مرادی", "Sina Moradi"], product: ["کفش کتانی روزمره", "Everyday Sneakers"], rating: 5, text: ["خیلی راحت است و کیفیت دوخت بالایی دارد.", "Super comfortable with great stitching quality."] },
  ];

  const stars = (r: number) => "★★★★★".slice(0, r) + "☆☆☆☆☆".slice(0, 5 - r);

  return (
    <>
      <H1>{t.aReviews}</H1>
      <div className="flex flex-col gap-3.5">
        {reviews.map((r, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start gap-3">
              <span
                className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-[14px] font-extrabold text-white"
                style={{ background: "var(--accent)" }}
              >
                {(fa ? r.name[0] : r.name[1]).charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13.5px] font-bold">{fa ? r.name[0] : r.name[1]}</span>
                  <span className="text-[12px]" style={{ color: "#d97706" }}>{stars(r.rating)}</span>
                </div>
                <div className="text-[11.5px]" style={{ color: "var(--muted)" }}>
                  {fa ? r.product[0] : r.product[1]}
                </div>
                <p className="mt-1.5 text-[13px]" style={{ color: "var(--text)" }}>
                  {fa ? r.text[0] : r.text[1]}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => toast(fa ? "نظر تأیید شد ✓" : "Review approved ✓")}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border-none px-3 py-2 text-[12.5px] font-bold"
                    style={{ background: "#1f8a5b1f", color: "#1f8a5b" }}
                  >
                    <Check size={14} /> {fa ? "تأیید" : "Approve"}
                  </button>
                  <button
                    onClick={() => toast(fa ? "نظر رد شد ✓" : "Review rejected ✓")}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border-none px-3 py-2 text-[12.5px] font-bold"
                    style={{ background: "#e11d481f", color: "#e11d48" }}
                  >
                    <Close size={14} /> {fa ? "رد" : "Reject"}
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

/* ---------- reports ---------- */

const YEAR = [55, 62, 48, 70, 65, 82, 90, 78, 88, 95, 72, 100];

function Reports() {
  const { locale, t } = useShop();
  const fa = locale === "fa";

  const months = fa
    ? ["فرو", "ارد", "خرد", "تیر", "مرد", "شهر", "مهر", "آبا", "آذر", "دی", "بهم", "اسف"]
    : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const kpis = [
    { label: fa ? "درآمد کل" : "Total revenue", value: priceFmt(14_800_000_000, locale, t.currency) },
    { label: fa ? "میانگین سبد" : "Avg. order", value: priceFmt(3_400_000, locale, t.currency) },
    { label: fa ? "نرخ تبدیل" : "Conversion", value: fa ? "٪۳٫۸" : "3.8%" },
    { label: fa ? "بازگشت کالا" : "Returns", value: fa ? "٪۱٫۲" : "1.2%" },
  ];

  return (
    <>
      <H1>{t.aReports}</H1>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-[16px] p-4" style={cardStyle}>
            <div className="text-[12.5px] font-bold" style={{ color: "var(--muted)" }}>
              {k.label}
            </div>
            <div className="mt-1 text-[19px] font-black">{k.value}</div>
          </div>
        ))}
      </div>
      <Card className="p-5">
        <h2 className="mb-5 text-[15px] font-extrabold">
          {fa ? "فروش ۱۲ ماه اخیر" : "Sales last 12 months"}
        </h2>
        <div className="flex h-[220px] items-end gap-2">
          {YEAR.map((h, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-[6px]"
                style={{ height: `${h}%`, background: "var(--accent)" }}
              />
              <span className="text-[10.5px]" style={{ color: "var(--muted)" }}>
                {months[i]}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

/* ---------- AI studio ---------- */

function AiStudio() {
  const { locale, t, dark, toast } = useShop();
  const fa = locale === "fa";

  const [name, setName] = useState("");
  const [result, setResult] = useState(false);

  const providers = ["OpenAI", "Claude", "Gemini", "Ollama", "vLLM", "Custom"];

  const tools = [
    { hue: 215, title: ["تولید محتوا و سئو", "Content & SEO"] },
    { hue: 152, title: ["نگارش بلاگ", "Blog writer"] },
    { hue: 320, title: ["تولید تصویر", "Image generator"] },
    { hue: 28, title: ["پیشنهاد قیمت", "Smart pricing"] },
    { hue: 198, title: ["تحلیل داده", "Analytics"] },
    { hue: 268, title: ["چت پشتیبانی", "Support chat"] },
  ];

  const generate = () => {
    if (!name.trim()) {
      toast(fa ? "نام محصول را وارد کنید" : "Enter a product name");
      return;
    }
    setResult(true);
    toast(fa ? "محتوا تولید شد ✓" : "Content generated ✓");
  };

  return (
    <>
      <div className="mb-5">
        <h1 className="text-[24px] font-extrabold tracking-tight">{t.aiStudioTitle}</h1>
        <p className="mt-1 text-[13.5px]" style={{ color: "var(--muted)" }}>
          {t.aiStudioSub}
        </p>
      </div>

      {/* providers */}
      <div className="mb-6 flex flex-wrap gap-2">
        {providers.map((p) => (
          <button
            key={p}
            onClick={() => toast(fa ? `${p} متصل است ✓` : `${p} connected ✓`)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border-none px-3.5 py-2 text-[12.5px] font-bold"
            style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: "#1f8a5b" }} />
            {p}
          </button>
        ))}
      </div>

      {/* content generator */}
      <Card className="mb-6 p-5">
        <h2 className="mb-3 flex items-center gap-2 text-[15px] font-extrabold">
          <Sparkle size={16} /> {fa ? "تولیدکننده محتوای محصول" : "Product content generator"}
        </h2>
        <div className="flex flex-wrap gap-2">
          <input
            className="min-w-[200px] flex-1 rounded-[10px] px-3 py-2.5 text-[13.5px] outline-none"
            style={inputStyle}
            placeholder={fa ? "نام محصول..." : "Product name..."}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            onClick={generate}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border-none px-5 py-2.5 text-[13.5px] font-extrabold text-white"
            style={{ background: "var(--accent)" }}
          >
            <Sparkle size={15} /> {fa ? "تولید کن" : "Generate"}
          </button>
        </div>

        {result && (
          <div className="mt-4 flex flex-col gap-3 rounded-[12px] p-4" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
            <Field
              label={fa ? "عنوان سئو" : "SEO title"}
              value={fa ? `خرید ${name} اصل با بهترین قیمت و ضمانت` : `Buy authentic ${name} at the best price with warranty`}
            />
            <Field
              label={fa ? "توضیح کوتاه" : "Short description"}
              value={fa ? `${name} با کیفیت ساخت بالا، طراحی مدرن و عملکرد بی‌نقص؛ انتخابی مطمئن برای استفاده روزمره.` : `${name} with premium build quality, modern design and flawless performance — a reliable pick for daily use.`}
            />
            <Field
              label={fa ? "متا توضیحات" : "Meta description"}
              value={fa ? `${name} را با ارسال سریع، گارانتی معتبر و پشتیبانی ۲۴ ساعته از مارکت‌لند بخرید.` : `Get ${name} with fast delivery, valid warranty and 24/7 support from MarketLand.`}
            />
            <Field
              label={fa ? "کلمات کلیدی" : "Keywords"}
              value={fa ? `${name}، خرید آنلاین، قیمت، اصل، گارانتی` : `${name}, buy online, price, authentic, warranty`}
            />
          </div>
        )}
      </Card>

      {/* tools */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool, i) => (
          <button
            key={i}
            onClick={() =>
              toast(
                fa
                  ? `ابزار «${tool.title[0]}» اجرا شد ✓`
                  : `"${tool.title[1]}" tool launched ✓`,
              )
            }
            className="cursor-pointer rounded-[16px] border-none p-4"
            style={{ ...cardStyle, textAlign: "start" }}
          >
            <span
              className="mb-3 flex h-10 w-10 items-center justify-center rounded-[12px]"
              style={{ background: grad(tool.hue, dark), color: "rgba(255,255,255,.85)" }}
            >
              <Sparkle size={18} />
            </span>
            <div className="text-[14px] font-extrabold">{fa ? tool.title[0] : tool.title[1]}</div>
            <div className="mt-1 text-[12px]" style={{ color: "var(--muted)" }}>
              {fa ? "اجرای ابزار هوش مصنوعی" : "Run AI tool"}
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1 text-[11.5px] font-bold" style={{ color: "var(--muted)" }}>
        {label}
      </div>
      <div className="text-[13px]" style={{ color: "var(--text)" }}>
        {value}
      </div>
    </div>
  );
}

/* ---------- settings ---------- */

function Settings() {
  const { locale, t, toast } = useShop();
  const fa = locale === "fa";

  const lbl = (s: string) => (
    <label className="mb-1 block text-[12.5px] font-bold" style={{ color: "var(--muted)" }}>
      {s}
    </label>
  );

  const [maintenance, setMaintenance] = useState(false);

  // IPPanel SMS settings — editable & saved server-side
  type SmsCfg = { configured: boolean; hasKey: boolean; from: string; patternCode: string; otpVar: string; apiKeyMasked: string };
  const [sms, setSms] = useState<SmsCfg | null>(null);
  const [form, setForm] = useState({ apiKey: "", from: "", patternCode: "", otpVar: "code" });
  const [testMobile, setTestMobile] = useState("");
  const [smsBusy, setSmsBusy] = useState(false);
  const [smsSaving, setSmsSaving] = useState(false);

  const loadSms = () =>
    fetch("/api/sms/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.config) return;
        setSms(d.config);
        setForm({ apiKey: "", from: d.config.from || "", patternCode: d.config.patternCode || "", otpVar: d.config.otpVar || "code" });
      })
      .catch(() => {});

  useEffect(() => {
    loadSms();
  }, []);

  const setF = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const saveSms = async () => {
    setSmsSaving(true);
    try {
      const r = await fetch("/api/sms/config", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (d.ok) {
        toast(t.saved);
        setForm((f) => ({ ...f, apiKey: "" }));
        await loadSms();
      } else {
        toast(fa ? "ذخیره ناموفق بود" : "Save failed");
      }
    } catch {
      toast(fa ? "خطای شبکه" : "Network error");
    } finally {
      setSmsSaving(false);
    }
  };

  const sendTest = async () => {
    setSmsBusy(true);
    try {
      const r = await fetch("/api/sms/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mobile: testMobile }),
      });
      const d = await r.json();
      toast(d.ok ? (fa ? "پیامک تست ارسال شد ✓" : "Test SMS sent ✓") : (fa ? "ارسال ناموفق: " : "Failed: ") + (d.error || ""));
    } catch {
      toast(fa ? "خطای شبکه" : "Network error");
    } finally {
      setSmsBusy(false);
    }
  };

  // AI (GapGPT) settings — editable & saved server-side
  type AiCfg = { configured: boolean; hasKey: boolean; baseUrl: string; model: string; apiKeyMasked: string };
  const [ai, setAi] = useState<AiCfg | null>(null);
  const [aiForm, setAiForm] = useState({ apiKey: "", baseUrl: "https://api.gapgpt.app/v1", model: "gpt-4o" });
  const [aiSaving, setAiSaving] = useState(false);
  const [aiTesting, setAiTesting] = useState(false);

  const loadAi = () =>
    fetch("/api/ai/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.config) return;
        setAi(d.config);
        setAiForm({ apiKey: "", baseUrl: d.config.baseUrl, model: d.config.model });
      })
      .catch(() => {});

  useEffect(() => {
    loadAi();
  }, []);

  const setAiF = (k: keyof typeof aiForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAiForm((f) => ({ ...f, [k]: e.target.value }));

  const saveAi = async () => {
    setAiSaving(true);
    try {
      const r = await fetch("/api/ai/config", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(aiForm),
      });
      const d = await r.json();
      if (d.ok) {
        toast(t.saved);
        setAiForm((f) => ({ ...f, apiKey: "" }));
        await loadAi();
      } else toast(fa ? "ذخیره ناموفق بود" : "Save failed");
    } catch {
      toast(fa ? "خطای شبکه" : "Network error");
    } finally {
      setAiSaving(false);
    }
  };

  const testAi = async () => {
    setAiTesting(true);
    try {
      const r = await fetch("/api/ai/test", { method: "POST" });
      const d = await r.json();
      toast(d.ok ? (fa ? "اتصال هوش مصنوعی موفق ✓" : "AI connected ✓") : (fa ? "خطا: " : "Error: ") + (d.error || ""));
    } catch {
      toast(fa ? "خطای شبکه" : "Network error");
    } finally {
      setAiTesting(false);
    }
  };

  return (
    <>
      <H1>{t.aSettings}</H1>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* store settings */}
        <Card className="p-5">
          <h2 className="mb-4 text-[15px] font-extrabold">{t.storeSettings}</h2>
          <div className="flex flex-col gap-3.5">
            <div>
              {lbl(fa ? "نام فروشگاه" : "Store name")}
              <input className={inputCls} style={inputStyle} defaultValue={t.storeName} />
            </div>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                {lbl(t.currency)}
                <input className={inputCls} style={inputStyle} defaultValue={t.currency} />
              </div>
              <div>
                {lbl(fa ? "زبان پیش‌فرض" : "Default language")}
                <select className={inputCls} style={inputStyle} defaultValue={locale}>
                  <option value="fa">{fa ? "فارسی" : "Persian"}</option>
                  <option value="en">{fa ? "انگلیسی" : "English"}</option>
                </select>
              </div>
              <div>
                {lbl(fa ? "هزینه ارسال پایه" : "Base shipping fee")}
                <input className={inputCls} style={inputStyle} inputMode="numeric" defaultValue="120000" />
              </div>
              <div>
                {lbl(fa ? "آستانه ارسال رایگان" : "Free-ship threshold")}
                <input className={inputCls} style={inputStyle} inputMode="numeric" defaultValue="2000000" />
              </div>
              <div>
                {lbl(fa ? "نرخ مالیات (٪)" : "Tax rate (%)")}
                <input className={inputCls} style={inputStyle} inputMode="numeric" defaultValue="9" />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setMaintenance((m) => !m)}
                  className="inline-flex w-full items-center justify-between rounded-[10px] px-3 py-2.5 text-[13px] font-bold"
                  style={inputStyle}
                >
                  {fa ? "حالت تعمیر" : "Maintenance"}
                  <span
                    className="relative inline-flex h-6 w-11 items-center rounded-full"
                    style={{ background: maintenance ? "var(--accent)" : "var(--border)" }}
                  >
                    <span
                      className="absolute rounded-full bg-white"
                      style={{ width: 18, height: 18, insetInlineStart: maintenance ? 22 : 4 }}
                    />
                  </span>
                </button>
              </div>
            </div>
            <button
              onClick={() => toast(t.saved)}
              className="mt-1 cursor-pointer rounded-[12px] border-none py-3 text-[14px] font-extrabold text-white"
              style={{ background: "var(--accent)" }}
            >
              {fa ? "ذخیره تنظیمات" : "Save settings"}
            </button>
          </div>
        </Card>

        {/* AI settings (GapGPT) */}
        <Card className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[15px] font-extrabold">{fa ? "تنظیمات هوش مصنوعی (گپ‌جی‌پی‌تی)" : "AI settings (GapGPT)"}</h2>
            <span
              className="rounded-full px-3 py-1 text-[11.5px] font-extrabold"
              style={{
                background: ai?.configured ? "rgba(31,138,91,.15)" : "rgba(225,29,72,.12)",
                color: ai?.configured ? "#1f8a5b" : "#e11d48",
              }}
            >
              {ai?.configured ? (fa ? "متصل و فعال" : "Connected") : fa ? "تنظیم نشده" : "Not configured"}
            </span>
          </div>

          <p className="mb-4 text-[12.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
            {fa
              ? "کلید API گپ‌جی‌پی‌تی را وارد کن و مدل را انتخاب کن. این تنظیمات برای جستجوی هوشمند و چت فروشگاه استفاده می‌شود. سازگار با OpenAI."
              : "Enter your GapGPT API key and pick a model. Used for smart search and the store chat. OpenAI-compatible."}
          </p>

          <div className="flex flex-col gap-3.5">
            <div>
              {lbl(fa ? "کلید API" : "API key")}
              <input
                className={inputCls}
                style={inputStyle}
                type="password"
                autoComplete="off"
                value={aiForm.apiKey}
                onChange={setAiF("apiKey")}
                placeholder={ai?.hasKey ? ai.apiKeyMasked : fa ? "کلید را وارد کن" : "enter key"}
                dir="ltr"
              />
            </div>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                {lbl(fa ? "آدرس سرویس (Base URL)" : "Base URL")}
                <input className={inputCls} style={inputStyle} value={aiForm.baseUrl} onChange={setAiF("baseUrl")} dir="ltr" placeholder="https://api.gapgpt.app/v1" />
              </div>
              <div>
                {lbl(fa ? "مدل" : "Model")}
                <input className={inputCls} style={inputStyle} value={aiForm.model} onChange={setAiF("model")} dir="ltr" list="ai-models" placeholder="gpt-4o" />
                <datalist id="ai-models">
                  {AI_MODELS.flatMap((g) => g.models).map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>
            </div>
            <div className="text-[11.5px]" style={{ color: "var(--muted)" }}>
              {fa ? "مدل‌های پیشنهادی:" : "Suggested models:"}{" "}
              {AI_MODELS.map((g) => g.group).join(" • ")}
            </div>
            <div className="flex gap-3">
              <button
                onClick={saveAi}
                disabled={aiSaving}
                className="flex-1 cursor-pointer rounded-[12px] border-none py-3 text-[14px] font-extrabold text-white disabled:opacity-60"
                style={{ background: "var(--accent)" }}
              >
                {aiSaving ? (fa ? "در حال ذخیره…" : "Saving…") : fa ? "ذخیره تنظیمات" : "Save settings"}
              </button>
              <button
                onClick={testAi}
                disabled={aiTesting || !ai?.configured}
                className="cursor-pointer rounded-[12px] px-5 py-3 text-[14px] font-extrabold disabled:opacity-50"
                style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}
              >
                {aiTesting ? (fa ? "تست…" : "Testing…") : fa ? "تست اتصال" : "Test"}
              </button>
            </div>
          </div>
        </Card>

        {/* SMS settings (IPPanel) */}
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[15px] font-extrabold">{fa ? "تنظیمات پیامک (IPPanel)" : "SMS settings (IPPanel)"}</h2>
            <span
              className="rounded-full px-3 py-1 text-[11.5px] font-extrabold"
              style={{
                background: sms?.configured ? "rgba(31,138,91,.15)" : "rgba(225,29,72,.12)",
                color: sms?.configured ? "#1f8a5b" : "#e11d48",
              }}
            >
              {sms?.configured ? (fa ? "متصل و فعال" : "Connected") : fa ? "تنظیم نشده" : "Not configured"}
            </span>
          </div>

          <p className="mb-4 text-[12.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
            {fa
              ? "اعتبارهای IPPanel را همین‌جا وارد و ذخیره کن. از طریق الگوی پیامکی، کد تأیید ورود برای کاربران ارسال می‌شود. الگوی OTP را در پنل IPPanel بساز و کد و نام متغیر آن را اینجا بگذار."
              : "Enter and save your IPPanel credentials here. Login OTP codes are sent via the SMS pattern. Create the OTP pattern in your IPPanel panel and put its code and variable name here."}
          </p>

          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              {lbl(fa ? "کلید API" : "API key")}
              <input
                className={inputCls}
                style={inputStyle}
                value={form.apiKey}
                onChange={setF("apiKey")}
                placeholder={sms?.hasKey ? sms.apiKeyMasked : fa ? "کلید را وارد کن" : "enter key"}
                dir="ltr"
                type="password"
                autoComplete="off"
              />
            </div>
            <div>
              {lbl(fa ? "شماره فرستنده" : "Sender (from)")}
              <input className={inputCls} style={inputStyle} value={form.from} onChange={setF("from")} placeholder="+983000505" dir="ltr" />
            </div>
            <div>
              {lbl(fa ? "کد الگو (Pattern)" : "Pattern code")}
              <input className={inputCls} style={inputStyle} value={form.patternCode} onChange={setF("patternCode")} placeholder="xxxxxxxxxxxxxxx" dir="ltr" />
            </div>
            <div>
              {lbl(fa ? "نام متغیر کد" : "OTP variable")}
              <input className={inputCls} style={inputStyle} value={form.otpVar} onChange={setF("otpVar")} placeholder="code" dir="ltr" />
            </div>
          </div>

          <button
            onClick={saveSms}
            disabled={smsSaving}
            className="mt-4 cursor-pointer rounded-[12px] border-none px-5 py-3 text-[14px] font-extrabold text-white disabled:opacity-60"
            style={{ background: "var(--accent)" }}
          >
            {smsSaving ? (fa ? "در حال ذخیره…" : "Saving…") : fa ? "ذخیره تنظیمات پیامک" : "Save SMS settings"}
          </button>

          <div className="mt-5 h-px" style={{ background: "var(--border)" }} />

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="flex-1" style={{ minWidth: 220 }}>
              {lbl(fa ? "ارسال پیامک تست به شماره" : "Send test SMS to")}
              <input
                className={inputCls}
                style={inputStyle}
                value={testMobile}
                onChange={(e) => setTestMobile(e.target.value)}
                placeholder="0912xxxxxxx"
                dir="ltr"
              />
            </div>
            <button
              onClick={sendTest}
              disabled={smsBusy || !sms?.configured}
              className="cursor-pointer rounded-[12px] border-none px-5 py-3 text-[14px] font-extrabold text-white disabled:opacity-50"
              style={{ background: "var(--accent)" }}
            >
              {smsBusy ? (fa ? "در حال ارسال…" : "Sending…") : fa ? "ارسال تست" : "Send test"}
            </button>
          </div>

          <div className="mt-4 rounded-[10px] px-3 py-2.5 text-[12.5px]" style={inputStyle}>
            <span style={{ color: "var(--muted)" }}>{fa ? "شمارهٔ سوپرادمین: " : "Super admin: "}</span>
            <span className="font-bold" dir="ltr">{process.env.NEXT_PUBLIC_SUPER_ADMIN || "0912•••2184"}</span>
          </div>
        </Card>
      </div>
    </>
  );
}
