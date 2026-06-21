"use client";

import { useEffect, useMemo, useState } from "react";
import { useShop } from "@/lib/store";
import { CATEGORIES, catById } from "@/data/categories";
import type { Product } from "@/lib/types";
import type { Post } from "@/data/posts";
import type { OrderStatus } from "@/lib/userstore";
import { grad, priceFmt, num, formatDate } from "@/lib/format";
import { AI_MODELS } from "@/data/aiModels";
import { ProductModal } from "@/components/admin/ProductModal";
import { LogoutButton } from "@/components/LogoutButton";
import { UploadButton } from "@/components/UploadButton";
import { ArticleEditor } from "@/components/admin/ArticleEditor";
import {
  Grid,
  List,
  Sparkle,
  Plus,
  Trash,
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

/* ---------- shared data types (mirror the API responses) ---------- */

type AdminOrder = {
  id: string;
  date: string;
  status: OrderStatus;
  total: number;
  items: { id: number; name: string; qty: number; price: number }[];
  payment: string;
  shipping: string;
  mobile: string;
  customer: string;
};

type AdminCustomer = {
  mobile: string;
  name: string;
  email: string;
  orders: number;
  spent: number;
  points: number;
  wallet: number;
  joined: string;
  role: string;
};

type AdminCoupon = {
  code: string;
  type: "percent" | "fixed" | "ship";
  value: number;
  enabled: boolean;
  expiry?: string;
  minPurchase?: number;
  usageLimit?: number;
  used?: number;
};

type StoreSettings = {
  storeName: string;
  tagline: string;
  currencyFa: string;
  currencyEn: string;
  logoUrl: string;
  faviconUrl: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogImage: string;
  shipFee: number;
  freeShipThreshold: number;
  taxRate: number;
  maintenance: boolean;
  cod: boolean;
};

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

const STATUS_META: Record<OrderStatus, { fa: string; en: string; color: string }> = {
  processing: { fa: "در حال پردازش", en: "Processing", color: "#d97706" },
  shipped: { fa: "ارسال شده", en: "Shipped", color: "#2a6fdb" },
  delivered: { fa: "تحویل شده", en: "Delivered", color: "#1f8a5b" },
  cancelled: { fa: "لغو شده", en: "Cancelled", color: "#e11d48" },
};

const fmtDate = (iso: string, fa: boolean) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso || "—";
  return formatDate(d, fa ? "fa" : "en");
};

export default function AdminPage() {
  const { locale, t, toast } = useShop();
  const [section, setSection] = useState<Section>("dashboard");

  // Live catalog — single source of truth shared by products & reviews & dashboard.
  const [products, setProducts] = useState<Product[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const fa = locale === "fa";

  const loadProducts = () =>
    fetch("/api/products")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (Array.isArray(d?.products)) setProducts(d.products);
      })
      .catch(() => {});

  useEffect(() => {
    loadProducts();
  }, []);

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

  // Persist via the live catalog API, then sync local state from the response.
  const saveProduct = async (p: Product) => {
    const editingExisting = editing != null;
    try {
      const r = await fetch("/api/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          editingExisting
            ? { action: "update", id: p.id, product: p }
            : { action: "add", product: p },
        ),
      });
      const d = await r.json();
      if (d.ok && Array.isArray(d.products)) {
        setProducts(d.products);
        toast(editingExisting ? t.saved : fa ? "محصول اضافه شد ✓" : "Product added ✓");
      } else {
        toast(fa ? "ذخیره ناموفق بود" : "Save failed");
      }
    } catch {
      toast(fa ? "خطای شبکه" : "Network error");
    }
  };

  const deleteProduct = async (id: number) => {
    try {
      const r = await fetch("/api/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      const d = await r.json();
      if (d.ok && Array.isArray(d.products)) {
        setProducts(d.products);
        toast(fa ? "محصول حذف شد ✓" : "Product deleted ✓");
      } else {
        toast(fa ? "حذف ناموفق بود" : "Delete failed");
      }
    } catch {
      toast(fa ? "خطای شبکه" : "Network error");
    }
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
            <div className="my-2 h-px" style={{ background: "var(--border)" }} />
            <LogoutButton to="/login" />
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
          {section === "reviews" && <Reviews products={products} />}
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

function Empty({ text }: { text: string }) {
  return (
    <Card className="p-10">
      <p className="text-center text-[13.5px]" style={{ color: "var(--muted)" }}>
        {text}
      </p>
    </Card>
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

function lbl(s: string) {
  return (
    <label className="mb-1 block text-[12.5px] font-bold" style={{ color: "var(--muted)" }}>
      {s}
    </label>
  );
}

/* ---------- dashboard ---------- */

function Dashboard({ products }: { products: Product[] }) {
  const { locale, t, dark } = useShop();
  const fa = locale === "fa";

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => Array.isArray(d?.orders) && setOrders(d.orders))
      .catch(() => {});
    fetch("/api/admin/customers")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => Array.isArray(d?.customers) && setCustomers(d.customers))
      .catch(() => {});
  }, []);

  const live = useMemo(() => orders.filter((o) => o.status !== "cancelled"), [orders]);

  const now = new Date();
  const sameDay = (d: Date) =>
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const sameMonth = (d: Date) =>
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();

  const todaySales = live.reduce(
    (s, o) => (sameDay(new Date(o.date)) ? s + o.total : s),
    0,
  );
  const monthSales = live.reduce(
    (s, o) => (sameMonth(new Date(o.date)) ? s + o.total : s),
    0,
  );

  const kpis = [
    { label: t.salesToday, value: priceFmt(todaySales, locale, t.currency), hue: 215 },
    { label: t.salesMonth, value: priceFmt(monthSales, locale, t.currency), hue: 152 },
    { label: t.ordersCount, value: num(orders.length, locale), hue: 28 },
    { label: t.customersCount, value: num(customers.length, locale), hue: 320 },
  ];

  // 7-day bar chart (oldest → newest), totals from non-cancelled orders.
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const dayTotals = days.map((d) =>
    live.reduce((s, o) => {
      const od = new Date(o.date);
      return od.getFullYear() === d.getFullYear() &&
        od.getMonth() === d.getMonth() &&
        od.getDate() === d.getDate()
        ? s + o.total
        : s;
    }, 0),
  );
  const maxDay = Math.max(...dayTotals, 0);

  // Top products by aggregated order item quantity.
  const top = useMemo(() => {
    const agg = new Map<string, number>();
    for (const o of live)
      for (const it of o.items)
        agg.set(it.name, (agg.get(it.name) ?? 0) + it.qty);
    return [...agg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [live]);

  const findProduct = (name: string) =>
    products.find((p) => p.fa === name || p.en === name);

  const orderStatus = (Object.keys(STATUS_META) as OrderStatus[]).map((k) => ({
    label: fa ? STATUS_META[k].fa : STATUS_META[k].en,
    n: orders.filter((o) => o.status === k).length,
    color: STATUS_META[k].color,
  }));

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
            {dayTotals.map((val, i) => {
              const h = maxDay > 0 ? Math.max(4, (val / maxDay) * 100) : 4;
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-[8px]"
                    style={{ height: `${h}%`, background: "var(--accent)" }}
                    title={priceFmt(val, locale, t.currency)}
                  />
                  <span className="text-[11px]" style={{ color: "var(--muted)" }}>
                    {formatDate(days[i], fa ? "fa" : "en", { weekday: "short" })}
                  </span>
                </div>
              );
            })}
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
        {top.length === 0 ? (
          <p className="text-[13px]" style={{ color: "var(--muted)" }}>
            {fa ? "هنوز فروشی ثبت نشده است." : "No sales recorded yet."}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {top.map(([name, qty]) => {
              const p = findProduct(name);
              return (
                <div key={name} className="flex items-center gap-3">
                  <span
                    className="flex h-11 w-11 flex-none items-center justify-center rounded-[10px] text-[16px] font-extrabold"
                    style={{
                      background: grad(p?.hue ?? 215, dark),
                      color: "rgba(255,255,255,.5)",
                    }}
                  >
                    {name.charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-bold">{name}</div>
                    {p && (
                      <div className="text-[12px]" style={{ color: "var(--muted)" }}>
                        {priceFmt(p.price, locale, t.currency)}
                      </div>
                    )}
                  </div>
                  <div className="text-[13px] font-bold" style={{ color: "var(--accent)" }}>
                    {num(qty, locale)} {fa ? "فروش" : "sold"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
  const { locale, t, dark, toast } = useShop();
  const fa = locale === "fa";
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const onDeleteClick = (p: Product) => {
    if (confirmId === p.id) {
      setConfirmId(null);
      onDelete(p.id);
    } else {
      setConfirmId(p.id);
      toast(fa ? "برای حذف دوباره بزنید" : "Tap again to delete");
    }
  };

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

      {products.length === 0 ? (
        <Empty text={fa ? "هنوز محصولی ثبت نشده است." : "No products yet."} />
      ) : (
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
                    <ActBtn onClick={() => onDeleteClick(p)} color="#e11d48" label={t.del}>
                      <Trash size={15} />
                    </ActBtn>
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      )}
    </>
  );
}

/* ---------- orders ---------- */

function Orders() {
  const { locale, t, toast } = useShop();
  const fa = locale === "fa";

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [busy, setBusy] = useState(false);

  const load = () =>
    fetch("/api/admin/orders")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => Array.isArray(d?.orders) && setOrders(d.orders))
      .catch(() => {});

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (o: AdminOrder, status: OrderStatus) => {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mobile: o.mobile, orderId: o.id, status }),
      });
      const d = await r.json();
      if (d.ok) {
        toast(fa ? "وضعیت سفارش به‌روزرسانی شد ✓" : "Order status updated ✓");
        await load();
      } else {
        toast(fa ? "به‌روزرسانی ناموفق بود" : "Update failed");
      }
    } catch {
      toast(fa ? "خطای شبکه" : "Network error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <H1>{t.aOrders}</H1>
      {orders.length === 0 ? (
        <Empty text={fa ? "هنوز سفارشی ثبت نشده است." : "No orders yet."} />
      ) : (
        <Table
          head={[
            fa ? "شماره سفارش" : "Order #",
            fa ? "مشتری" : "Customer",
            fa ? "تاریخ" : "Date",
            fa ? "اقلام" : "Items",
            t.thPrice,
            t.thStatus,
            t.thActions,
          ]}
        >
          {orders.map((o) => {
            const meta = STATUS_META[o.status];
            const itemCount = o.items.reduce((s, it) => s + it.qty, 0);
            return (
              <tr key={`${o.mobile}-${o.id}`} style={{ borderTop: "1px solid var(--border)" }}>
                <td className="px-4 py-3 font-bold" style={{ textAlign: "start" }} dir="ltr">
                  #{o.id}
                </td>
                <td className="px-4 py-3" style={{ textAlign: "start" }}>
                  <div className="text-[13px] font-bold">{o.customer}</div>
                  <div className="text-[11.5px]" style={{ color: "var(--muted)" }} dir="ltr">
                    {o.mobile}
                  </div>
                </td>
                <td className="px-4 py-3" style={{ textAlign: "start", color: "var(--muted)" }}>
                  {fmtDate(o.date, fa)}
                </td>
                <td className="px-4 py-3" style={{ textAlign: "start" }}>
                  {num(itemCount, locale)}
                </td>
                <td className="px-4 py-3 font-bold" style={{ textAlign: "start" }}>
                  {priceFmt(o.total, locale, t.currency)}
                </td>
                <td className="px-4 py-3" style={{ textAlign: "start" }}>
                  <Badge label={fa ? meta.fa : meta.en} color={meta.color} />
                </td>
                <td className="px-4 py-3" style={{ textAlign: "start" }}>
                  <div className="flex flex-wrap gap-1.5" style={{ opacity: busy ? 0.6 : 1 }}>
                    {pill(() => setStatus(o, "shipped"), fa ? "ارسال شد" : "Shipped", "#2a6fdb")}
                    {pill(() => setStatus(o, "delivered"), fa ? "تحویل شد" : "Delivered", "#1f8a5b")}
                    {pill(() => setStatus(o, "cancelled"), fa ? "لغو" : "Cancel", "#e11d48")}
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      )}
    </>
  );
}

/* ---------- customers ---------- */

function Customers() {
  const { locale, t } = useShop();
  const fa = locale === "fa";

  const [customers, setCustomers] = useState<AdminCustomer[]>([]);

  useEffect(() => {
    fetch("/api/admin/customers")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => Array.isArray(d?.customers) && setCustomers(d.customers))
      .catch(() => {});
  }, []);

  const roleBadge = (role: string) =>
    role === "admin"
      ? { label: fa ? "مدیر" : "Admin", color: "#7c3aed" }
      : { label: fa ? "مشتری" : "Customer", color: "#2a6fdb" };

  return (
    <>
      <H1>{t.aCustomers}</H1>
      {customers.length === 0 ? (
        <Empty text={fa ? "هنوز مشتری‌ای ثبت نشده است." : "No customers yet."} />
      ) : (
        <Table
          head={[
            fa ? "مشتری" : "Customer",
            t.ordersCount,
            fa ? "مجموع خرید" : "Total spent",
            fa ? "امتیاز" : "Points",
            fa ? "کیف پول" : "Wallet",
            fa ? "تاریخ عضویت" : "Joined",
            fa ? "نقش" : "Role",
          ]}
        >
          {customers.map((c) => {
            const nm = c.name || c.mobile;
            const rb = roleBadge(c.role);
            return (
              <tr key={c.mobile} style={{ borderTop: "1px solid var(--border)" }}>
                <td className="px-4 py-3" style={{ textAlign: "start" }}>
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-[14px] font-extrabold text-white"
                      style={{ background: "var(--accent)" }}
                    >
                      {nm.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold">{nm}</div>
                      <div className="text-[11.5px]" style={{ color: "var(--muted)" }} dir="ltr">
                        {c.mobile}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3" style={{ textAlign: "start" }}>
                  {num(c.orders, locale)}
                </td>
                <td className="px-4 py-3 font-bold" style={{ textAlign: "start" }}>
                  {priceFmt(c.spent, locale, t.currency)}
                </td>
                <td className="px-4 py-3" style={{ textAlign: "start" }}>
                  {num(c.points, locale)}
                </td>
                <td className="px-4 py-3" style={{ textAlign: "start" }}>
                  {priceFmt(c.wallet, locale, t.currency)}
                </td>
                <td className="px-4 py-3" style={{ textAlign: "start", color: "var(--muted)" }}>
                  {fmtDate(c.joined, fa)}
                </td>
                <td className="px-4 py-3" style={{ textAlign: "start" }}>
                  <Badge label={rb.label} color={rb.color} />
                </td>
              </tr>
            );
          })}
        </Table>
      )}
    </>
  );
}

/* ---------- discounts ---------- */

function Discounts() {
  const { locale, t, toast } = useShop();
  const fa = locale === "fa";

  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    code: "",
    type: "percent" as AdminCoupon["type"],
    value: "",
    expiry: "",
    minPurchase: "",
    usageLimit: "",
  });

  const load = () =>
    fetch("/api/coupons")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => Array.isArray(d?.coupons) && setCoupons(d.coupons))
      .catch(() => {});

  useEffect(() => {
    load();
  }, []);

  const post = async (body: Record<string, unknown>) => {
    setBusy(true);
    try {
      const r = await fetch("/api/coupons", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (d.ok && Array.isArray(d.coupons)) {
        setCoupons(d.coupons);
        return true;
      }
      toast(fa ? "عملیات ناموفق بود" : "Operation failed");
      return false;
    } catch {
      toast(fa ? "خطای شبکه" : "Network error");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const add = async () => {
    if (!form.code.trim()) {
      toast(fa ? "کد تخفیف را وارد کنید" : "Enter a coupon code");
      return;
    }
    const ok = await post({
      action: "add",
      code: form.code.trim(),
      type: form.type,
      value: form.value,
      expiry: form.expiry || undefined,
      minPurchase: form.minPurchase || undefined,
      usageLimit: form.usageLimit || undefined,
    });
    if (ok) {
      toast(fa ? "کد تخفیف اضافه شد ✓" : "Coupon added ✓");
      setForm({ code: "", type: "percent", value: "", expiry: "", minPurchase: "", usageLimit: "" });
    }
  };

  const toggle = async (c: AdminCoupon) => {
    const ok = await post({ action: "toggle", code: c.code });
    if (ok) toast(fa ? "وضعیت کد تخفیف تغییر کرد ✓" : "Coupon status updated ✓");
  };

  const remove = async (c: AdminCoupon) => {
    const ok = await post({ action: "delete", code: c.code });
    if (ok) toast(fa ? "کد تخفیف حذف شد ✓" : "Coupon deleted ✓");
  };

  const typeLabel = (ty: AdminCoupon["type"]) =>
    ty === "percent"
      ? fa ? "درصدی" : "Percent"
      : ty === "fixed"
        ? fa ? "مبلغی" : "Fixed"
        : fa ? "ارسال" : "Shipping";

  const valueLabel = (c: AdminCoupon) =>
    c.type === "percent"
      ? `${num(c.value, locale)}٪`
      : c.type === "ship"
        ? fa ? "ارسال رایگان" : "Free shipping"
        : priceFmt(c.value, locale, t.currency);

  return (
    <>
      <H1>{t.aDiscounts}</H1>

      {/* add form */}
      <Card className="mb-6 p-5">
        <h2 className="mb-4 text-[15px] font-extrabold">
          {fa ? "افزودن کد تخفیف" : "Add coupon"}
        </h2>
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            {lbl(fa ? "کد" : "Code")}
            <input
              className={inputCls}
              style={inputStyle}
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="SUMMER20"
              dir="ltr"
            />
          </div>
          <div>
            {lbl(fa ? "نوع" : "Type")}
            <select
              className={inputCls}
              style={inputStyle}
              value={form.type}
              onChange={(e) =>
                setForm((f) => ({ ...f, type: e.target.value as AdminCoupon["type"] }))
              }
            >
              <option value="percent">{fa ? "درصدی" : "Percent"}</option>
              <option value="fixed">{fa ? "مبلغی" : "Fixed"}</option>
              <option value="ship">{fa ? "ارسال رایگان" : "Free shipping"}</option>
            </select>
          </div>
          <div>
            {lbl(fa ? "مقدار" : "Value")}
            <input
              className={inputCls}
              style={inputStyle}
              inputMode="numeric"
              value={form.value}
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              disabled={form.type === "ship"}
              placeholder={form.type === "percent" ? "10" : "500000"}
            />
          </div>
          <div>
            {lbl(fa ? "انقضا" : "Expiry")}
            <input
              className={inputCls}
              style={inputStyle}
              type="date"
              value={form.expiry}
              onChange={(e) => setForm((f) => ({ ...f, expiry: e.target.value }))}
              dir="ltr"
            />
          </div>
          <div>
            {lbl(fa ? "حداقل خرید" : "Min purchase")}
            <input
              className={inputCls}
              style={inputStyle}
              inputMode="numeric"
              value={form.minPurchase}
              onChange={(e) => setForm((f) => ({ ...f, minPurchase: e.target.value }))}
              placeholder="0"
            />
          </div>
          <div>
            {lbl(fa ? "سقف استفاده" : "Usage limit")}
            <input
              className={inputCls}
              style={inputStyle}
              inputMode="numeric"
              value={form.usageLimit}
              onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
              placeholder="—"
            />
          </div>
        </div>
        <button
          onClick={add}
          disabled={busy}
          className="mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-[12px] border-none px-4 py-2.5 text-[13.5px] font-extrabold text-white disabled:opacity-60"
          style={{ background: "var(--accent)" }}
        >
          <Plus size={16} /> {fa ? "افزودن کد" : "Add code"}
        </button>
      </Card>

      {coupons.length === 0 ? (
        <Empty text={fa ? "هنوز کد تخفیفی ثبت نشده است." : "No coupons yet."} />
      ) : (
        <Table
          head={[
            fa ? "کد" : "Code",
            fa ? "نوع" : "Type",
            fa ? "مقدار" : "Value",
            fa ? "استفاده" : "Usage",
            fa ? "انقضا" : "Expiry",
            fa ? "فعال" : "Active",
            t.thActions,
          ]}
        >
          {coupons.map((c) => (
            <tr key={c.code} style={{ borderTop: "1px solid var(--border)" }}>
              <td
                className="px-4 py-3 font-bold"
                style={{ textAlign: "start", color: "var(--accent)" }}
                dir="ltr"
              >
                {c.code}
              </td>
              <td className="px-4 py-3" style={{ textAlign: "start", color: "var(--muted)" }}>
                {typeLabel(c.type)}
              </td>
              <td className="px-4 py-3 font-bold" style={{ textAlign: "start" }}>
                {valueLabel(c)}
              </td>
              <td className="px-4 py-3" style={{ textAlign: "start" }}>
                {num(c.used ?? 0, locale)}
                {c.usageLimit != null ? ` / ${num(c.usageLimit, locale)}` : ""}
              </td>
              <td className="px-4 py-3" style={{ textAlign: "start", color: "var(--muted)" }}>
                {c.expiry ? fmtDate(c.expiry, fa) : fa ? "بدون انقضا" : "No expiry"}
              </td>
              <td className="px-4 py-3" style={{ textAlign: "start" }}>
                <button
                  onClick={() => toggle(c)}
                  disabled={busy}
                  aria-label={fa ? "فعال/غیرفعال" : "Toggle"}
                  className="relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full border-none transition-colors"
                  style={{ background: c.enabled ? "var(--accent)" : "var(--surface2)" }}
                >
                  <span
                    className="absolute rounded-full bg-white transition-all"
                    style={{ width: 18, height: 18, insetInlineStart: c.enabled ? 22 : 4 }}
                  />
                </button>
              </td>
              <td className="px-4 py-3" style={{ textAlign: "start" }}>
                <ActBtn onClick={() => remove(c)} color="#e11d48" label={t.del}>
                  <Trash size={15} />
                </ActBtn>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}

/* ---------- reviews (read-only product ratings) ---------- */

function Reviews({ products }: { products: Product[] }) {
  const { locale, t, dark } = useShop();
  const fa = locale === "fa";

  const stars = (r: number) => {
    const full = Math.round(r);
    return "★★★★★".slice(0, full) + "☆☆☆☆☆".slice(0, 5 - full);
  };

  const rated = [...products].sort((a, b) => b.rating - a.rating);

  return (
    <>
      <H1>{fa ? "امتیاز و نظرات محصولات" : "Product ratings"}</H1>
      {rated.length === 0 ? (
        <Empty text={fa ? "محصولی برای نمایش نیست." : "No products to show."} />
      ) : (
        <Table
          head={[
            t.thProduct,
            fa ? "امتیاز" : "Rating",
            fa ? "تعداد نظرات" : "Reviews",
          ]}
        >
          {rated.map((p) => (
            <tr key={p.id} style={{ borderTop: "1px solid var(--border)" }}>
              <td className="px-4 py-3" style={{ textAlign: "start" }}>
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-9 w-9 flex-none items-center justify-center rounded-[9px] text-[13px] font-extrabold"
                    style={{ background: grad(p.hue, dark), color: "rgba(255,255,255,.5)" }}
                  >
                    {(fa ? p.fa : p.en).charAt(0)}
                  </span>
                  <span className="text-[13px] font-bold">{fa ? p.fa : p.en}</span>
                </div>
              </td>
              <td className="px-4 py-3" style={{ textAlign: "start" }}>
                <span className="text-[13px]" style={{ color: "#d97706" }}>
                  {stars(p.rating)}
                </span>{" "}
                <span style={{ color: "var(--muted)" }}>
                  {num(Math.round(p.rating * 10) / 10, locale)}
                </span>
              </td>
              <td className="px-4 py-3" style={{ textAlign: "start" }}>
                {num(p.reviews, locale)}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}

/* ---------- reports ---------- */

function Reports() {
  const { locale, t } = useShop();
  const fa = locale === "fa";

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => Array.isArray(d?.orders) && setOrders(d.orders))
      .catch(() => {});
    fetch("/api/admin/customers")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => Array.isArray(d?.customers) && setCustomers(d.customers))
      .catch(() => {});
  }, []);

  const live = orders.filter((o) => o.status !== "cancelled");
  const revenue = live.reduce((s, o) => s + o.total, 0);
  const avg = live.length ? Math.round(revenue / live.length) : 0;

  const kpis = [
    { label: fa ? "درآمد کل" : "Total revenue", value: priceFmt(revenue, locale, t.currency) },
    { label: t.ordersCount, value: num(orders.length, locale) },
    { label: t.customersCount, value: num(customers.length, locale) },
    { label: fa ? "میانگین سبد" : "Avg. order", value: priceFmt(avg, locale, t.currency) },
  ];

  // Last 12 months, oldest → newest.
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    return d;
  });
  const monthTotals = months.map((m) =>
    live.reduce((s, o) => {
      const od = new Date(o.date);
      return od.getFullYear() === m.getFullYear() && od.getMonth() === m.getMonth()
        ? s + o.total
        : s;
    }, 0),
  );
  const maxMonth = Math.max(...monthTotals, 0);

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
          {monthTotals.map((val, i) => {
            const h = maxMonth > 0 ? Math.max(4, (val / maxMonth) * 100) : 4;
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-[6px]"
                  style={{ height: `${h}%`, background: "var(--accent)" }}
                  title={priceFmt(val, locale, t.currency)}
                />
                <span className="text-[10.5px]" style={{ color: "var(--muted)" }}>
                  {formatDate(months[i], fa ? "fa" : "en", { month: "short" })}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}

/* ---------- AI studio (real product-content generator, article + scheduling, tool hub) ---------- */

type AiResult = {
  seoTitle?: string;
  shortDesc?: string;
  longDesc?: string;
  metaDesc?: string;
  keywords?: string[];
  specs?: { k: string; v: string }[];
  tags?: string[];
};

type AiArticle = {
  title: string;
  excerpt: string;
  body: string;
  category: string;
  tags: string[];
};

type StoredPost = Post & {
  status: "published" | "scheduled" | "draft";
  publishAt?: string;
};

type AiTool = { id: string; label: string; emoji: string; cat: string };

const TOOL_CATS = [
  "همه",
  "محتوا و سئو",
  "بلاگ هوشمند",
  "تصویر هوشمند",
  "فروش و قیمت",
  "مشتری و هوش تجاری",
] as const;

const TOOLS: AiTool[] = [
  // محتوا و سئو
  { id: "seo-title", label: "عنوان سئو", emoji: "🏷️", cat: "محتوا و سئو" },
  { id: "short-desc", label: "توضیح کوتاه", emoji: "✏️", cat: "محتوا و سئو" },
  { id: "long-desc", label: "توضیح کامل", emoji: "📝", cat: "محتوا و سئو" },
  { id: "specs", label: "مشخصات فنی", emoji: "⚙️", cat: "محتوا و سئو" },
  { id: "meta-desc", label: "متا دیسکریپشن", emoji: "🔖", cat: "محتوا و سئو" },
  { id: "keywords", label: "کلمات کلیدی", emoji: "🔑", cat: "محتوا و سئو" },
  { id: "rewrite", label: "بازنویسی متن", emoji: "🔁", cat: "محتوا و سئو" },
  { id: "translate", label: "ترجمه متن", emoji: "🌐", cat: "محتوا و سئو" },
  { id: "improve", label: "بهبود متن", emoji: "✨", cat: "محتوا و سئو" },
  { id: "faq", label: "FAQ محصول", emoji: "❓", cat: "محتوا و سئو" },
  { id: "duplicate", label: "تشخیص محتوای تکراری", emoji: "🧬", cat: "محتوا و سئو" },
  { id: "internal-link", label: "لینک داخلی", emoji: "🔗", cat: "محتوا و سئو" },
  // بلاگ هوشمند
  { id: "outline", label: "تولید Outline", emoji: "🗂️", cat: "بلاگ هوشمند" },
  { id: "title-suggest", label: "پیشنهاد تیتر", emoji: "💡", cat: "بلاگ هوشمند" },
  { id: "meta-title", label: "متا تایتل", emoji: "🏷️", cat: "بلاگ هوشمند" },
  { id: "seo-optimize", label: "بهینه‌سازی سئو", emoji: "📈", cat: "بلاگ هوشمند" },
  { id: "rewrite-article", label: "بازنویسی مقاله", emoji: "🔂", cat: "بلاگ هوشمند" },
  { id: "summarize", label: "خلاصه‌سازی", emoji: "📰", cat: "بلاگ هوشمند" },
  { id: "multilingual", label: "محتوای چندزبانه", emoji: "🌍", cat: "بلاگ هوشمند" },
  // تصویر هوشمند
  { id: "feature-image", label: "تصویر شاخص", emoji: "🖼️", cat: "تصویر هوشمند" },
  { id: "banner", label: "تولید بنر", emoji: "🎌", cat: "تصویر هوشمند" },
  { id: "ad-images", label: "تصاویر تبلیغاتی", emoji: "📸", cat: "تصویر هوشمند" },
  // فروش و قیمت
  { id: "price-suggest", label: "پیشنهاد قیمت", emoji: "💰", cat: "فروش و قیمت" },
  { id: "auto-discount", label: "تخفیف خودکار", emoji: "🏷️", cat: "فروش و قیمت" },
  { id: "sales-forecast", label: "پیش‌بینی فروش ماهانه", emoji: "📊", cat: "فروش و قیمت" },
  { id: "seasonal", label: "تحلیل فصلی", emoji: "🍂", cat: "فروش و قیمت" },
  // مشتری و هوش تجاری
  { id: "reco-engine", label: "موتور پیشنهاد خرید", emoji: "🛒", cat: "مشتری و هوش تجاری" },
  { id: "segmentation", label: "سگمنت‌بندی مشتریان", emoji: "👥", cat: "مشتری و هوش تجاری" },
  { id: "loyalty", label: "وفاداری هوشمند", emoji: "🎁", cat: "مشتری و هوش تجاری" },
];

function AiStudio() {
  const { locale, t, toast } = useShop();
  const fa = locale === "fa";
  const aiToast = () => toast(fa ? "هوش مصنوعی تنظیم نشده" : "AI not configured");

  // product content generator
  const [pName, setPName] = useState("");
  const [pCat, setPCat] = useState(CATEGORIES[0].id);
  const [pRes, setPRes] = useState<AiResult | null>(null);
  const [pBusy, setPBusy] = useState(false);
  const genProduct = async () => {
    if (!pName.trim()) { toast(fa ? "نام محصول را وارد کنید" : "Enter a product name"); return; }
    setPBusy(true); setPRes(null);
    try {
      const r = await fetch("/api/ai/generate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: pName.trim(), category: pCat }) });
      const d = await r.json();
      if (d.ok && d.result) { setPRes(d.result as AiResult); toast(fa ? "محتوا تولید شد ✓" : "Generated ✓"); }
      else if (d.error === "ai-unavailable") aiToast();
      else toast(fa ? "تولید ناموفق بود" : "Generation failed");
    } catch { toast(fa ? "خطای شبکه" : "Network error"); } finally { setPBusy(false); }
  };

  // image generator
  const [imgPrompt, setImgPrompt] = useState("");
  const [imgSize, setImgSize] = useState("1024x1024");
  const [imgUrl, setImgUrl] = useState("");
  const [imgBusy, setImgBusy] = useState(false);
  const genImage = async () => {
    if (!imgPrompt.trim()) { toast(fa ? "توضیح تصویر را وارد کنید" : "Enter an image prompt"); return; }
    setImgBusy(true); setImgUrl("");
    try {
      const r = await fetch("/api/ai/image", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt: imgPrompt.trim(), size: imgSize }) });
      const d = await r.json();
      if (d.ok && d.url) { setImgUrl(d.url); toast(fa ? "تصویر تولید شد ✓" : "Image generated ✓"); }
      else if (d.error === "ai-not-configured" || d.error === "ai-unavailable") aiToast();
      else toast(fa ? "تولید تصویر ناموفق بود: " + (d.error || "") : "Image failed: " + (d.error || ""));
    } catch { toast(fa ? "خطای شبکه" : "Network error"); } finally { setImgBusy(false); }
  };

  // tool hub
  const [toolCat, setToolCat] = useState("همه");
  const [activeTool, setActiveTool] = useState<AiTool | null>(null);
  const [toolInput, setToolInput] = useState("");
  const [toolOutput, setToolOutput] = useState("");
  const [toolBusy, setToolBusy] = useState(false);
  const openTool = (tool: AiTool) => {
    if (tool.cat === "تصویر هوشمند") {
      setImgPrompt(tool.label);
      document.getElementById("ai-image-generator")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setActiveTool(tool); setToolInput(""); setToolOutput("");
  };
  const runTool = async () => {
    if (!activeTool) return;
    setToolBusy(true); setToolOutput("");
    try {
      const r = await fetch("/api/ai/tool", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ tool: activeTool.label, input: toolInput.trim() || undefined }) });
      const d = await r.json();
      if (d.ok && typeof d.output === "string") setToolOutput(d.output);
      else if (d.error === "ai-unavailable" || d.error === "ai-not-configured") aiToast();
      else toast(fa ? "اجرای ابزار ناموفق بود" : "Tool failed");
    } catch { toast(fa ? "خطای شبکه" : "Network error"); } finally { setToolBusy(false); }
  };

  const shownTools = TOOLS.filter((x) => toolCat === "همه" || x.cat === toolCat);

  return (
    <>
      <H1>{t.aiStudioTitle}</H1>
      <p className="mb-5 text-[13.5px]" style={{ color: "var(--muted)" }}>{t.aiStudioSub}</p>

      {/* WordPress-like article editor */}
      <ArticleEditor />

      {/* product content generator */}
      <Card className="mt-6 p-5">
        <h2 className="mb-3 flex items-center gap-2 text-[15px] font-extrabold"><Sparkle size={16} /> {fa ? "تولید محتوای محصول" : "Product content generator"}</h2>
        <div className="flex flex-wrap items-end gap-2.5">
          <div className="min-w-[200px] flex-1">{lbl(fa ? "نام محصول" : "Product name")}<input className={inputCls} style={inputStyle} value={pName} onChange={(e) => setPName(e.target.value)} /></div>
          <div className="min-w-[160px]">{lbl(t.thCat)}<select className={inputCls} style={inputStyle} value={pCat} onChange={(e) => setPCat(e.target.value)}>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{fa ? c.fa : c.en}</option>)}</select></div>
          <button onClick={genProduct} disabled={pBusy} className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border-none px-5 py-2.5 text-[13.5px] font-extrabold text-white disabled:opacity-60" style={{ background: "var(--accent)" }}><Sparkle size={15} /> {pBusy ? (fa ? "در حال تولید…" : "Generating…") : fa ? "تولید کن" : "Generate"}</button>
        </div>
        {pRes && (
          <div className="mt-4 flex flex-col gap-3 rounded-[12px] p-4" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
            {pRes.seoTitle && <Field label={fa ? "عنوان سئو" : "SEO title"} value={pRes.seoTitle} />}
            {pRes.shortDesc && <Field label={fa ? "توضیح کوتاه" : "Short"} value={pRes.shortDesc} />}
            {pRes.longDesc && <Field label={fa ? "توضیح کامل" : "Long"} value={pRes.longDesc} />}
            {pRes.metaDesc && <Field label={fa ? "متا" : "Meta"} value={pRes.metaDesc} />}
            {Array.isArray(pRes.keywords) && pRes.keywords.length > 0 && <Field label={fa ? "کلمات کلیدی" : "Keywords"} value={pRes.keywords.join("، ")} />}
          </div>
        )}
      </Card>

      {/* image generator */}
      <Card className="mt-6 p-5" >
        <div id="ai-image-generator" />
        <h2 className="mb-3 flex items-center gap-2 text-[15px] font-extrabold"><Sparkle size={16} /> {fa ? "تولید تصویر با هوش مصنوعی" : "AI image generator"}</h2>
        <div className="flex flex-wrap items-end gap-2.5">
          <div className="min-w-[220px] flex-1">{lbl(fa ? "توضیح تصویر" : "Prompt")}<input className={inputCls} style={inputStyle} value={imgPrompt} onChange={(e) => setImgPrompt(e.target.value)} /></div>
          <div className="min-w-[130px]">{lbl(fa ? "اندازه" : "Size")}<select className={inputCls} style={inputStyle} value={imgSize} onChange={(e) => setImgSize(e.target.value)}><option value="1024x1024">1024×1024</option><option value="1024x1536">1024×1536</option><option value="1536x1024">1536×1024</option></select></div>
          <button onClick={genImage} disabled={imgBusy} className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border-none px-5 py-2.5 text-[13.5px] font-extrabold text-white disabled:opacity-60" style={{ background: "var(--accent)" }}><Sparkle size={15} /> {imgBusy ? (fa ? "در حال تولید…" : "Generating…") : fa ? "تولید تصویر" : "Generate"}</button>
        </div>
        {imgUrl && (
          <div className="mt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgUrl} alt="generated" className="max-h-[360px] rounded-[12px]" style={{ border: "1px solid var(--border)" }} />
          </div>
        )}
      </Card>

      {/* tool hub */}
      <Card className="mt-6 p-5">
        <h2 className="mb-3 flex items-center gap-2 text-[15px] font-extrabold"><Sparkle size={16} /> {fa ? "ابزارهای هوش مصنوعی" : "AI tools"}</h2>
        <div className="mb-4 flex flex-wrap gap-2">
          {TOOL_CATS.map((c) => (
            <button key={c} onClick={() => setToolCat(c)} className="cursor-pointer rounded-full px-3.5 py-1.5 text-[12.5px] font-bold" style={{ background: toolCat === c ? "var(--accent)" : "var(--surface2)", color: toolCat === c ? "#fff" : "var(--text)", border: "1px solid var(--border)" }}>{c}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-4">
          {shownTools.map((tool) => (
            <div key={tool.id} className="flex items-center justify-between gap-2 rounded-[12px] p-3" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
              <span className="flex min-w-0 items-center gap-2 text-[12.5px] font-bold"><span>{tool.emoji}</span><span className="truncate">{tool.label}</span></span>
              <button onClick={() => openTool(tool)} className="flex-none cursor-pointer rounded-[8px] border-none px-3 py-1.5 text-[11.5px] font-bold text-white" style={{ background: "var(--accent)" }}>{fa ? "اجرا" : "Run"}</button>
            </div>
          ))}
        </div>
      </Card>

      {activeTool && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-5" style={{ background: "rgba(0,0,0,.55)" }} onClick={() => setActiveTool(null)}>
          <div className="anim-pop w-full max-w-[560px] rounded-[16px] p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-[16px] font-extrabold"><span>{activeTool.emoji}</span> {activeTool.label}</h2>
              <button onClick={() => setActiveTool(null)} className="cursor-pointer border-none bg-transparent" style={{ color: "var(--muted)" }}><Sparkle size={0} /><span style={{ fontSize: 18 }}>✕</span></button>
            </div>
            <textarea className={inputCls} style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} value={toolInput} onChange={(e) => setToolInput(e.target.value)} placeholder={fa ? "ورودی (اختیاری) — مثلاً نام محصول یا متن…" : "Input (optional)…"} />
            <button onClick={runTool} disabled={toolBusy} className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border-none px-5 py-2.5 text-[13.5px] font-extrabold text-white disabled:opacity-60" style={{ background: "var(--accent)" }}><Sparkle size={15} /> {toolBusy ? (fa ? "در حال اجرا…" : "Running…") : fa ? "اجرا" : "Run"}</button>
            {toolOutput && (
              <div className="mt-4 rounded-[12px] p-4 text-[13.5px] leading-relaxed" style={{ background: "var(--surface2)", border: "1px solid var(--border)", whiteSpace: "pre-wrap", maxHeight: 320, overflow: "auto" }}>
                {toolOutput}
                <div className="mt-3"><button onClick={() => { navigator.clipboard?.writeText(toolOutput); toast(fa ? "کپی شد" : "Copied"); }} className="cursor-pointer rounded-[8px] border-none px-3 py-1.5 text-[12px] font-bold" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>{fa ? "کپی" : "Copy"}</button></div>
              </div>
            )}
          </div>
        </div>
      )}
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

  // Store settings — loaded from & persisted to the backend.
  const [store, setStore] = useState<StoreSettings>({
    storeName: "",
    tagline: "",
    currencyFa: "",
    currencyEn: "",
    logoUrl: "",
    faviconUrl: "",
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    ogImage: "",
    shipFee: 0,
    freeShipThreshold: 0,
    taxRate: 0,
    maintenance: false,
    cod: true,
  });
  const [storeSaving, setStoreSaving] = useState(false);

  const loadStore = () =>
    fetch("/api/settings/store")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.settings) setStore(d.settings);
      })
      .catch(() => {});

  useEffect(() => {
    loadStore();
  }, []);

  const setS = <K extends keyof StoreSettings>(k: K, v: StoreSettings[K]) =>
    setStore((s) => ({ ...s, [k]: v }));

  const saveStore = async () => {
    setStoreSaving(true);
    try {
      const r = await fetch("/api/settings/store", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(store),
      });
      const d = await r.json();
      if (d.ok && d.settings) {
        setStore(d.settings);
        toast(t.saved);
      } else {
        toast(fa ? "ذخیره ناموفق بود" : "Save failed");
      }
    } catch {
      toast(fa ? "خطای شبکه" : "Network error");
    } finally {
      setStoreSaving(false);
    }
  };

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
  type AiCfg = { configured: boolean; hasKey: boolean; baseUrl: string; model: string; apiKeyMasked: string; models?: Record<string, string> };
  const [ai, setAi] = useState<AiCfg | null>(null);
  const [aiForm, setAiForm] = useState({ apiKey: "", baseUrl: "https://api.gapgpt.app/v1", model: "gpt-4o" });
  const [aiTaskModels, setAiTaskModels] = useState<Record<string, string>>({});
  const [aiSaving, setAiSaving] = useState(false);
  const [aiTesting, setAiTesting] = useState(false);
  const [aiModels, setAiModels] = useState<string[]>([]);
  const [aiModelsLive, setAiModelsLive] = useState(false);
  const [aiModelsLoading, setAiModelsLoading] = useState(false);

  const loadAi = () =>
    fetch("/api/ai/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.config) return;
        setAi(d.config);
        setAiForm({ apiKey: "", baseUrl: d.config.baseUrl, model: d.config.model });
        setAiTaskModels(d.config.models || {});
      })
      .catch(() => {});

  const loadAiModels = () => {
    setAiModelsLoading(true);
    fetch("/api/ai/models")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (Array.isArray(d?.models)) {
          setAiModels(d.models);
          setAiModelsLive(d.source === "live");
        }
      })
      .catch(() => {})
      .finally(() => setAiModelsLoading(false));
  };

  useEffect(() => {
    loadAi();
    loadAiModels();
  }, []);

  const setAiF = (k: keyof typeof aiForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setAiForm((f) => ({ ...f, [k]: e.target.value }));

  const baseModels = aiModels.length ? aiModels : AI_MODELS.flatMap((g) => g.models);
  const modelOptions =
    aiForm.model && aiForm.model !== "__custom" && !baseModels.includes(aiForm.model)
      ? [aiForm.model, ...baseModels]
      : baseModels;

  const saveAi = async () => {
    setAiSaving(true);
    try {
      const r = await fetch("/api/ai/config", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...aiForm, models: aiTaskModels }),
      });
      const d = await r.json();
      if (d.ok) {
        toast(t.saved);
        setAiForm((f) => ({ ...f, apiKey: "" }));
        await loadAi();
        loadAiModels();
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

  const ToggleRow = ({
    label,
    on,
    onClick,
  }: {
    label: string;
    on: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className="inline-flex w-full items-center justify-between rounded-[10px] px-3 py-2.5 text-[13px] font-bold"
      style={inputStyle}
    >
      {label}
      <span
        className="relative inline-flex h-6 w-11 items-center rounded-full"
        style={{ background: on ? "var(--accent)" : "var(--border)" }}
      >
        <span
          className="absolute rounded-full bg-white"
          style={{ width: 18, height: 18, insetInlineStart: on ? 22 : 4 }}
        />
      </span>
    </button>
  );

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
              <input
                className={inputCls}
                style={inputStyle}
                value={store.storeName}
                onChange={(e) => setS("storeName", e.target.value)}
              />
            </div>
            <div>
              {lbl(fa ? "شعار سایت" : "Site slogan")}
              <input
                className={inputCls}
                style={inputStyle}
                value={store.tagline}
                onChange={(e) => setS("tagline", e.target.value)}
                placeholder={fa ? "مثلاً: هر چیزی که نیاز داری، یک‌جا" : "e.g. Everything you need, in one place"}
              />
            </div>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                {lbl(fa ? "واحد پول (فارسی)" : "Currency (Persian)")}
                <input
                  className={inputCls}
                  style={inputStyle}
                  value={store.currencyFa}
                  onChange={(e) => setS("currencyFa", e.target.value)}
                  placeholder="تومان"
                />
              </div>
              <div>
                {lbl(fa ? "واحد پول (انگلیسی)" : "Currency (English)")}
                <input
                  className={inputCls}
                  style={inputStyle}
                  value={store.currencyEn}
                  onChange={(e) => setS("currencyEn", e.target.value)}
                  placeholder="Toman"
                  dir="ltr"
                />
              </div>
              <div className="sm:col-span-2">
                {lbl(fa ? "لوگوی فروشگاه" : "Store logo")}
                <div className="flex items-center gap-3">
                  {store.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={store.logoUrl} alt="logo" className="h-12 w-12 rounded-[10px] object-cover" style={{ border: "1px solid var(--border)" }} />
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded-[10px] text-[20px] font-extrabold text-white" style={{ background: "var(--accent)" }}>{(store.storeName || "م").charAt(0)}</span>
                  )}
                  <UploadButton accept="image/*" label={fa ? "آپلود لوگو" : "Upload logo"} onUploaded={(url) => setS("logoUrl", url)} />
                  {store.logoUrl && <button type="button" onClick={() => setS("logoUrl", "")} className="cursor-pointer border-none bg-transparent text-[12.5px] font-bold" style={{ color: "#e11d48" }}>{fa ? "حذف" : "Remove"}</button>}
                </div>
              </div>
              <div className="sm:col-span-2">
                {lbl(fa ? "فاوآیکون (آیکون تب مرورگر)" : "Favicon")}
                <div className="flex items-center gap-3">
                  {store.faviconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={store.faviconUrl} alt="favicon" className="h-9 w-9 rounded" style={{ border: "1px solid var(--border)" }} />
                  ) : null}
                  <UploadButton accept="image/png,image/x-icon,image/svg+xml,image/jpeg" label={fa ? "آپلود فاوآیکون" : "Upload favicon"} onUploaded={(url) => setS("faviconUrl", url)} />
                  {store.faviconUrl && <button type="button" onClick={() => setS("faviconUrl", "")} className="cursor-pointer border-none bg-transparent text-[12.5px] font-bold" style={{ color: "#e11d48" }}>{fa ? "حذف" : "Remove"}</button>}
                </div>
              </div>
              <div>
                {lbl(fa ? "هزینه ارسال پایه" : "Base shipping fee")}
                <input
                  className={inputCls}
                  style={inputStyle}
                  inputMode="numeric"
                  value={String(store.shipFee)}
                  onChange={(e) =>
                    setS("shipFee", Number(e.target.value.replace(/[^\d]/g, "")) || 0)
                  }
                />
              </div>
              <div>
                {lbl(fa ? "آستانه ارسال رایگان" : "Free-ship threshold")}
                <input
                  className={inputCls}
                  style={inputStyle}
                  inputMode="numeric"
                  value={String(store.freeShipThreshold)}
                  onChange={(e) =>
                    setS("freeShipThreshold", Number(e.target.value.replace(/[^\d]/g, "")) || 0)
                  }
                />
              </div>
              <div>
                {lbl(fa ? "نرخ مالیات (٪)" : "Tax rate (%)")}
                <input
                  className={inputCls}
                  style={inputStyle}
                  inputMode="numeric"
                  value={String(store.taxRate)}
                  onChange={(e) =>
                    setS("taxRate", Number(e.target.value.replace(/[^\d]/g, "")) || 0)
                  }
                />
              </div>
              <div className="flex items-end">
                <ToggleRow
                  label={fa ? "حالت تعمیر" : "Maintenance"}
                  on={store.maintenance}
                  onClick={() => setS("maintenance", !store.maintenance)}
                />
              </div>
              <div className="flex items-end">
                <ToggleRow
                  label={fa ? "پرداخت در محل" : "Cash on delivery"}
                  on={store.cod}
                  onClick={() => setS("cod", !store.cod)}
                />
              </div>
            </div>
            <button
              onClick={saveStore}
              disabled={storeSaving}
              className="mt-1 cursor-pointer rounded-[12px] border-none py-3 text-[14px] font-extrabold text-white disabled:opacity-60"
              style={{ background: "var(--accent)" }}
            >
              {storeSaving ? (fa ? "در حال ذخیره…" : "Saving…") : fa ? "ذخیره تنظیمات" : "Save settings"}
            </button>
          </div>
        </Card>

        {/* SEO settings */}
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-1 text-[15px] font-extrabold">{fa ? "بهینه‌سازی موتور جستجو (SEO)" : "Search engine optimization (SEO)"}</h2>
          <p className="mb-4 text-[12.5px]" style={{ color: "var(--muted)" }}>
            {fa ? "عنوان و توضیحات متا، کلمات کلیدی و تصویر اشتراک‌گذاری سایت در گوگل و شبکه‌های اجتماعی." : "Meta title/description, keywords and social share image."}
          </p>
          <div className="flex flex-col gap-3.5">
            <div>
              {lbl(fa ? "عنوان متا (Meta Title)" : "Meta title")}
              <input className={inputCls} style={inputStyle} value={store.metaTitle} onChange={(e) => setS("metaTitle", e.target.value)} placeholder={fa ? "حداکثر ۶۰ کاراکتر" : "max 60 chars"} maxLength={70} />
            </div>
            <div>
              {lbl(fa ? "توضیحات متا (Meta Description)" : "Meta description")}
              <textarea className="w-full rounded-[10px] px-3 py-2.5 text-[13.5px] outline-none" style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={store.metaDescription} onChange={(e) => setS("metaDescription", e.target.value)} placeholder={fa ? "حداکثر ۱۵۵ کاراکتر" : "max 155 chars"} maxLength={320} />
            </div>
            <div>
              {lbl(fa ? "کلمات کلیدی (با ویرگول جدا کن)" : "Keywords (comma separated)")}
              <input className={inputCls} style={inputStyle} value={store.metaKeywords} onChange={(e) => setS("metaKeywords", e.target.value)} placeholder={fa ? "فروشگاه، خرید آنلاین، …" : "shop, online, …"} />
            </div>
            <div>
              {lbl(fa ? "تصویر اشتراک‌گذاری (OG Image)" : "Open Graph image")}
              <div className="flex items-center gap-3">
                {store.ogImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={store.ogImage} alt="og" className="h-14 w-24 rounded-[8px] object-cover" style={{ border: "1px solid var(--border)" }} />
                ) : null}
                <UploadButton accept="image/*" label={fa ? "آپلود تصویر" : "Upload image"} onUploaded={(url) => setS("ogImage", url)} />
                {store.ogImage && <button type="button" onClick={() => setS("ogImage", "")} className="cursor-pointer border-none bg-transparent text-[12.5px] font-bold" style={{ color: "#e11d48" }}>{fa ? "حذف" : "Remove"}</button>}
              </div>
            </div>
            <button onClick={saveStore} disabled={storeSaving} className="mt-1 cursor-pointer rounded-[12px] border-none py-3 text-[14px] font-extrabold text-white disabled:opacity-60" style={{ background: "var(--accent)" }}>
              {storeSaving ? (fa ? "در حال ذخیره…" : "Saving…") : fa ? "ذخیره سئو" : "Save SEO"}
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
                <select className={inputCls} style={inputStyle} value={modelOptions.includes(aiForm.model) ? aiForm.model : "__custom"} onChange={setAiF("model")} dir="ltr">
                  {modelOptions.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                  <option value="__custom">{fa ? "مدل سفارشی…" : "Custom model…"}</option>
                </select>
                {!modelOptions.includes(aiForm.model) && (
                  <input className={`${inputCls} mt-2`} style={inputStyle} value={aiForm.model === "__custom" ? "" : aiForm.model} onChange={setAiF("model")} dir="ltr" placeholder={fa ? "نام مدل را تایپ کن" : "type model name"} />
                )}
              </div>
            </div>
            <div className="text-[11.5px]" style={{ color: "var(--muted)" }}>
              {aiModelsLoading
                ? (fa ? "در حال دریافت لیست مدل‌ها…" : "Loading models…")
                : aiModelsLive
                  ? (fa ? `✓ ${num(aiModels.length, locale)} مدل از حساب گپ‌جی‌پی‌تی شما` : `✓ ${aiModels.length} models from your GapGPT account`)
                  : (fa ? "لیست پیش‌فرض — برای دریافت لیست واقعی، کلید API را ذخیره کن" : "Default list — save your API key to fetch the live list")}
            </div>
            {/* per-section model selection */}
            <div className="rounded-[12px] p-3.5" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
              <div className="mb-1 text-[13px] font-extrabold">{fa ? "مدل هر بخش استودیو" : "Model per Studio section"}</div>
              <p className="mb-3 text-[11.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
                {fa
                  ? "برای هر بخش می‌توانی یک مدل جدا انتخاب کنی (مثلاً مدل متنی برای مقاله و مدل تصویری برای تولید عکس). اگر «پیش‌فرض» را بگذاری، از مدل اصلی بالا استفاده می‌شود."
                  : "Pick a separate model for each section (e.g. a text model for articles, an image model for image generation). Leave “Default” to use the main model above."}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {([
                  ["article", fa ? "مقاله و بلاگ" : "Article & blog"],
                  ["product", fa ? "محتوای محصول" : "Product content"],
                  ["tool", fa ? "ابزارهای متنی" : "Text tools"],
                  ["image", fa ? "تولید تصویر" : "Image generation"],
                  ["chat", fa ? "چت و دستیار" : "Chat & assistant"],
                  ["search", fa ? "جستجوی هوشمند" : "Smart search"],
                ] as const).map(([task, label]) => {
                  const isImage = task === "image";
                  const opts = isImage
                    ? Array.from(new Set(["gpt-image-2", ...baseModels.filter((m) => /image|dall|flux|sd|midjourney/i.test(m))]))
                    : baseModels;
                  const cur = aiTaskModels[task] || "";
                  return (
                    <div key={task}>
                      {lbl(label)}
                      <select
                        className={inputCls}
                        style={inputStyle}
                        dir="ltr"
                        value={cur && opts.includes(cur) ? cur : cur ? "__keep" : ""}
                        onChange={(e) =>
                          setAiTaskModels((m) => {
                            const v = e.target.value;
                            const next = { ...m };
                            if (v === "" || v === "__keep") delete next[task];
                            else next[task] = v;
                            return next;
                          })
                        }
                      >
                        <option value="">{fa ? "پیش‌فرض" : "Default"}</option>
                        {cur && !opts.includes(cur) && <option value="__keep">{cur}</option>}
                        {opts.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
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
