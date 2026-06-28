"use client";

import { useEffect, useMemo, useState } from "react";
import { useShop } from "@/lib/store";
import { CATEGORIES } from "@/data/categories";
import type { Product } from "@/lib/types";
import type { HomeContent, BiText, HomeFeature, HomeTestimonial, HomeFaq } from "@/lib/home";
import type { ShipMethod, PayMethod } from "@/lib/settings";
import type { SeoSettings } from "@/lib/seo";
import type { Post } from "@/data/posts";
import type { OrderStatus } from "@/lib/userstore";
import { grad, priceFmt, num, formatDate, hasVariations, totalStock, isBrandPriced, priceFor } from "@/lib/format";
import { AI_MODELS } from "@/data/aiModels";
import { ProductModal } from "@/components/admin/ProductModal";
import { LogoutButton } from "@/components/LogoutButton";
import { UploadButton } from "@/components/UploadButton";
import { ArticleEditor } from "@/components/admin/ArticleEditor";
import { JalaliDateTimePicker } from "@/components/JalaliDateTimePicker";
import { translateOne, translateWithStatus } from "@/lib/aitranslate";
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
  | "home"
  | "products"
  | "categories"
  | "menu"
  | "brands"
  | "pages"
  | "orders"
  | "customers"
  | "discounts"
  | "reviews"
  | "blog"
  | "reports"
  | "ai"
  | "seo"
  | "loyalty"
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
  themeAccent?: string;
  themeRadius?: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogImage: string;
  shipFee: number;
  freeShipThreshold: number;
  taxRate: number;
  maintenance: boolean;
  cod: boolean;
  shippingMethods?: ShipMethod[];
  paymentMethods?: PayMethod[];
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
    { id: "home", label: fa ? "صفحهٔ اصلی" : "Homepage" },
    { id: "products", label: t.aProducts },
    { id: "categories", label: fa ? "دسته‌بندی‌ها" : "Categories" },
    { id: "menu", label: fa ? "منوها" : "Menus" },
    { id: "brands", label: fa ? "برندها" : "Brands" },
    { id: "pages", label: fa ? "صفحات" : "Pages" },
    { id: "orders", label: t.aOrders },
    { id: "customers", label: t.aCustomers },
    { id: "discounts", label: t.aDiscounts },
    { id: "reviews", label: t.aReviews },
    { id: "blog", label: fa ? "مقالات" : "Articles" },
    { id: "reports", label: t.aReports },
    { id: "ai", label: t.aAi },
    { id: "seo", label: fa ? "سئو" : "SEO" },
    { id: "loyalty", label: fa ? "باشگاه وفاداری" : "Loyalty" },
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

  // bulk delete / update on selected products
  const bulkProducts = async (ids: number[], op: "delete" | "update", patch?: Record<string, unknown>): Promise<boolean> => {
    try {
      const r = await fetch("/api/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "bulk", op, ids, patch }),
      });
      const d = await r.json();
      if (d.ok && Array.isArray(d.products)) {
        setProducts(d.products);
        toast(op === "delete" ? (fa ? `${num(ids.length, locale)} محصول حذف شد ✓` : "Deleted ✓") : (fa ? `${num(ids.length, locale)} محصول ویرایش شد ✓` : "Updated ✓"));
        return true;
      }
      toast(fa ? "عملیات ناموفق بود" : "Failed");
      return false;
    } catch {
      toast(fa ? "خطای شبکه" : "Network error");
      return false;
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
          {section === "home" && <HomeAdmin />}
          {section === "products" && (
            <Products
              products={products}
              statusOf={statusOf}
              onAdd={openAdd}
              onEdit={openEdit}
              onDelete={deleteProduct}
              onBulk={bulkProducts}
            />
          )}
          {section === "categories" && <CategoriesAdmin />}
          {section === "menu" && <MenuAdmin />}
          {section === "brands" && <BrandsAdmin />}
          {section === "pages" && <PagesAdmin />}
          {section === "orders" && <Orders />}
          {section === "customers" && <Customers />}
          {section === "discounts" && <Discounts />}
          {section === "reviews" && <Reviews products={products} />}
          {section === "blog" && <ArticleEditor />}
          {section === "reports" && <Reports />}
          {section === "ai" && <AiStudio />}
          {section === "seo" && <SeoAdmin />}
          {section === "loyalty" && <LoyaltyAdmin />}
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
  onBulk,
}: {
  products: Product[];
  statusOf: (s: number) => { label: string; color: string };
  onAdd: () => void;
  onEdit: (p: Product) => void;
  onDelete: (id: number) => void;
  onBulk: (ids: number[], op: "delete" | "update", patch?: Record<string, unknown>) => Promise<boolean>;
}) {
  const { locale, t, dark, toast, categories: liveCats } = useShop();
  const fa = locale === "fa";
  const cats = liveCats.length ? liveCats : CATEGORIES;
  const catName = (id: string) => { const c = cats.find((x) => x.id === id); return c ? (fa ? c.fa : c.en) : id; };
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [stockFilter, setStockFilter] = useState<"" | "in" | "low" | "out">("");
  const [typeFilter, setTypeFilter] = useState<"" | "per_cm" | "unit">("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkEdit, setBulkEdit] = useState(false);
  const [confirmBulkDel, setConfirmBulkDel] = useState(false);
  const [patch, setPatch] = useState({ cat: "", brand: "", stock: "", price: "", discountPct: "", pricePerCm: "", width: "" });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (catFilter && p.cat !== catFilter) return false;
      const stk = totalStock(p);
      if (stockFilter === "in" && stk <= 20) return false;
      if (stockFilter === "low" && !(stk > 0 && stk <= 20)) return false;
      if (stockFilter === "out" && stk !== 0) return false;
      if (typeFilter === "per_cm" && p.pricingType !== "per_cm") return false;
      if (typeFilter === "unit" && p.pricingType === "per_cm") return false;
      if (q && !(`${p.fa} ${p.en} ${p.brand} ${p.sku ?? ""}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [products, query, catFilter, stockFilter, typeFilter]);

  const filteredIds = filtered.map((p) => p.id);
  const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selected.has(id));
  const toggle = (id: number) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected((s) => { if (allSelected) { const n = new Set(s); filteredIds.forEach((id) => n.delete(id)); return n; } return new Set([...s, ...filteredIds]); });
  const clearSel = () => { setSelected(new Set()); setBulkEdit(false); setConfirmBulkDel(false); };

  const ids = [...selected];
  const applyBulkEdit = async () => {
    if (!patch.cat && !patch.brand && !patch.stock && !patch.price && !patch.discountPct && !patch.pricePerCm && !patch.width) { toast(fa ? "حداقل یک فیلد را پر کن" : "Fill a field"); return; }
    const ok = await onBulk(ids, "update", { ...patch });
    if (ok) { setPatch({ cat: "", brand: "", stock: "", price: "", discountPct: "", pricePerCm: "", width: "" }); setBulkEdit(false); clearSel(); }
  };
  const doBulkDelete = async () => { const ok = await onBulk(ids, "delete"); if (ok) clearSel(); };

  const onDeleteClick = (p: Product) => {
    if (confirmId === p.id) { setConfirmId(null); onDelete(p.id); }
    else { setConfirmId(p.id); toast(fa ? "برای حذف دوباره بزنید" : "Tap again to delete"); }
  };

  const selStyle = { background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" } as const;
  const fieldCls = "rounded-[10px] px-3 py-2 text-[13px] outline-none";

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <H1>{t.aProducts}</H1>
        <button onClick={onAdd} className="inline-flex cursor-pointer items-center gap-1.5 rounded-[12px] border-none px-4 py-2.5 text-[13.5px] font-extrabold text-white" style={{ background: "var(--accent)" }}>
          <Plus size={16} /> {fa ? "افزودن محصول" : "Add product"}
        </button>
      </div>

      {/* filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={fa ? "جستجوی نام، برند یا SKU…" : "Search…"} className={`${fieldCls} min-w-[200px] flex-1`} style={selStyle} />
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className={fieldCls} style={selStyle}>
          <option value="">{fa ? "همهٔ دسته‌ها" : "All categories"}</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{fa ? c.fa : c.en}</option>)}
        </select>
        <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)} className={fieldCls} style={selStyle}>
          <option value="">{fa ? "همهٔ موجودی‌ها" : "All stock"}</option>
          <option value="in">{fa ? "موجود" : "In stock"}</option>
          <option value="low">{fa ? "موجودی کم" : "Low"}</option>
          <option value="out">{fa ? "ناموجود" : "Out"}</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)} className={fieldCls} style={selStyle}>
          <option value="">{fa ? "همهٔ انواع" : "All types"}</option>
          <option value="per_cm">{fa ? "سانتی (متراژی)" : "Per-cm"}</option>
          <option value="unit">{fa ? "واحدی" : "Unit"}</option>
        </select>
        <span className="text-[12.5px]" style={{ color: "var(--muted)" }}>{fa ? `${num(filtered.length, locale)} محصول` : `${filtered.length} items`}</span>
      </div>

      {/* bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-3 rounded-[12px] p-3" style={{ background: "var(--surface2)", border: "1px solid var(--accent)" }}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-extrabold">{fa ? `${num(selected.size, locale)} مورد انتخاب شده` : `${selected.size} selected`}</span>
            <span className="flex-1" />
            <button onClick={() => { setBulkEdit((v) => !v); setConfirmBulkDel(false); }} className="cursor-pointer rounded-[9px] px-3 py-1.5 text-[12.5px] font-bold" style={{ background: "var(--accent)", color: "#fff", border: "none" }}>{fa ? "ویرایش دسته‌ای" : "Bulk edit"}</button>
            {confirmBulkDel ? (
              <button onClick={doBulkDelete} className="cursor-pointer rounded-[9px] border-none px-3 py-1.5 text-[12.5px] font-bold text-white" style={{ background: "#e11d48" }}>{fa ? "تأیید حذف؟" : "Confirm delete?"}</button>
            ) : (
              <button onClick={() => { setConfirmBulkDel(true); setBulkEdit(false); }} className="cursor-pointer rounded-[9px] px-3 py-1.5 text-[12.5px] font-bold" style={{ ...selStyle, color: "#e11d48" }}>{fa ? "حذف انتخاب‌شده‌ها" : "Delete selected"}</button>
            )}
            <button onClick={clearSel} className="cursor-pointer rounded-[9px] px-3 py-1.5 text-[12.5px] font-bold" style={selStyle}>{fa ? "لغو انتخاب" : "Clear"}</button>
          </div>

          {bulkEdit && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className="mb-1 block text-[11.5px] font-bold" style={{ color: "var(--muted)" }}>{fa ? "دسته" : "Category"}</label>
                <select value={patch.cat} onChange={(e) => setPatch((p) => ({ ...p, cat: e.target.value }))} className={`${fieldCls} w-full`} style={selStyle}>
                  <option value="">{fa ? "— بدون تغییر —" : "— keep —"}</option>
                  {cats.map((c) => <option key={c.id} value={c.id}>{fa ? c.fa : c.en}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11.5px] font-bold" style={{ color: "var(--muted)" }}>{fa ? "برند" : "Brand"}</label>
                <input value={patch.brand} onChange={(e) => setPatch((p) => ({ ...p, brand: e.target.value }))} className={`${fieldCls} w-full`} style={selStyle} placeholder={fa ? "بدون تغییر" : "keep"} />
              </div>
              <div>
                <label className="mb-1 block text-[11.5px] font-bold" style={{ color: "var(--muted)" }}>{fa ? "موجودی" : "Stock"}</label>
                <input value={patch.stock} onChange={(e) => setPatch((p) => ({ ...p, stock: e.target.value }))} className={`${fieldCls} w-full`} style={selStyle} placeholder={fa ? "بدون تغییر" : "keep"} dir="ltr" />
              </div>
              <div>
                <label className="mb-1 block text-[11.5px] font-bold" style={{ color: "var(--muted)" }}>{fa ? "قیمت (تومان)" : "Price"}</label>
                <input value={patch.price} onChange={(e) => setPatch((p) => ({ ...p, price: e.target.value }))} className={`${fieldCls} w-full`} style={selStyle} placeholder={fa ? "بدون تغییر" : "keep"} dir="ltr" />
              </div>
              <div>
                <label className="mb-1 block text-[11.5px] font-bold" style={{ color: "var(--muted)" }}>{fa ? "٪ تخفیف" : "Discount %"}</label>
                <input value={patch.discountPct} onChange={(e) => setPatch((p) => ({ ...p, discountPct: e.target.value }))} className={`${fieldCls} w-full`} style={selStyle} placeholder={fa ? "مثلاً ۲۰" : "e.g. 20"} dir="ltr" />
              </div>
              <div>
                <label className="mb-1 block text-[11.5px] font-bold" style={{ color: "var(--muted)" }}>{fa ? "قیمت هر سانت" : "Price / cm"}</label>
                <input value={patch.pricePerCm} onChange={(e) => setPatch((p) => ({ ...p, pricePerCm: e.target.value }))} className={`${fieldCls} w-full`} style={selStyle} placeholder={fa ? "فقط سانتی‌ها" : "per-cm only"} dir="ltr" />
              </div>
              <div>
                <label className="mb-1 block text-[11.5px] font-bold" style={{ color: "var(--muted)" }}>{fa ? "عرض (سانت)" : "Width (cm)"}</label>
                <input value={patch.width} onChange={(e) => setPatch((p) => ({ ...p, width: e.target.value }))} className={`${fieldCls} w-full`} style={selStyle} placeholder={fa ? "اختیاری" : "optional"} dir="ltr" />
              </div>
              <div className="sm:col-span-2 lg:col-span-5">
                <button onClick={applyBulkEdit} className="cursor-pointer rounded-[10px] border-none px-5 py-2 text-[13px] font-extrabold text-white" style={{ background: "var(--accent)" }}>{fa ? "اعمال روی انتخاب‌شده‌ها" : "Apply"}</button>
                <span className="ms-2 text-[11.5px]" style={{ color: "var(--muted)" }}>{fa ? "فقط فیلدهای پرشده اعمال می‌شوند. «قیمت هر سانت» محصول را به نوع سانتی تبدیل می‌کند. درصد تخفیف، قیمت قبلی را به‌عنوان قیمت خط‌خورده ثبت می‌کند." : "Only filled fields apply."}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <Empty text={fa ? "محصولی با این فیلترها پیدا نشد." : "No products match."} />
      ) : (
        <Table head={["", t.thProduct, t.thCat, t.thPrice, t.thStock, t.thStatus, t.thActions]}>
          {/* select-all row */}
          <tr style={{ borderTop: "1px solid var(--border)", background: "var(--surface2)" }}>
            <td className="px-4 py-2"><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="select all" style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--accent)" }} /></td>
            <td className="px-4 py-2 text-[12px] font-bold" colSpan={6} style={{ textAlign: "start", color: "var(--muted)" }}>{fa ? "انتخاب همه (در این فیلتر)" : "Select all (filtered)"}</td>
          </tr>
          {filtered.map((p) => {
            const stk = totalStock(p);
            const st = statusOf(stk);
            const isSel = selected.has(p.id);
            return (
              <tr key={p.id} style={{ borderTop: "1px solid var(--border)", background: isSel ? "var(--surface2)" : undefined }}>
                <td className="px-4 py-3"><input type="checkbox" checked={isSel} onChange={() => toggle(p.id)} aria-label="select" style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--accent)" }} /></td>
                <td className="px-4 py-3" style={{ textAlign: "start" }}>
                  <div className="flex items-center gap-3">
                    {p.images && p.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt={fa ? p.fa : p.en} className="h-10 w-10 flex-none rounded-[9px] object-cover" />
                    ) : (
                      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[9px] text-[14px] font-extrabold" style={{ background: grad(p.hue, dark), color: "rgba(255,255,255,.5)" }}>
                        {(fa ? p.fa : p.en).charAt(0)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-bold">{fa ? p.fa : p.en}</div>
                      <div className="text-[11.5px]" style={{ color: "var(--muted)" }}>{p.brand}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3" style={{ textAlign: "start", color: "var(--muted)" }}>{catName(p.cat)}</td>
                <td className="px-4 py-3 font-bold" style={{ textAlign: "start" }}>
                  {hasVariations(p) || isBrandPriced(p)
                    ? <span>{fa ? "از " : "from "}{priceFmt(priceFor(p), locale, t.currency)}</span>
                    : p.pricingType === "per_cm"
                    ? <span>{priceFmt(p.pricePerCm ?? 0, locale, t.currency)}<span className="text-[11px] font-normal" style={{ color: "var(--muted)" }}> /{fa ? "سانت" : "cm"}{p.width ? ` • ${num(p.width, locale)}${fa ? "س عرض" : "cm"}` : ""}</span></span>
                    : priceFmt(p.price, locale, t.currency)}
                </td>
                <td className="px-4 py-3" style={{ textAlign: "start" }}>{num(stk, locale)}</td>
                <td className="px-4 py-3" style={{ textAlign: "start" }}><Badge label={st.label} color={st.color} /></td>
                <td className="px-4 py-3" style={{ textAlign: "start" }}>
                  <div className="flex gap-2">
                    <ActBtn onClick={() => onEdit(p)} color="var(--accent)" label={t.edit}><List size={15} /></ActBtn>
                    <ActBtn onClick={() => onDeleteClick(p)} color="#e11d48" label={t.del}><Trash size={15} /></ActBtn>
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
            {lbl(fa ? "انقضا (شمسی)" : "Expiry")}
            {form.expiry ? (
              <div>
                <JalaliDateTimePicker value={form.expiry} onChange={(iso) => setForm((f) => ({ ...f, expiry: iso }))} />
                <button type="button" onClick={() => setForm((f) => ({ ...f, expiry: "" }))} className="mt-1.5 cursor-pointer border-none bg-transparent text-[12px] font-bold" style={{ color: "#e11d48" }}>
                  {fa ? "حذف تاریخ انقضا" : "Remove expiry"}
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setForm((f) => ({ ...f, expiry: new Date(Date.now() + 7 * 86400000).toISOString() }))} className={inputCls} style={{ ...inputStyle, cursor: "pointer", textAlign: "start" }}>
                {fa ? "+ تعیین تاریخ انقضا (شمسی)" : "+ Set expiry"}
              </button>
            )}
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

/* ---------- reviews (full moderation) ---------- */

interface AdminReview {
  id: number;
  productId: number;
  author: string;
  mobile?: string;
  rating: number;
  text: string;
  date: string;
  status: "pending" | "approved" | "rejected";
  reply?: string;
}

function Reviews({ products }: { products: Product[] }) {
  const { locale, dark, toast } = useShop();
  const fa = locale === "fa";
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [replyOpen, setReplyOpen] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const prodMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const load = () =>
    fetch("/api/admin/reviews")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => Array.isArray(d?.reviews) && setReviews(d.reviews))
      .catch(() => {});
  useEffect(() => { load(); }, []);

  const act = async (id: number, action: string, reply?: string) => {
    const r = await fetch("/api/admin/reviews", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, action, reply }) });
    const d = await r.json().catch(() => ({}));
    if (d.ok) { setReviews(d.reviews); toast(fa ? "انجام شد ✓" : "Done ✓"); }
    else toast(fa ? "خطا" : "Error");
  };
  const openReply = (id: number, cur?: string) => { setReplyOpen(id); setReplyText(cur || ""); };
  const saveReply = async (id: number) => { await act(id, "reply", replyText.trim()); setReplyOpen(null); setReplyText(""); };

  const counts = {
    all: reviews.length,
    pending: reviews.filter((r) => r.status === "pending").length,
    approved: reviews.filter((r) => r.status === "approved").length,
    rejected: reviews.filter((r) => r.status === "rejected").length,
  };
  const shown = reviews.filter((r) => filter === "all" || r.status === filter);

  const stars = (n: number) => "★★★★★".slice(0, Math.round(n)) + "☆☆☆☆☆".slice(0, 5 - Math.round(n));
  const badge = (st: AdminReview["status"]) => {
    const map = {
      approved: ["#1f8a5b", "rgba(31,138,91,.15)", fa ? "تأییدشده" : "Approved"],
      pending: ["#d97706", "rgba(217,119,6,.12)", fa ? "در انتظار" : "Pending"],
      rejected: ["#e11d48", "rgba(225,29,72,.12)", fa ? "ردشده" : "Rejected"],
    } as const;
    const [c, bg, l] = map[st];
    return <span className="rounded-full px-2.5 py-1 text-[11.5px] font-extrabold" style={{ color: c, background: bg }}>{l}</span>;
  };
  const tabs: [typeof filter, string][] = [
    ["pending", fa ? "در انتظار" : "Pending"],
    ["approved", fa ? "تأییدشده" : "Approved"],
    ["rejected", fa ? "ردشده" : "Rejected"],
    ["all", fa ? "همه" : "All"],
  ];

  return (
    <>
      <H1>{fa ? "نظرات مشتریان" : "Customer reviews"}</H1>
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} className="cursor-pointer rounded-[10px] px-4 py-2 text-[13px] font-bold" style={filter === k ? { background: "var(--accent)", color: "#fff", border: "none" } : { ...inputStyle }}>
            {label} <span style={{ opacity: 0.7 }}>({num(counts[k], locale)})</span>
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <Empty text={fa ? "نظری در این بخش نیست." : "No reviews here."} />
      ) : (
        <div className="flex flex-col gap-3">
          {shown.map((r) => {
            const p = prodMap.get(r.productId);
            return (
              <div key={r.id} className="p-4" style={{ ...cardStyle, borderRadius: 14 }}>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[9px] text-[13px] font-extrabold" style={{ background: grad(p?.hue ?? 200, dark), color: "rgba(255,255,255,.6)" }}>
                    {p ? (fa ? p.fa : p.en).charAt(0) : "?"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-bold">{p ? (fa ? p.fa : p.en) : `#${r.productId}`}</div>
                    <div className="text-[12px]" style={{ color: "var(--muted)" }}>
                      {r.author} • {formatDate(r.date, locale, { year: "numeric", month: "short", day: "numeric" })}
                    </div>
                  </div>
                  <span className="text-[14px]" style={{ color: "#d97706", letterSpacing: 1 }}>{stars(r.rating)}</span>
                  {badge(r.status)}
                </div>
                <p className="mt-2.5 text-[13.5px] leading-relaxed" style={{ color: "var(--text)", textAlign: "start" }}>{r.text}</p>
                {r.reply && replyOpen !== r.id && (
                  <div className="mt-2 rounded-[10px] p-2.5 text-[12.5px]" style={{ background: "var(--surface2)", color: "var(--text)" }}>
                    <b style={{ color: "var(--accent)" }}>{fa ? "پاسخ فروشگاه: " : "Reply: "}</b>{r.reply}
                    <button onClick={() => openReply(r.id, r.reply)} className="ms-2 cursor-pointer border-none bg-transparent text-[11.5px] font-bold" style={{ color: "var(--accent)" }}>{fa ? "ویرایش" : "Edit"}</button>
                  </div>
                )}
                {replyOpen === r.id && (
                  <div className="mt-2.5">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      autoFocus
                      placeholder={fa ? "پاسخ فروشگاه به این نظر…" : "Your reply…"}
                      className="w-full rounded-[10px] px-3 py-2.5 text-[13px] outline-none"
                      style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
                    />
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => saveReply(r.id)} className="cursor-pointer rounded-[9px] border-none px-4 py-1.5 text-[12.5px] font-bold text-white" style={{ background: "var(--accent)" }}>{fa ? "ثبت پاسخ" : "Save reply"}</button>
                      <button onClick={() => { setReplyOpen(null); setReplyText(""); }} className="cursor-pointer rounded-[9px] px-3 py-1.5 text-[12.5px] font-bold" style={inputStyle}>{fa ? "انصراف" : "Cancel"}</button>
                      {r.reply && <button onClick={() => { act(r.id, "reply", ""); setReplyOpen(null); }} className="cursor-pointer rounded-[9px] px-3 py-1.5 text-[12.5px] font-bold" style={{ ...inputStyle, color: "#e11d48" }}>{fa ? "حذف پاسخ" : "Remove"}</button>}
                    </div>
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.status !== "approved" && <button onClick={() => act(r.id, "approve")} className="cursor-pointer rounded-[9px] border-none px-3 py-1.5 text-[12.5px] font-bold text-white" style={{ background: "#1f8a5b" }}>{fa ? "تأیید" : "Approve"}</button>}
                  {r.status !== "rejected" && <button onClick={() => act(r.id, "reject")} className="cursor-pointer rounded-[9px] px-3 py-1.5 text-[12.5px] font-bold" style={{ ...inputStyle, color: "#e11d48" }}>{fa ? "رد" : "Reject"}</button>}
                  {replyOpen !== r.id && <button onClick={() => openReply(r.id, r.reply)} className="cursor-pointer rounded-[9px] px-3 py-1.5 text-[12.5px] font-bold" style={inputStyle}>{r.reply ? (fa ? "ویرایش پاسخ" : "Edit reply") : (fa ? "پاسخ دادن" : "Reply")}</button>}
                  <button onClick={() => act(r.id, "delete")} className="cursor-pointer rounded-[9px] px-3 py-1.5 text-[12.5px] font-bold" style={{ ...inputStyle, color: "#e11d48" }}>{fa ? "حذف" : "Delete"}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ---------- categories management ---------- */

type CatRow = { id: string; fa: string; en: string; hue: number; subs: [string, string][]; hidden?: boolean };

function CategoriesAdmin() {
  const { locale, toast } = useShop();
  const fa = locale === "fa";
  const [cats, setCats] = useState<CatRow[]>([]);
  const [editing, setEditing] = useState<CatRow | null>(null);
  const blank: CatRow = { id: "", fa: "", en: "", hue: 215, subs: [] };
  const [form, setForm] = useState<CatRow>(blank);
  const [subFa, setSubFa] = useState("");
  const [subEn, setSubEn] = useState("");
  const [subEdit, setSubEdit] = useState<number | null>(null);

  const load = () => fetch("/api/categories").then((r) => r.json()).then((d) => Array.isArray(d?.categories) && setCats(d.categories)).catch(() => {});
  useEffect(() => { load(); }, []);

  const startNew = () => { setEditing(null); setForm(blank); cancelSubEdit(); };
  const startEdit = (c: CatRow) => { setEditing(c); setForm({ ...c, subs: [...c.subs] }); cancelSubEdit(); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const addSub = async () => {
    if (!subFa.trim()) return;
    let en = subEn.trim();
    if (!en) en = (await translateOne(subFa.trim())) || subFa.trim();
    const pair: [string, string] = [subFa.trim(), en];
    setForm((f) => ({ ...f, subs: subEdit === null ? [...f.subs, pair] : f.subs.map((s, x) => (x === subEdit ? pair : s)) }));
    setSubFa(""); setSubEn(""); setSubEdit(null);
  };
  const editSub = (i: number) => { const [f1, e1] = form.subs[i]; setSubFa(f1); setSubEn(e1); setSubEdit(i); };
  const cancelSubEdit = () => { setSubFa(""); setSubEn(""); setSubEdit(null); };
  const autoEnCat = async () => { if (form.fa.trim() && !form.en.trim()) { const v = await translateOne(form.fa.trim()); if (v) setForm((f) => ({ ...f, en: v })); } };
  const [aiBusy, setAiBusy] = useState(false);
  const aiErr = (r: { error?: string; detail?: string }) => {
    const msg = `${r.detail || r.error || ""}`;
    if (/quota|insufficient|balance|credit|اعتبار/i.test(msg))
      toast(fa ? "اعتبار حساب سرویس هوش مصنوعی تمام شده — لطفاً حساب را شارژ کن" : "AI account out of credit — please top up");
    else if (r.error === "ai-unavailable")
      toast(fa ? "هوش مصنوعی تنظیم نشده — در «تنظیمات ← هوش مصنوعی» کلید و مدل را ذخیره و تست کن" : "AI not configured");
    else toast((fa ? "خطای هوش مصنوعی: " : "AI error: ") + msg);
  };
  // explicit "complete with AI" — translates the name (overwrites) + any subs missing English
  const fillEnCat = async () => {
    if (!form.fa.trim()) { toast(fa ? "اول نام فارسی را بنویس" : "Enter Persian name"); return; }
    setAiBusy(true);
    try {
      const need = form.subs.filter(([f1, e1]) => !e1 || e1 === f1);
      const r = await translateWithStatus([form.fa.trim(), ...need.map(([f1]) => f1)]);
      if (!r.ok) { aiErr(r); return; }
      const [nameEn, ...subEn] = r.results;
      setForm((f) => {
        let i = 0;
        const subs = f.subs.map(([f1, e1]) => (!e1 || e1 === f1 ? [f1, subEn[i++] || e1 || f1] : [f1, e1]) as [string, string]);
        return { ...f, en: nameEn || f.en, subs };
      });
      toast(nameEn ? (fa ? "انگلیسی تکمیل شد ✓" : "Completed ✓") : (fa ? "ترجمه‌ای دریافت نشد" : "No result"));
    } catch { toast(fa ? "خطای شبکه" : "Error"); } finally { setAiBusy(false); }
  };
  const rmSub = (i: number) => { setForm((f) => ({ ...f, subs: f.subs.filter((_, x) => x !== i) })); if (subEdit === i) cancelSubEdit(); };

  const save = async () => {
    if (!form.fa.trim()) { toast(fa ? "نام دسته الزامی است" : "Name required"); return; }
    const body = { action: editing ? "update" : "add", id: form.id, fa: form.fa.trim(), en: form.en.trim(), hue: form.hue, subs: form.subs };
    const r = await fetch("/api/categories", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json();
    if (d.ok) { setCats(d.categories); startNew(); toast(fa ? "ذخیره شد ✓ (برای دیدن در سایت صفحه را تازه کن)" : "Saved ✓"); }
    else toast(fa ? "ذخیره ناموفق بود" : "Save failed");
  };
  const del = async (id: string) => {
    const r = await fetch("/api/categories", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "delete", id }) });
    const d = await r.json();
    if (d.ok) { setCats(d.categories); toast(fa ? "حذف شد" : "Deleted"); }
  };

  return (
    <>
      <H1>{fa ? "دسته‌بندی‌ها" : "Categories"}</H1>
      <p className="mb-5 text-[13px]" style={{ color: "var(--muted)" }}>{fa ? "دسته‌های اصلی و زیردسته‌ها را اینجا مدیریت کن. این‌ها در منوی سایت، فیلتر فروشگاه و فرم محصول استفاده می‌شوند." : "Manage categories and subcategories used across the site."}</p>

      <Card className="mb-6 p-5">
        <h2 className="mb-3 text-[15px] font-extrabold">{editing ? (fa ? "ویرایش دسته" : "Edit category") : fa ? "افزودن دستهٔ جدید" : "Add category"}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>{lbl(fa ? "نام (فارسی)" : "Name (FA)")}<input className={inputCls} style={inputStyle} value={form.fa} onChange={(e) => setForm((f) => ({ ...f, fa: e.target.value }))} onBlur={autoEnCat} /></div>
          <div>{lbl(fa ? "نام انگلیسی (خودکار)" : "Name (EN)")}<input className={inputCls} style={inputStyle} value={form.en} onChange={(e) => setForm((f) => ({ ...f, en: e.target.value }))} dir="ltr" placeholder={fa ? "خودکار از فارسی" : "auto"} /></div>
          <div className="sm:col-span-2">
            {lbl(fa ? "رنگ دسته" : "Color")}
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 flex-none rounded-[10px]" style={{ background: `hsl(${form.hue} 70% 55%)`, border: "1px solid var(--border)" }} />
              <input type="range" min={0} max={360} value={form.hue} onChange={(e) => setForm((f) => ({ ...f, hue: Number(e.target.value) || 0 }))} className="h-2 flex-1 cursor-pointer" style={{ accentColor: `hsl(${form.hue} 70% 55%)` }} />
              <input type="number" min={0} max={360} value={form.hue} onChange={(e) => setForm((f) => ({ ...f, hue: Math.min(360, Math.max(0, Number(e.target.value) || 0)) }))} className="w-[72px] rounded-[10px] px-2.5 py-2 text-[13px] outline-none" style={inputStyle} dir="ltr" />
            </div>
          </div>
        </div>
        {/* subs */}
        <div className="mt-3">
          {lbl(fa ? "زیردسته‌ها" : "Subcategories")}
          <div className="mb-2 flex flex-wrap gap-1.5">
            {form.subs.map(([f1, e1], i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold" style={{ background: subEdit === i ? "var(--accent)" : "var(--surface2)", color: subEdit === i ? "#fff" : "var(--text)", border: "1px solid var(--border)" }}>
                <button onClick={() => editSub(i)} title={fa ? "ویرایش زیردسته" : "Edit subcategory"} className="cursor-pointer border-none bg-transparent p-0 text-[12px] font-bold" style={{ color: "inherit" }}>{fa ? f1 : e1}</button>
                <button onClick={() => rmSub(i)} title={fa ? "حذف" : "Remove"} className="cursor-pointer border-none bg-transparent text-[12px]" style={{ color: subEdit === i ? "#fff" : "#e11d48" }}>×</button>
              </span>
            ))}
            {form.subs.length === 0 && <span className="text-[12px]" style={{ color: "var(--muted)" }}>{fa ? "زیردسته‌ای اضافه نشده" : "none"}</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            <input className={inputCls} style={{ ...inputStyle, maxWidth: 200 }} value={subFa} onChange={(e) => setSubFa(e.target.value)} placeholder={fa ? "نام زیردسته (فارسی)" : "Sub (FA)"} onKeyDown={(e) => { if (e.key === "Enter") addSub(); }} onBlur={async () => { if (subFa.trim() && !subEn.trim()) { const v = await translateOne(subFa.trim()); if (v) setSubEn(v); } }} />
            <input className={inputCls} style={{ ...inputStyle, maxWidth: 200 }} value={subEn} onChange={(e) => setSubEn(e.target.value)} placeholder={fa ? "انگلیسی (اختیاری)" : "Sub (EN)"} dir="ltr" onKeyDown={(e) => { if (e.key === "Enter") addSub(); }} />
            <button onClick={addSub} className="cursor-pointer rounded-[10px] px-4 text-[13px] font-bold" style={inputStyle}>{subEdit === null ? `+ ${fa ? "افزودن" : "Add"}` : (fa ? "ذخیره زیردسته" : "Update")}</button>
            {subEdit !== null && <button onClick={cancelSubEdit} className="cursor-pointer rounded-[10px] px-4 text-[13px] font-bold" style={inputStyle}>{fa ? "انصراف" : "Cancel"}</button>}
          </div>
          {subEdit !== null && <div className="mt-1.5 text-[11.5px]" style={{ color: "var(--accent)" }}>{fa ? "در حال ویرایش زیردسته — تغییر بده و «ذخیره زیردسته» را بزن" : "Editing subcategory"}</div>}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={save} className="cursor-pointer rounded-[12px] border-none px-6 py-2.5 text-[14px] font-extrabold text-white" style={{ background: "var(--accent)" }}>{editing ? (fa ? "ذخیره تغییرات" : "Save") : fa ? "افزودن دسته" : "Add"}</button>
          <button onClick={fillEnCat} disabled={aiBusy} className="inline-flex cursor-pointer items-center gap-1.5 rounded-[12px] px-4 py-2.5 text-[13.5px] font-bold disabled:opacity-60" style={{ ...inputStyle, color: "var(--accent)" }}>
            <Sparkle size={15} /> {aiBusy ? (fa ? "در حال ترجمه…" : "…") : fa ? "تکمیل انگلیسی با هوش مصنوعی" : "AI complete English"}
          </button>
          {editing && <button onClick={startNew} className="cursor-pointer rounded-[12px] px-4 py-2.5 text-[13.5px] font-bold" style={inputStyle}>{fa ? "انصراف" : "Cancel"}</button>}
        </div>
      </Card>

      {cats.length === 0 ? <Empty text={fa ? "دسته‌ای نیست." : "No categories."} /> : (
        <div className="flex flex-col gap-2">
          {cats.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-[12px] p-3" style={{ ...cardStyle }}>
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[9px] text-[13px] font-extrabold text-white" style={{ background: `hsl(${c.hue} 70% 55%)` }}>{(fa ? c.fa : c.en).charAt(0)}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-bold">{fa ? c.fa : c.en}</div>
                <div className="truncate text-[12px]" style={{ color: "var(--muted)" }}>{c.subs.map(([f1, e1]) => (fa ? f1 : e1)).join("، ") || (fa ? "بدون زیردسته" : "no subs")}</div>
              </div>
              <button onClick={() => startEdit(c)} className="cursor-pointer border-none bg-transparent text-[12.5px] font-bold" style={{ color: "var(--accent)" }}>{fa ? "ویرایش" : "Edit"}</button>
              <button onClick={() => del(c.id)} className="cursor-pointer border-none bg-transparent text-[12.5px] font-bold" style={{ color: "#e11d48" }}>{fa ? "حذف" : "Delete"}</button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ---------- homepage block editor (live preview) ---------- */

function HomeAdmin() {
  const { locale, toast } = useShop();
  const fa = locale === "fa";
  const [c, setC] = useState<HomeContent | null>(null);
  const [busy, setBusy] = useState(false);
  const [aiKey, setAiKey] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => { fetch("/api/home").then((r) => r.json()).then((d) => d?.home && setC(d.home)).catch(() => {}); }, []);

  if (!c) return <><H1>{fa ? "صفحهٔ اصلی" : "Homepage"}</H1><Empty text={fa ? "در حال بارگذاری…" : "Loading…"} /></>;

  const setBi = (k: keyof HomeContent, lang: "fa" | "en", val: string) =>
    setC((p) => (p ? { ...p, [k]: { ...(p[k] as BiText), [lang]: val } } : p));
  const setNum = (k: keyof HomeContent, val: number) => setC((p) => (p ? { ...p, [k]: val } : p));

  // translate one block's fa → en
  const aiBi = async (k: keyof HomeContent) => {
    const cur = c[k] as BiText;
    if (!cur?.fa?.trim()) { toast(fa ? "اول متن فارسی را بنویس" : "Enter Persian first"); return; }
    setAiKey(String(k));
    try { const v = await translateOne(cur.fa.trim()); if (v) setBi(k, "en", v); else toast(fa ? "ترجمه‌ای دریافت نشد" : "No result"); }
    catch { toast(fa ? "خطای شبکه" : "Error"); } finally { setAiKey(null); }
  };

  // a bilingual field row (returned as JSX, NOT a component, to keep focus)
  const biField = (label: string, k: keyof HomeContent, opts?: { area?: boolean }) => {
    const v = c[k] as BiText;
    const Tag = opts?.area ? "textarea" : "input";
    return (
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between">
          {lbl(label)}
          <button type="button" onClick={() => aiBi(k)} disabled={aiKey === String(k)} className="mb-1 inline-flex cursor-pointer items-center gap-1 rounded-[8px] px-2 py-1 text-[11.5px] font-bold disabled:opacity-60" style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--accent)" }}>✨ {aiKey === String(k) ? "…" : fa ? "ترجمه" : "Translate"}</button>
        </div>
        <Tag className={inputCls} style={inputStyle} value={v.fa} placeholder={fa ? "فارسی" : "Persian"} onChange={(e) => setBi(k, "fa", (e.target as HTMLInputElement).value)} />
        <Tag className={`${inputCls} mt-1.5`} style={inputStyle} dir="ltr" value={v.en} placeholder="English" onChange={(e) => setBi(k, "en", (e.target as HTMLInputElement).value)} />
      </div>
    );
  };

  const hrefField = (label: string, k: "bannerCtaHref" | "promoAHref" | "promoBHref") => (
    <div className="mb-3">
      {lbl(label)}
      <input className={inputCls} style={inputStyle} dir="ltr" value={(c[k] as string) || ""} placeholder="/shop  •  /shop?cat=…  •  https://…" onChange={(e) => setC((p) => (p ? { ...p, [k]: e.target.value } : p))} />
    </div>
  );

  const hueRow = (label: string, k: keyof HomeContent) => {
    const val = c[k] as number;
    const on = typeof val === "number" && val >= 0;
    return (
      <div className="mb-3">
        {lbl(label)}
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-1.5 text-[12.5px] font-bold">
            <input type="checkbox" checked={on} onChange={(e) => setNum(k, e.target.checked ? 255 : -1)} style={{ accentColor: "var(--accent)" }} />
            {fa ? "رنگ سفارشی" : "Custom"}
          </label>
          {on && <>
            <span className="h-8 w-8 flex-none rounded-[8px]" style={{ background: `hsl(${val} 70% 55%)`, border: "1px solid var(--border)" }} />
            <input type="range" min={0} max={360} value={val} onChange={(e) => setNum(k, Number(e.target.value))} className="h-2 flex-1 cursor-pointer" style={{ accentColor: `hsl(${val} 70% 55%)` }} />
            <input type="number" min={0} max={360} value={val} onChange={(e) => setNum(k, Math.min(360, Math.max(0, Number(e.target.value) || 0)))} className="w-[64px] rounded-[8px] px-2 py-1.5 text-[12.5px]" style={inputStyle} dir="ltr" />
          </>}
        </div>
      </div>
    );
  };

  const save = async (reset = false) => {
    setBusy(true);
    try {
      const r = await fetch("/api/home", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(reset ? { action: "reset" } : { home: c }) });
      const d = await r.json();
      if (d.ok) { setC(d.home); setPreviewKey((p) => p + 1); toast(fa ? "ذخیره شد ✓ پیش‌نمایش به‌روز شد" : "Saved ✓"); }
      else toast(fa ? "ذخیره ناموفق بود" : "Save failed");
    } catch { toast(fa ? "خطای شبکه" : "Error"); } finally { setBusy(false); }
  };

  // ---- list editors ----
  const updateList = <T,>(k: "examples" | "features" | "testimonials" | "faqs", list: T[]) => setC((p) => (p ? { ...p, [k]: list } : p));

  const sec = (title: string, body: React.ReactNode) => (
    <Card className="mb-4 p-5"><h3 className="mb-3 text-[14px] font-extrabold">{title}</h3>{body}</Card>
  );

  return (
    <>
      <H1>{fa ? "ویرایش صفحهٔ اصلی" : "Homepage editor"}</H1>
      <p className="mb-4 text-[13px]" style={{ color: "var(--muted)" }}>{fa ? "متن و رنگ همهٔ بخش‌های صفحهٔ اصلی را اینجا ویرایش کن. هر فیلد را خالی بگذاری، مقدار پیش‌فرض نمایش داده می‌شود. بعد از «ذخیره» پیش‌نمایش سمت کنار به‌روز می‌شود." : "Edit every homepage block here; empty fields fall back to defaults."}</p>

      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => save(false)} disabled={busy} className="cursor-pointer rounded-[12px] border-none px-6 py-2.5 text-[14px] font-extrabold text-white disabled:opacity-60" style={{ background: "var(--accent)" }}>{busy ? (fa ? "در حال ذخیره…" : "…") : fa ? "ذخیره و به‌روزرسانی پیش‌نمایش" : "Save"}</button>
        <button onClick={() => setPreviewKey((p) => p + 1)} className="cursor-pointer rounded-[12px] px-4 py-2.5 text-[13.5px] font-bold" style={inputStyle}>{fa ? "بازخوانی پیش‌نمایش" : "Reload preview"}</button>
        <a href={`/${locale}`} target="_blank" rel="noreferrer" className="cursor-pointer rounded-[12px] px-4 py-2.5 text-[13.5px] font-bold no-underline" style={{ ...inputStyle, color: "var(--accent)" }}>{fa ? "باز کردن در تب جدید ↗" : "Open ↗"}</a>
        <button onClick={() => { if (confirm(fa ? "همه‌چیز به حالت پیش‌فرض برگردد؟" : "Reset all to defaults?")) save(true); }} className="cursor-pointer rounded-[12px] px-4 py-2.5 text-[13.5px] font-bold" style={{ ...inputStyle, color: "#e11d48" }}>{fa ? "بازنشانی به پیش‌فرض" : "Reset"}</button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_460px]">
        <div className="min-w-0">
          {sec(fa ? "بنر هوش مصنوعی (بالای صفحه)" : "AI hero", <>
            {biField(fa ? "نشان (بَج)" : "Badge", "heroBadge")}
            {biField(fa ? "عنوان" : "Title", "heroTitle")}
            {biField(fa ? "زیرعنوان" : "Subtitle", "heroSub", { area: true })}
            {hueRow(fa ? "رنگ بنر" : "Color", "heroHue")}
            <ListEditor kind="examples" rows={c.examples} fa={fa} onChange={(l) => updateList("examples", l as BiText[])} />
          </>)}

          {sec(fa ? "بنر بزرگ + کارت‌های تبلیغ" : "Banner & promo cards", <>
            {biField(fa ? "نشان بنر" : "Banner badge", "bannerBadge")}
            {biField(fa ? "عنوان بنر" : "Banner title", "bannerTitle")}
            {biField(fa ? "زیرعنوان بنر" : "Banner subtitle", "bannerSub", { area: true })}
            {biField(fa ? "دکمهٔ اول" : "CTA 1", "bannerCta")}
            {biField(fa ? "دکمهٔ دوم" : "CTA 2", "bannerCta2")}
            {hrefField(fa ? "لینک دکمهٔ اول" : "CTA 1 link", "bannerCtaHref")}
            {hueRow(fa ? "رنگ بنر" : "Banner color", "bannerHue")}
            <div className="my-3 h-px" style={{ background: "var(--border)" }} />
            {biField(fa ? "کارت ۱ — برچسب" : "Promo A tag", "promoATag")}
            {biField(fa ? "کارت ۱ — عنوان" : "Promo A title", "promoATitle")}
            {hrefField(fa ? "کارت ۱ — لینک" : "Promo A link", "promoAHref")}
            {hueRow(fa ? "رنگ کارت ۱" : "Promo A color", "promoAHue")}
            {biField(fa ? "کارت ۲ — برچسب" : "Promo B tag", "promoBTag")}
            {biField(fa ? "کارت ۲ — عنوان" : "Promo B title", "promoBTitle")}
            {hrefField(fa ? "کارت ۲ — لینک" : "Promo B link", "promoBHref")}
          </>)}

          {sec(fa ? "نوار ویژگی‌ها" : "Feature strip", <ListEditor kind="features" rows={c.features} fa={fa} onChange={(l) => updateList("features", l as HomeFeature[])} />)}

          {sec(fa ? "عنوان بخش‌ها" : "Section titles", <>
            {biField(fa ? "پیشنهادهای هوشمند" : "Smart picks", "titleSmartPicks")}
            {biField(fa ? "خرید بر اساس دسته" : "Shop by category", "titleShopByCat")}
            {biField(fa ? "برندها" : "Brands", "titleBrands")}
            {biField(fa ? "نظرات مشتریان" : "Testimonials", "titleTestimonials")}
            {biField(fa ? "سوالات پرتکرار" : "FAQ", "titleFaq")}
          </>)}

          {sec(fa ? "نظرات مشتریان" : "Testimonials", <ListEditor kind="testimonials" rows={c.testimonials} fa={fa} onChange={(l) => updateList("testimonials", l as HomeTestimonial[])} />)}

          {sec(fa ? "سوالات پرتکرار" : "FAQ", <ListEditor kind="faqs" rows={c.faqs} fa={fa} onChange={(l) => updateList("faqs", l as HomeFaq[])} />)}
        </div>

        <div className="min-w-0">
          <div className="xl:sticky xl:top-4">
            <div className="mb-2 text-[12.5px] font-bold" style={{ color: "var(--muted)" }}>{fa ? "پیش‌نمایش زنده (بعد از ذخیره به‌روز می‌شود)" : "Live preview (updates on save)"}</div>
            <div className="overflow-hidden rounded-[14px]" style={{ border: "1px solid var(--border)", height: "70vh" }}>
              <iframe key={previewKey} src={`/${locale}?preview=${previewKey}`} title="preview" style={{ width: "100%", height: "100%", border: "none" }} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// generic list editor for the homepage blocks
function ListEditor({ kind, rows, fa, onChange }: { kind: "examples" | "features" | "testimonials" | "faqs"; rows: unknown[]; fa: boolean; onChange: (l: unknown[]) => void }) {
  const upd = (i: number, patch: Record<string, unknown>) => onChange(rows.map((r, x) => (x === i ? { ...(r as object), ...patch } : r)));
  const rm = (i: number) => onChange(rows.filter((_, x) => x !== i));
  const add = () => {
    const blank =
      kind === "examples" ? { fa: "", en: "" }
      : kind === "features" ? { icon: "⭐", fa: "", faSub: "", en: "", enSub: "" }
      : kind === "testimonials" ? { fa: "", faText: "", en: "", enText: "", rating: 5 }
      : { qFa: "", aFa: "", qEn: "", aEn: "" };
    onChange([...rows, blank]);
  };
  const ai = async (i: number, srcKey: string, dstKey: string) => {
    const val = String((rows[i] as Record<string, unknown>)[srcKey] || "").trim();
    if (!val) return;
    const v = await translateOne(val);
    if (v) upd(i, { [dstKey]: v });
  };
  const fld = (i: number, key: string, ph: string, area = false) => {
    const Tag = area ? "textarea" : "input";
    return <Tag className={inputCls} style={inputStyle} value={String((rows[i] as Record<string, unknown>)[key] ?? "")} placeholder={ph} dir={/en|En/.test(key) ? "ltr" : undefined} onChange={(e) => upd(i, { [key]: (e.target as HTMLInputElement).value })} />;
  };

  return (
    <div className="flex flex-col gap-3">
      {rows.map((_, i) => (
        <div key={i} className="rounded-[12px] p-3" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12px] font-bold" style={{ color: "var(--muted)" }}>#{i + 1}</span>
            <button onClick={() => rm(i)} className="cursor-pointer border-none bg-transparent text-[12px] font-bold" style={{ color: "#e11d48" }}>{fa ? "حذف" : "Remove"}</button>
          </div>
          {kind === "examples" && <div className="grid gap-1.5 sm:grid-cols-2">{fld(i, "fa", fa ? "نمونه (فارسی)" : "Example (FA)")}{fld(i, "en", "Example (EN)")}</div>}
          {kind === "features" && <div className="grid gap-1.5 sm:grid-cols-2">
            <input className={inputCls} style={inputStyle} value={String((rows[i] as Record<string, unknown>).icon ?? "")} placeholder={fa ? "آیکن (ایموجی)" : "Icon"} onChange={(e) => upd(i, { icon: e.target.value })} />
            <span />
            {fld(i, "fa", fa ? "عنوان فارسی" : "Title FA")}{fld(i, "faSub", fa ? "زیرنویس فارسی" : "Sub FA")}
            {fld(i, "en", "Title EN")}{fld(i, "enSub", "Sub EN")}
          </div>}
          {kind === "testimonials" && <div className="grid gap-1.5 sm:grid-cols-2">
            {fld(i, "fa", fa ? "نام (فارسی)" : "Name FA")}{fld(i, "en", "Name EN")}
            {fld(i, "faText", fa ? "متن فارسی" : "Text FA", true)}{fld(i, "enText", "Text EN", true)}
            <label className="flex items-center gap-2 text-[12.5px] font-bold">{fa ? "امتیاز" : "Rating"}
              <input type="number" min={1} max={5} className="w-[64px] rounded-[8px] px-2 py-1.5 text-[12.5px]" style={inputStyle} value={Number((rows[i] as Record<string, unknown>).rating ?? 5)} onChange={(e) => upd(i, { rating: Math.min(5, Math.max(1, Number(e.target.value) || 5)) })} dir="ltr" />
            </label>
            <button onClick={() => { ai(i, "fa", "en"); ai(i, "faText", "enText"); }} className="cursor-pointer rounded-[8px] px-2 py-1.5 text-[12px] font-bold" style={{ ...inputStyle, color: "var(--accent)" }}>✨ {fa ? "ترجمه به انگلیسی" : "Translate"}</button>
          </div>}
          {kind === "faqs" && <div className="grid gap-1.5">
            {fld(i, "qFa", fa ? "سوال (فارسی)" : "Q FA")}{fld(i, "aFa", fa ? "پاسخ (فارسی)" : "A FA", true)}
            {fld(i, "qEn", "Q EN")}{fld(i, "aEn", "A EN", true)}
            <button onClick={() => { ai(i, "qFa", "qEn"); ai(i, "aFa", "aEn"); }} className="cursor-pointer self-start rounded-[8px] px-2 py-1.5 text-[12px] font-bold" style={{ ...inputStyle, color: "var(--accent)" }}>✨ {fa ? "ترجمه به انگلیسی" : "Translate"}</button>
          </div>}
        </div>
      ))}
      <button onClick={add} className="cursor-pointer self-start rounded-[10px] px-4 py-2 text-[13px] font-bold" style={inputStyle}>+ {fa ? "افزودن" : "Add"}</button>
    </div>
  );
}

/* ---------- SEO & schema management ---------- */

function SeoAdmin() {
  const { locale, toast } = useShop();
  const fa = locale === "fa";
  const [seo, setSeo] = useState<SeoSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);

  useEffect(() => { fetch("/api/seo").then((r) => r.json()).then((d) => d?.seo && setSeo(d.seo)).catch(() => {}); }, []);
  if (!seo) return <><H1>{fa ? "سئو" : "SEO"}</H1><Empty text={fa ? "در حال بارگذاری…" : "Loading…"} /></>;

  const set = <K extends keyof SeoSettings>(k: K, v: SeoSettings[K]) => setSeo((s) => (s ? { ...s, [k]: v } : s));
  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/seo", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ seo }) });
      const d = await r.json();
      if (d.ok) { setSeo(d.seo); toast(fa ? "سئو ذخیره شد ✓ — برای دیدن، صفحهٔ سایت را تازه کن" : "Saved ✓ — refresh the site to see it"); }
      else toast(fa ? "ذخیره ناموفق بود" : "Save failed");
    } catch { toast(fa ? "خطای شبکه" : "Error"); } finally { setSaving(false); }
  };
  // one-click: AI fills the SEO texts from the store name, categories & products
  const aiFill = async () => {
    setAiBusy(true);
    try {
      const r = await fetch("/api/ai/seo", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({}) });
      const d = await r.json();
      if (d.ok && d.seo) {
        setSeo((s) => (s ? {
          ...s,
          defaultTitle: String(d.seo.defaultTitle || s.defaultTitle),
          titleTemplate: String(d.seo.titleTemplate || s.titleTemplate),
          defaultDescription: String(d.seo.defaultDescription || s.defaultDescription),
          keywords: String(d.seo.keywords || s.keywords),
          orgName: String(d.seo.orgName || s.orgName),
        } : s));
        toast(fa ? "سئو با هوش مصنوعی پر شد ✓ — بررسی و ذخیره کن" : "Filled by AI ✓");
      } else {
        const msg = `${d.error || ""}`;
        toast(/quota|insufficient|credit|balance/i.test(msg) ? (fa ? "اعتبار سرویس هوش مصنوعی تمام شده" : "AI out of credit") : (fa ? "تولید سئو ناموفق بود" : "AI failed"));
      }
    } catch { toast(fa ? "خطای شبکه" : "Error"); } finally { setAiBusy(false); }
  };

  const fld = (k: keyof SeoSettings, label: string, ph = "", area = false, ltr = true) => (
    <div>
      {lbl(label)}
      {area
        ? <textarea className={inputCls} style={{ ...inputStyle, minHeight: 70 }} dir={ltr ? "ltr" : "rtl"} value={String(seo[k] ?? "")} placeholder={ph} onChange={(e) => set(k, e.target.value as SeoSettings[typeof k])} />
        : <input className={inputCls} style={inputStyle} dir={ltr ? "ltr" : "rtl"} value={String(seo[k] ?? "")} placeholder={ph} onChange={(e) => set(k, e.target.value as SeoSettings[typeof k])} />}
    </div>
  );

  const check = (ok: boolean, label: string) => (
    <div className="flex items-center gap-2 text-[12.5px]"><span style={{ color: ok ? "#1f8a5b" : "#d97706" }}>{ok ? "✓" : "•"}</span><span style={{ color: ok ? "var(--text)" : "var(--muted)" }}>{label}</span></div>
  );

  return (
    <>
      <H1>{fa ? "سئو و داده‌های ساختاریافته" : "SEO & structured data"}</H1>
      <p className="mb-3 text-[13px]" style={{ color: "var(--muted)" }}>{fa ? "مدیریت کامل سئوی سایت: عنوان و توضیحات، اتصال به گوگل، اسکیما/Schema، آنالیتیکس، نقشهٔ سایت و robots." : "Full SEO control: titles, Google integration, schema, analytics, sitemap & robots."}</p>
      <div className="mb-5 rounded-[12px] p-4" style={{ background: "color-mix(in srgb, var(--accent) 8%, var(--surface))", border: "1px solid var(--border)" }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-[13px]"><b>{fa ? "نمی‌دونی چی بنویسی؟" : "Not sure what to write?"}</b> <span style={{ color: "var(--muted)" }}>{fa ? "بذار هوش مصنوعی عنوان، توضیح متا و کلمات کلیدی رو بر اساس فروشگاهت پر کنه." : "Let AI fill the title, meta description and keywords."}</span></div>
          <button onClick={aiFill} disabled={aiBusy} className="inline-flex cursor-pointer items-center gap-1.5 rounded-[12px] border-none px-5 py-2.5 text-[13.5px] font-extrabold text-white disabled:opacity-60" style={{ background: "var(--accent)" }}>
            <Sparkle size={15} /> {aiBusy ? (fa ? "در حال تولید…" : "…") : fa ? "تکمیل خودکار سئو با هوش مصنوعی" : "Auto-fill SEO with AI"}
          </button>
        </div>
      </div>

      {/* status */}
      <Card className="mb-5 p-5">
        <h2 className="mb-3 text-[14px] font-extrabold">{fa ? "وضعیت سئو" : "SEO status"}</h2>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {check(!!seo.siteUrl, fa ? "آدرس سایت (برای canonical و نقشهٔ سایت)" : "Site URL set")}
          {check(!!seo.defaultDescription, fa ? "توضیحات متا تنظیم شده" : "Meta description set")}
          {check(!!seo.ogImage, fa ? "تصویر اشتراک‌گذاری (OG) تنظیم شده" : "OG image set")}
          {check(!!seo.googleVerification, fa ? "تأیید گوگل سرچ‌کنسول" : "Google verification")}
          {check(!!(seo.gaId || seo.gtmId), fa ? "آنالیتیکس (GA4/GTM) متصل" : "Analytics connected")}
          {check(!!seo.orgName, fa ? "اسکیمای سازمان (Organization)" : "Organization schema")}
          {check(!seo.noindex, fa ? "ایندکس شدن سایت فعال است" : "Indexing enabled")}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="rounded-[9px] px-3 py-1.5 text-[12.5px] font-bold no-underline" style={{ ...inputStyle, color: "var(--accent)" }}>sitemap.xml ↗</a>
          <a href="/robots.txt" target="_blank" rel="noreferrer" className="rounded-[9px] px-3 py-1.5 text-[12.5px] font-bold no-underline" style={{ ...inputStyle, color: "var(--accent)" }}>robots.txt ↗</a>
        </div>
      </Card>

      <Card className="mb-5 p-5">
        <h2 className="mb-3 text-[14px] font-extrabold">{fa ? "عمومی" : "General"}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {fld("siteUrl", fa ? "آدرس سایت" : "Site URL", "https://tebtamin.ir")}
          {fld("titleTemplate", fa ? "الگوی عنوان (%s = عنوان صفحه)" : "Title template", "%s | تامین طب")}
          <div className="sm:col-span-2">{fld("defaultTitle", fa ? "عنوان پیش‌فرض / صفحهٔ اصلی" : "Default title", "", false, false)}</div>
          <div className="sm:col-span-2">{fld("defaultDescription", fa ? "توضیحات متا (حداکثر ۱۶۰ کاراکتر)" : "Meta description", "", true, false)}</div>
          <div className="sm:col-span-2">{fld("keywords", fa ? "کلمات کلیدی (با ویرگول)" : "Keywords", "", false, false)}</div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            {lbl(fa ? "تصویر اشتراک‌گذاری (OG/Twitter)" : "Social share image")}
            <div className="flex items-center gap-3">
              {seo.ogImage && /* eslint-disable-next-line @next/next/no-img-element */ <img src={seo.ogImage} alt="og" className="h-12 w-20 rounded-[8px] object-cover" style={{ border: "1px solid var(--border)" }} />}
              <UploadButton accept="image/*" label={fa ? "آپلود تصویر" : "Upload"} onUploaded={(url) => set("ogImage", url)} />
              {seo.ogImage && <button onClick={() => set("ogImage", "")} className="cursor-pointer border-none bg-transparent text-[12px] font-bold" style={{ color: "#e11d48" }}>{fa ? "حذف" : "Remove"}</button>}
            </div>
          </div>
          {fld("twitterHandle", fa ? "آیدی توییتر/X" : "Twitter handle", "@tebtamin")}
        </div>
      </Card>

      <Card className="mb-5 p-5">
        <h2 className="mb-3 text-[14px] font-extrabold">{fa ? "اتصال به گوگل و موتورهای جستجو" : "Google & search engines"}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {fld("googleVerification", fa ? "کد تأیید گوگل سرچ‌کنسول" : "Google Search Console verification", "google-site-verification token")}
          {fld("bingVerification", fa ? "کد تأیید بینگ" : "Bing verification", "msvalidate.01 token")}
          {fld("gaId", fa ? "شناسهٔ Google Analytics (GA4)" : "GA4 Measurement ID", "G-XXXXXXXXXX")}
          {fld("gtmId", fa ? "شناسهٔ Google Tag Manager" : "GTM ID", "GTM-XXXXXXX")}
        </div>
        <p className="mt-2 text-[12px]" style={{ color: "var(--muted)" }}>{fa ? "فقط کد/توکن را وارد کن (نه تگ کامل). بعد از ذخیره، تگ تأیید گوگل در همهٔ صفحات قرار می‌گیرد." : "Enter only the token/ID, not the full tag."}</p>
      </Card>

      <Card className="mb-5 p-5">
        <h2 className="mb-3 text-[14px] font-extrabold">{fa ? "اسکیمای سازمان (Schema.org)" : "Organization schema"}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {fld("orgName", fa ? "نام سازمان/برند" : "Organization name", "", false, false)}
          <div>
            {lbl(fa ? "لوگو (برای اسکیما)" : "Logo")}
            <div className="flex items-center gap-3">
              {seo.orgLogo && /* eslint-disable-next-line @next/next/no-img-element */ <img src={seo.orgLogo} alt="logo" className="h-10 w-10 rounded-[8px] object-contain" style={{ border: "1px solid var(--border)" }} />}
              <UploadButton accept="image/*" label={fa ? "آپلود" : "Upload"} onUploaded={(url) => set("orgLogo", url)} />
            </div>
          </div>
          {fld("phone", fa ? "تلفن" : "Phone", "+98...")}
          {fld("email", fa ? "ایمیل" : "Email", "info@...")}
          <div className="sm:col-span-2">{fld("address", fa ? "آدرس" : "Address", "", false, false)}</div>
          <div className="sm:col-span-2">{fld("sameAs", fa ? "شبکه‌های اجتماعی (هر کدام در یک خط)" : "Social profiles (one per line)", "https://instagram.com/...", true)}</div>
        </div>
      </Card>

      <Card className="mb-5 p-5">
        <h2 className="mb-3 text-[14px] font-extrabold">{fa ? "ایندکس و robots" : "Indexing & robots"}</h2>
        <label className="flex cursor-pointer items-center gap-2 text-[13.5px] font-bold">
          <input type="checkbox" checked={seo.noindex} onChange={(e) => set("noindex", e.target.checked)} style={{ accentColor: "var(--accent)" }} />
          {fa ? "جلوگیری از ایندکس کل سایت (noindex)" : "Block indexing (noindex)"}
        </label>
        <p className="mt-1 mb-3 text-[12px]" style={{ color: "var(--muted)" }}>{fa ? "اگر روشن باشد، گوگل سایت را ایندکس نمی‌کند (برای زمان توسعه)." : "When on, search engines won't index the site."}</p>
        {fld("robotsExtra", fa ? "خطوط اضافهٔ robots.txt (اختیاری)" : "Extra robots.txt lines", "Disallow: /private", true)}
      </Card>

      <button onClick={save} disabled={saving} className="cursor-pointer rounded-[12px] border-none px-6 py-3 text-[14px] font-extrabold text-white disabled:opacity-60" style={{ background: "var(--accent)" }}>{saving ? (fa ? "در حال ذخیره…" : "Saving…") : fa ? "ذخیره تنظیمات سئو" : "Save SEO settings"}</button>
    </>
  );
}

/* ---------- public pages (CMS) ---------- */

type PageRow = { slug: string; titleFa: string; titleEn: string; bodyFa: string; bodyEn: string; published: boolean; footerCol?: "support" | "company" | "" };

function PagesAdmin() {
  const { locale, toast } = useShop();
  const fa = locale === "fa";
  const [pages, setPages] = useState<PageRow[]>([]);
  const [editing, setEditing] = useState<PageRow | null>(null);
  const blank: PageRow = { slug: "", titleFa: "", titleEn: "", bodyFa: "", bodyEn: "", published: true, footerCol: "" };
  const [form, setForm] = useState<PageRow>(blank);
  const [busy, setBusy] = useState(false);

  const load = () => fetch("/api/pages").then((r) => r.json()).then((d) => Array.isArray(d?.pages) && setPages(d.pages)).catch(() => {});
  useEffect(() => { load(); }, []);

  const startNew = () => { setEditing(null); setForm(blank); };
  const startEdit = (p: PageRow) => { setEditing(p); setForm({ ...p }); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const aiTranslate = async () => {
    if (!form.titleFa.trim() && !form.bodyFa.trim()) { toast(fa ? "اول محتوای فارسی را بنویس" : "Write Persian first"); return; }
    setBusy(true);
    try {
      // title as a short label, body as a full faithful translation
      const [tr, br] = await Promise.all([
        translateWithStatus([form.titleFa]),
        translateWithStatus([form.bodyFa], false, true),
      ]);
      if (!tr.ok && !br.ok) { toast(fa ? "ترجمه ناموفق — اعتبار سرویس را بررسی کن" : "Translate failed"); return; }
      setForm((f) => ({ ...f, titleEn: tr.results[0] || f.titleEn, bodyEn: br.results[0] || f.bodyEn }));
      toast(fa ? "ترجمه شد ✓" : "Translated ✓");
    } catch { toast(fa ? "خطای شبکه" : "Error"); } finally { setBusy(false); }
  };
  const [aiBusy, setAiBusy] = useState(false);
  const aiGenerate = async () => {
    if (!form.titleFa.trim()) { toast(fa ? "اول عنوان صفحه را بنویس" : "Enter a title first"); return; }
    setAiBusy(true);
    try {
      const r = await fetch("/api/ai/page", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: form.titleFa.trim() }) });
      const d = await r.json();
      if (d.ok && d.body) { setForm((f) => ({ ...f, bodyFa: d.body })); toast(fa ? "محتوا با هوش مصنوعی تولید شد ✓ — بررسی و ذخیره کن" : "Generated ✓"); }
      else { const m = `${d.error || ""}`; toast(/quota|insufficient|credit|balance/i.test(m) ? (fa ? "اعتبار سرویس هوش مصنوعی تمام شده" : "AI out of credit") : (fa ? "تولید محتوا ناموفق بود" : "Generate failed")); }
    } catch { toast(fa ? "خطای شبکه" : "Error"); } finally { setAiBusy(false); }
  };

  const post = async (body: Record<string, unknown>) => {
    const r = await fetch("/api/pages", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json();
    if (d.ok && Array.isArray(d.pages)) setPages(d.pages);
    return d;
  };
  const save = async () => {
    if (!form.titleFa.trim()) { toast(fa ? "عنوان فارسی الزامی است" : "Title required"); return; }
    const d = await post({ action: editing ? "update" : "add", originalSlug: editing?.slug, slug: form.slug, titleFa: form.titleFa.trim(), titleEn: form.titleEn.trim(), bodyFa: form.bodyFa, bodyEn: form.bodyEn, published: form.published, footerCol: form.footerCol });
    if (d.ok) { startNew(); toast(fa ? "ذخیره شد ✓" : "Saved ✓"); }
    else toast(fa ? "ذخیره ناموفق بود" : "Save failed");
  };
  const del = async (slug: string) => { if (!confirm(fa ? "حذف این صفحه؟" : "Delete page?")) return; const d = await post({ action: "delete", slug }); if (d.ok) toast(fa ? "حذف شد" : "Deleted"); };

  return (
    <>
      <H1>{fa ? "صفحات سایت" : "Site pages"}</H1>
      <p className="mb-5 text-[13px]" style={{ color: "var(--muted)" }}>{fa ? "صفحات عمومی مثل «درباره ما»، «تماس با ما»، «قوانین» و… را اینجا بساز و ویرایش کن. متن با Markdown است. لینک هر صفحه: /p/اسلاگ — و در فوتر هم نمایش داده می‌شود." : "Create and edit public pages (Markdown). Each page is at /p/slug."}</p>

      <Card className="mb-6 p-5">
        <h2 className="mb-3 text-[15px] font-extrabold">{editing ? (fa ? "ویرایش صفحه" : "Edit page") : fa ? "صفحهٔ جدید" : "New page"}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>{lbl(fa ? "عنوان (فارسی)" : "Title (FA)")}<input className={inputCls} style={inputStyle} value={form.titleFa} onChange={(e) => setForm((f) => ({ ...f, titleFa: e.target.value }))} /></div>
          <div>{lbl(fa ? "عنوان (انگلیسی)" : "Title (EN)")}<input className={inputCls} style={inputStyle} dir="ltr" value={form.titleEn} onChange={(e) => setForm((f) => ({ ...f, titleEn: e.target.value }))} /></div>
          <div>{lbl(fa ? "اسلاگ (آدرس)" : "Slug")}<input className={inputCls} style={inputStyle} dir="ltr" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder={fa ? "خودکار از عنوان انگلیسی" : "auto"} /></div>
          <div>{lbl(fa ? "ستون فوتر" : "Footer column")}
            <select className={inputCls} style={inputStyle} value={form.footerCol || ""} onChange={(e) => setForm((f) => ({ ...f, footerCol: e.target.value as PageRow["footerCol"] }))}>
              <option value="">{fa ? "نمایش نده در فوتر" : "Not in footer"}</option>
              <option value="support">{fa ? "ستون پشتیبانی" : "Support"}</option>
              <option value="company">{fa ? "ستون شرکت" : "Company"}</option>
            </select>
          </div>
        </div>
        <div className="mt-3">{lbl(fa ? "متن صفحه (فارسی) — Markdown" : "Body (FA)")}<textarea className={inputCls} style={{ ...inputStyle, minHeight: 160 }} value={form.bodyFa} onChange={(e) => setForm((f) => ({ ...f, bodyFa: e.target.value }))} /></div>
        <div className="mt-3">{lbl(fa ? "متن صفحه (انگلیسی)" : "Body (EN)")}<textarea className={inputCls} style={{ ...inputStyle, minHeight: 120 }} dir="ltr" value={form.bodyEn} onChange={(e) => setForm((f) => ({ ...f, bodyEn: e.target.value }))} /></div>
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-[13.5px] font-bold">
          <input type="checkbox" checked={form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} style={{ accentColor: "var(--accent)" }} />
          {fa ? "منتشر شده (در سایت دیده شود)" : "Published"}
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={save} className="cursor-pointer rounded-[12px] border-none px-6 py-2.5 text-[14px] font-extrabold text-white" style={{ background: "var(--accent)" }}>{editing ? (fa ? "ذخیره تغییرات" : "Save") : fa ? "ایجاد صفحه" : "Create"}</button>
          <button onClick={aiGenerate} disabled={aiBusy} className="inline-flex cursor-pointer items-center gap-1.5 rounded-[12px] px-4 py-2.5 text-[13.5px] font-bold disabled:opacity-60" style={{ ...inputStyle, color: "var(--accent)" }}><Sparkle size={15} /> {aiBusy ? (fa ? "در حال تولید…" : "…") : fa ? "تولید محتوا با هوش مصنوعی" : "AI write content"}</button>
          <button onClick={aiTranslate} disabled={busy} className="inline-flex cursor-pointer items-center gap-1.5 rounded-[12px] px-4 py-2.5 text-[13.5px] font-bold disabled:opacity-60" style={{ ...inputStyle, color: "var(--accent)" }}><Sparkle size={15} /> {busy ? (fa ? "در حال ترجمه…" : "…") : fa ? "ترجمه به انگلیسی با AI" : "AI translate"}</button>
          {editing && <a href={`/${locale}/p/${editing.slug}`} target="_blank" rel="noreferrer" className="cursor-pointer rounded-[12px] px-4 py-2.5 text-[13.5px] font-bold no-underline" style={{ ...inputStyle, color: "var(--accent)" }}>{fa ? "مشاهده ↗" : "View ↗"}</a>}
          {editing && <button onClick={startNew} className="cursor-pointer rounded-[12px] px-4 py-2.5 text-[13.5px] font-bold" style={inputStyle}>{fa ? "انصراف" : "Cancel"}</button>}
        </div>
      </Card>

      {pages.length === 0 ? <Empty text={fa ? "صفحه‌ای نیست." : "No pages."} /> : (
        <div className="flex flex-col gap-2">
          {pages.map((p) => (
            <div key={p.slug} className="flex flex-wrap items-center gap-3 rounded-[12px] p-3" style={{ ...cardStyle }}>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-bold">{fa ? p.titleFa : p.titleEn} {!p.published && <span className="text-[11px]" style={{ color: "#e11d48" }}>({fa ? "پیش‌نویس" : "draft"})</span>}</div>
                <div className="truncate text-[12px]" style={{ color: "var(--muted)" }}>/p/{p.slug}{p.footerCol ? ` · ${fa ? "فوتر" : "footer"}: ${p.footerCol}` : ""}</div>
              </div>
              <button onClick={() => startEdit(p)} className="cursor-pointer border-none bg-transparent text-[12.5px] font-bold" style={{ color: "var(--accent)" }}>{fa ? "ویرایش" : "Edit"}</button>
              <button onClick={() => del(p.slug)} className="cursor-pointer border-none bg-transparent text-[12.5px] font-bold" style={{ color: "#e11d48" }}>{fa ? "حذف" : "Delete"}</button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ---------- brands management ---------- */

type BrandRow = { id: string; name: string; en?: string; logo?: string; url?: string; featured?: boolean };

function BrandsAdmin() {
  const { locale, toast } = useShop();
  const fa = locale === "fa";
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [editing, setEditing] = useState<BrandRow | null>(null);
  const blank: BrandRow = { id: "", name: "", en: "", logo: "", url: "", featured: true };
  const [form, setForm] = useState<BrandRow>(blank);
  const [enBusy, setEnBusy] = useState(false);

  const load = () => fetch("/api/brands").then((r) => r.json()).then((d) => Array.isArray(d?.brands) && setBrands(d.brands)).catch(() => {});
  useEffect(() => { load(); }, []);

  const startNew = () => { setEditing(null); setForm(blank); };
  const startEdit = (b: BrandRow) => { setEditing(b); setForm({ ...b }); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const fillEn = async () => {
    if (!form.name.trim()) { toast(fa ? "اول نام برند را بنویس" : "Enter brand name"); return; }
    setEnBusy(true);
    try {
      const v = await translateOne(form.name.trim());
      if (v) setForm((f) => ({ ...f, en: v }));
      else toast(fa ? "ترجمه‌ای دریافت نشد" : "No result");
    } catch { toast(fa ? "خطای شبکه" : "Error"); } finally { setEnBusy(false); }
  };

  const post = async (body: Record<string, unknown>) => {
    const r = await fetch("/api/brands", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json();
    if (d.ok && Array.isArray(d.brands)) setBrands(d.brands);
    return d;
  };

  const save = async () => {
    if (!form.name.trim()) { toast(fa ? "نام برند الزامی است" : "Name required"); return; }
    const d = await post({ action: editing ? "update" : "add", id: form.id, name: form.name.trim(), en: (form.en || "").trim(), logo: (form.logo || "").trim(), url: (form.url || "").trim(), featured: form.featured !== false });
    if (d.ok) { startNew(); toast(fa ? "ذخیره شد ✓ (برای دیدن در سایت صفحه را تازه کن)" : "Saved ✓"); }
    else toast(fa ? "ذخیره ناموفق بود" : "Save failed");
  };
  const del = async (id: string) => { const d = await post({ action: "delete", id }); if (d.ok) toast(fa ? "حذف شد" : "Deleted"); };

  return (
    <>
      <H1>{fa ? "برندها" : "Brands"}</H1>
      <p className="mb-5 text-[13px]" style={{ color: "var(--muted)" }}>{fa ? "برندها را اینجا با لوگو مدیریت کن. این‌ها در فرم محصول و صفحهٔ اصلی (با لینک) نمایش داده می‌شوند." : "Manage brands with logos, used in the product form and on the homepage."}</p>

      <Card className="mb-6 p-5">
        <h2 className="mb-3 text-[15px] font-extrabold">{editing ? (fa ? "ویرایش برند" : "Edit brand") : fa ? "افزودن برند جدید" : "Add brand"}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>{lbl(fa ? "نام برند" : "Brand name")}<input className={inputCls} style={inputStyle} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder={fa ? "مثلاً سامسونگ یا Samsung" : "e.g. Samsung"} /></div>
          <div>
            {lbl(fa ? "نام انگلیسی / اسلاگ" : "English / slug")}
            <div className="flex gap-2">
              <input className={inputCls} style={inputStyle} value={form.en || ""} onChange={(e) => setForm((f) => ({ ...f, en: e.target.value }))} dir="ltr" placeholder={fa ? "خودکار با هوش مصنوعی" : "auto"} onBlur={async () => { if (form.name.trim() && !(form.en || "").trim()) { const v = await translateOne(form.name.trim()); if (v) setForm((f) => ({ ...f, en: v })); } }} />
              <button type="button" onClick={fillEn} disabled={enBusy} title={fa ? "تکمیل با هوش مصنوعی" : "AI complete"} className="flex-none cursor-pointer rounded-[10px] px-3 text-[13px] font-bold disabled:opacity-60" style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--accent)" }}>✨</button>
            </div>
          </div>
        </div>
        <div className="mt-3">
          {lbl(fa ? "لوگو" : "Logo")}
          <div className="flex flex-wrap items-center gap-3">
            {form.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.logo} alt="logo" className="h-12 w-12 rounded-[10px] object-contain" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }} />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-[10px] text-[16px] font-extrabold" style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--muted)" }}>{(form.name || "?").charAt(0)}</span>
            )}
            <UploadButton accept="image/*" label={fa ? "آپلود لوگو" : "Upload logo"} onUploaded={(url) => setForm((f) => ({ ...f, logo: url }))} />
            {form.logo && <button type="button" onClick={() => setForm((f) => ({ ...f, logo: "" }))} className="cursor-pointer border-none bg-transparent text-[12.5px] font-bold" style={{ color: "#e11d48" }}>{fa ? "حذف لوگو" : "Remove"}</button>}
          </div>
        </div>
        <div className="mt-3">
          {lbl(fa ? "آدرس سایت برند (اختیاری)" : "Brand website (optional)")}
          <input className={inputCls} style={inputStyle} value={form.url || ""} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} dir="ltr" placeholder="https://example.com" />
          <p className="mt-1 text-[11.5px]" style={{ color: "var(--muted)" }}>{fa ? "اگر پر شود، در صفحهٔ اصلی کارت این برند به سایت خودش لینک می‌شود (در تب جدید)." : "If set, the homepage brand card links to this site (new tab)."}</p>
        </div>
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-[13.5px] font-bold">
          <input type="checkbox" checked={form.featured !== false} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} style={{ accentColor: "var(--accent)" }} />
          {fa ? "نمایش در صفحهٔ اصلی" : "Show on homepage"}
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={save} className="cursor-pointer rounded-[12px] border-none px-6 py-2.5 text-[14px] font-extrabold text-white" style={{ background: "var(--accent)" }}>{editing ? (fa ? "ذخیره تغییرات" : "Save") : fa ? "افزودن برند" : "Add"}</button>
          {editing && <button onClick={startNew} className="cursor-pointer rounded-[12px] px-4 py-2.5 text-[13.5px] font-bold" style={inputStyle}>{fa ? "انصراف" : "Cancel"}</button>}
        </div>
      </Card>

      {brands.length === 0 ? <Empty text={fa ? "هنوز برندی ثبت نشده." : "No brands."} /> : (
        <div className="grid gap-2 sm:grid-cols-2">
          {brands.map((b) => (
            <div key={b.id} className="flex items-center gap-3 rounded-[12px] p-3" style={{ ...cardStyle }}>
              {b.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.logo} alt={b.name} className="h-10 w-10 flex-none rounded-[9px] object-contain" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }} />
              ) : (
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[9px] text-[14px] font-extrabold" style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--muted)" }}>{b.name.charAt(0)}</span>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-bold">{b.name}</div>
                <div className="truncate text-[12px]" style={{ color: "var(--muted)" }}>{b.en || "—"}{b.url ? " · 🔗 " + b.url.replace(/^https?:\/\//, "").replace(/\/$/, "") : ""}{b.featured === false ? (fa ? " · مخفی" : " · hidden") : ""}</div>
              </div>
              <button onClick={() => startEdit(b)} className="cursor-pointer border-none bg-transparent text-[12.5px] font-bold" style={{ color: "var(--accent)" }}>{fa ? "ویرایش" : "Edit"}</button>
              <button onClick={() => del(b.id)} className="cursor-pointer border-none bg-transparent text-[12.5px] font-bold" style={{ color: "#e11d48" }}>{fa ? "حذف" : "Delete"}</button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ---------- menu / navigation management ---------- */

type MenuRow = { id: string; fa: string; en: string; href: string };

function MenuAdmin() {
  const { locale, toast } = useShop();
  const fa = locale === "fa";

  // main nav = categories (order + visibility + names)
  const [cats, setCats] = useState<CatRow[]>([]);
  const loadCats = () => fetch("/api/categories").then((r) => r.json()).then((d) => Array.isArray(d?.categories) && setCats(d.categories)).catch(() => {});

  // extra custom links
  const [items, setItems] = useState<MenuRow[]>([]);
  const [editing, setEditing] = useState<MenuRow | null>(null);
  const blank: MenuRow = { id: "", fa: "", en: "", href: "" };
  const [form, setForm] = useState<MenuRow>(blank);
  const loadMenu = () => fetch("/api/menu").then((r) => r.json()).then((d) => Array.isArray(d?.menu) && setItems(d.menu)).catch(() => {});

  useEffect(() => { loadCats(); loadMenu(); }, []);

  // category nav ops
  const catPost = async (body: Record<string, unknown>) => {
    const r = await fetch("/api/categories", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json();
    if (d.ok) setCats(d.categories);
    return d.ok;
  };
  const move = async (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= cats.length) return;
    const next = [...cats];
    [next[idx], next[j]] = [next[j], next[idx]];
    setCats(next);
    await catPost({ action: "reorder", ids: next.map((c) => c.id) });
  };
  const toggleHide = (c: CatRow) => catPost({ action: "patch", id: c.id, hidden: !c.hidden });
  const renameCat = async (c: CatRow, fa2: string, en2: string) => {
    if (!fa2.trim()) return;
    const ok = await catPost({ action: "update", id: c.id, fa: fa2.trim(), en: (en2 || fa2).trim(), hue: c.hue, subs: c.subs, hidden: c.hidden });
    if (ok) toast(fa ? "ذخیره شد ✓" : "Saved ✓");
  };

  // custom links ops
  const startNew = () => { setEditing(null); setForm(blank); };
  const saveLink = async () => {
    if (!form.fa.trim()) { toast(fa ? "عنوان الزامی است" : "Label required"); return; }
    const body = { action: editing ? "update" : "add", id: form.id, fa: form.fa.trim(), en: form.en.trim(), href: form.href.trim() };
    const r = await fetch("/api/menu", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json();
    if (d.ok) { setItems(d.menu); startNew(); toast(fa ? "ذخیره شد ✓ (صفحه را تازه کن)" : "Saved ✓"); }
  };
  const delLink = async (id: string) => {
    const r = await fetch("/api/menu", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "delete", id }) });
    const d = await r.json();
    if (d.ok) setItems(d.menu);
  };

  return (
    <>
      <H1>{fa ? "منوی سایت" : "Site navigation"}</H1>
      <p className="mb-5 text-[13px]" style={{ color: "var(--muted)" }}>{fa ? "منوی بالای سایت را اینجا مدیریت کن: ترتیب و نمایش دسته‌ها را تغییر بده، نامشان را ویرایش کن، و لینک‌های دلخواه (مثل «تماس با ما») اضافه کن. تغییرات پس از تازه‌کردن صفحه روی سایت دیده می‌شوند." : "Manage the top navigation: reorder/show-hide categories, rename them, and add custom links."}</p>

      {/* main nav: categories */}
      <Card className="mb-6 p-5">
        <h2 className="mb-1 text-[15px] font-extrabold">{fa ? "منوی اصلی (دسته‌ها)" : "Main menu (categories)"}</h2>
        <p className="mb-3 text-[12px]" style={{ color: "var(--muted)" }}>{fa ? "ترتیب با فلش‌ها، نمایش/پنهان با چشم. برای زیردسته‌ها و رنگ به بخش «دسته‌بندی‌ها» برو." : "Reorder with arrows, show/hide with the eye."}</p>
        {cats.length === 0 ? <Empty text={fa ? "دسته‌ای نیست." : "No categories."} /> : (
          <div className="flex flex-col gap-2">
            {cats.map((c, i) => (
              <NavCatRow key={c.id} c={c} fa={fa} first={i === 0} last={i === cats.length - 1}
                onUp={() => move(i, -1)} onDown={() => move(i, 1)} onToggle={() => toggleHide(c)} onRename={(f2, e2) => renameCat(c, f2, e2)} />
            ))}
          </div>
        )}
      </Card>

      {/* custom links */}
      <Card className="mb-4 p-5">
        <h2 className="mb-1 text-[15px] font-extrabold">{fa ? "لینک‌های سفارشی" : "Custom links"}</h2>
        <p className="mb-3 text-[12px]" style={{ color: "var(--muted)" }}>{fa ? "لینک‌های اضافه کنار دسته‌ها (مثل «تماس با ما» یا لینک بیرونی)." : "Extra links beside categories."}</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>{lbl(fa ? "عنوان (فارسی)" : "Label (FA)")}<input className={inputCls} style={inputStyle} value={form.fa} onChange={(e) => setForm((f) => ({ ...f, fa: e.target.value }))} onBlur={async () => { if (form.fa.trim() && !form.en.trim()) { const v = await translateOne(form.fa.trim()); if (v) setForm((f) => ({ ...f, en: v })); } }} /></div>
          <div>{lbl(fa ? "عنوان انگلیسی (خودکار)" : "Label (EN)")}<input className={inputCls} style={inputStyle} value={form.en} onChange={(e) => setForm((f) => ({ ...f, en: e.target.value }))} dir="ltr" placeholder={fa ? "خودکار از فارسی" : "auto"} /></div>
          <div>{lbl(fa ? "آدرس (/about یا https://…)" : "URL")}<input className={inputCls} style={inputStyle} value={form.href} onChange={(e) => setForm((f) => ({ ...f, href: e.target.value }))} dir="ltr" placeholder="/about" /></div>
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={saveLink} className="cursor-pointer rounded-[12px] border-none px-6 py-2.5 text-[14px] font-extrabold text-white" style={{ background: "var(--accent)" }}>{editing ? (fa ? "ذخیره" : "Save") : fa ? "افزودن لینک" : "Add link"}</button>
          <button onClick={async () => { if (!form.fa.trim()) { toast(fa ? "اول عنوان فارسی" : "Persian first"); return; } const r = await translateWithStatus([form.fa.trim()]); if (r.ok && r.results[0]) { setForm((f) => ({ ...f, en: r.results[0]! })); toast(fa ? "انگلیسی تکمیل شد ✓" : "Done ✓"); } else toast(r.error === "ai-unavailable" ? (fa ? "هوش مصنوعی تنظیم نشده" : "AI not configured") : (fa ? "خطای هوش مصنوعی: " : "AI error: ") + (r.detail || r.error || "")); }} className="inline-flex cursor-pointer items-center gap-1.5 rounded-[12px] px-4 py-2.5 text-[13.5px] font-bold" style={{ ...inputStyle, color: "var(--accent)" }}><Sparkle size={15} /> {fa ? "تکمیل انگلیسی" : "AI English"}</button>
          {editing && <button onClick={startNew} className="cursor-pointer rounded-[12px] px-4 py-2.5 text-[13.5px] font-bold" style={inputStyle}>{fa ? "انصراف" : "Cancel"}</button>}
        </div>
        {items.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {items.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center gap-3 rounded-[10px] p-2.5" style={{ background: "var(--surface2)" }}>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-bold">{fa ? m.fa : m.en}</div>
                  <div className="truncate text-[12px]" style={{ color: "var(--muted)" }} dir="ltr">{m.href}</div>
                </div>
                <button onClick={() => { setEditing(m); setForm(m); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="cursor-pointer border-none bg-transparent text-[12.5px] font-bold" style={{ color: "var(--accent)" }}>{fa ? "ویرایش" : "Edit"}</button>
                <button onClick={() => delLink(m.id)} className="cursor-pointer border-none bg-transparent text-[12.5px] font-bold" style={{ color: "#e11d48" }}>{fa ? "حذف" : "Delete"}</button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

function NavCatRow({ c, fa, first, last, onUp, onDown, onToggle, onRename }: {
  c: CatRow; fa: boolean; first: boolean; last: boolean;
  onUp: () => void; onDown: () => void; onToggle: () => void; onRename: (fa: string, en: string) => void;
}) {
  const [f2, setF2] = useState(c.fa);
  const [e2, setE2] = useState(c.en);
  const dirty = f2 !== c.fa || e2 !== c.en;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-[10px] p-2.5" style={{ background: "var(--surface2)", opacity: c.hidden ? 0.55 : 1 }}>
      <div className="flex flex-col">
        <button onClick={onUp} disabled={first} className="cursor-pointer border-none bg-transparent text-[12px] disabled:opacity-30" style={{ color: "var(--muted)" }}>▲</button>
        <button onClick={onDown} disabled={last} className="cursor-pointer border-none bg-transparent text-[12px] disabled:opacity-30" style={{ color: "var(--muted)" }}>▼</button>
      </div>
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[8px] text-[12px] font-extrabold text-white" style={{ background: `hsl(${c.hue} 70% 55%)` }}>{(fa ? c.fa : c.en).charAt(0)}</span>
      <input className="rounded-[8px] px-2.5 py-1.5 text-[13px] outline-none" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", maxWidth: 160 }} value={f2} onChange={(e) => setF2(e.target.value)} />
      <input className="rounded-[8px] px-2.5 py-1.5 text-[13px] outline-none" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", maxWidth: 140 }} value={e2} onChange={(e) => setE2(e.target.value)} dir="ltr" />
      {dirty && <button onClick={() => onRename(f2, e2)} className="cursor-pointer rounded-[8px] border-none px-3 py-1.5 text-[12px] font-bold text-white" style={{ background: "var(--accent)" }}>{fa ? "ذخیره" : "Save"}</button>}
      <span className="flex-1" />
      <button onClick={onToggle} className="cursor-pointer rounded-[8px] px-3 py-1.5 text-[12px] font-bold" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: c.hidden ? "#e11d48" : "#1f8a5b" }}>
        {c.hidden ? (fa ? "پنهان (نمایش بده)" : "Hidden") : (fa ? "نمایش (پنهان کن)" : "Visible")}
      </button>
    </div>
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
      <p className="mb-5 text-[12.5px]" style={{ color: "var(--muted)" }}>
        {fa ? "برای نوشتن، تولید انبوه و مدیریت مقالات به منوی «مقالات» بروید." : "Use the “Articles” menu to write, bulk-generate and manage posts."}
      </p>

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

/* ---------- loyalty / rewards program ---------- */

type LoyTier = { key: string; fa: string; en: string; min: number; discountPct: number };
type LoyCfg = {
  enabled: boolean; earnPerToman: number; signupBonus: number; reviewBonus: number;
  pointValue: number; redeemEnabled: boolean; redeemMinPoints: number; expiryMonths: number;
  tiers: LoyTier[];
};

function LoyaltyAdmin() {
  const { locale, t, toast } = useShop();
  const fa = locale === "fa";
  const [cfg, setCfg] = useState<LoyCfg | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings/loyalty", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.loyalty && setCfg(d.loyalty))
      .catch(() => {});
  }, []);

  if (!cfg) return <div className="py-16 text-center" style={{ color: "var(--muted)" }}>{fa ? "در حال بارگذاری…" : "Loading…"}</div>;

  const set = <K extends keyof LoyCfg>(k: K, v: LoyCfg[K]) => setCfg((c) => (c ? { ...c, [k]: v } : c));
  const intv = (s: string) => Number(s.replace(/[^\d]/g, "")) || 0;
  const grp = (v: number) => (v ? v.toLocaleString("en-US") : "");
  const updTier = (i: number, patch: Partial<LoyTier>) => set("tiers", cfg.tiers.map((tr, x) => (x === i ? { ...tr, ...patch } : tr)));
  const addTier = () => set("tiers", [...cfg.tiers, { key: "tier-" + Date.now().toString(36), fa: "", en: "", min: 0, discountPct: 0 }]);
  const rmTier = (i: number) => set("tiers", cfg.tiers.filter((_, x) => x !== i));

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/settings/loyalty", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(cfg) });
      const d = await r.json();
      if (d.ok && d.loyalty) { setCfg(d.loyalty); toast(t.saved); }
      else toast(fa ? "ذخیره ناموفق بود" : "Save failed");
    } catch { toast(fa ? "خطای شبکه" : "Network error"); }
    finally { setSaving(false); }
  };

  const card = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16 } as const;
  const mini = "w-full rounded-[8px] px-2.5 py-2 text-[12.5px] outline-none";
  const numField = (label: string, val: number, on: (n: number) => void, hint?: string, grouped = true) => (
    <div>
      {lbl(label)}
      <input className={inputCls} style={inputStyle} inputMode="numeric" dir="ltr" value={grouped ? grp(val) : String(val || "")} onChange={(e) => on(intv(e.target.value))} />
      {hint && <div className="mt-1 text-[11.5px]" style={{ color: "var(--muted)" }}>{hint}</div>}
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-extrabold tracking-tight">{fa ? "باشگاه وفاداری" : "Loyalty program"}</h1>
        <label className="flex cursor-pointer items-center gap-2 text-[13.5px] font-bold">
          <input type="checkbox" checked={cfg.enabled} onChange={(e) => set("enabled", e.target.checked)} style={{ accentColor: "var(--accent)", width: 18, height: 18 }} />
          {cfg.enabled ? (fa ? "فعال" : "Enabled") : (fa ? "غیرفعال" : "Disabled")}
        </label>
      </div>

      {/* earning */}
      <div className="p-5" style={card}>
        <h2 className="mb-3 text-[15px] font-extrabold">{fa ? "کسب امتیاز" : "Earning points"}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {numField(fa ? "هر چند تومان خرید = ۱ امتیاز" : "Toman spent per 1 point", cfg.earnPerToman, (n) => set("earnPerToman", Math.max(1, n)), fa ? `مثال: ۱۰۰٬۰۰۰ یعنی هر ۱۰۰هزار تومان ۱ امتیاز` : "")}
          {numField(fa ? "امتیاز هدیهٔ عضویت" : "Sign-up bonus", cfg.signupBonus, (n) => set("signupBonus", n), fa ? "به کاربر جدید موقع ثبت‌نام" : "")}
          {numField(fa ? "امتیاز هر نظر تأییدشده" : "Points per review", cfg.reviewBonus, (n) => set("reviewBonus", n))}
        </div>
      </div>

      {/* redemption */}
      <div className="p-5" style={card}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-extrabold">{fa ? "تبدیل امتیاز به اعتبار" : "Redeem points"}</h2>
          <label className="flex cursor-pointer items-center gap-2 text-[13px] font-bold">
            <input type="checkbox" checked={cfg.redeemEnabled} onChange={(e) => set("redeemEnabled", e.target.checked)} style={{ accentColor: "var(--accent)", width: 16, height: 16 }} />
            {fa ? "فعال" : "On"}
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {numField(fa ? "ارزش هر امتیاز (تومان)" : "Value per point (Toman)", cfg.pointValue, (n) => set("pointValue", n), fa ? "موقع تبدیل به کیف پول" : "")}
          {numField(fa ? "حداقل امتیاز برای تبدیل" : "Min points to redeem", cfg.redeemMinPoints, (n) => set("redeemMinPoints", n))}
          {numField(fa ? "انقضای امتیاز (ماه، ۰=بدون انقضا)" : "Expiry (months, 0=never)", cfg.expiryMonths, (n) => set("expiryMonths", n), undefined, false)}
        </div>
      </div>

      {/* tiers */}
      <div className="p-5" style={card}>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-extrabold">{fa ? "سطح‌های باشگاه" : "Membership tiers"}</h2>
            <div className="mt-0.5 text-[12px]" style={{ color: "var(--muted)" }}>{fa ? "هر سطح می‌تواند تخفیف خودکار در پرداخت بدهد." : "Each tier can give an automatic checkout discount."}</div>
          </div>
          <button onClick={addTier} className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border-none px-3 py-2 text-[12.5px] font-bold" style={{ background: "var(--surface2)", color: "var(--accent)" }}><Plus size={14} /> {fa ? "افزودن سطح" : "Add tier"}</button>
        </div>
        <div className="hidden grid-cols-[1fr_1fr_110px_110px_40px] gap-2 px-1 pb-1.5 text-[11.5px] font-bold sm:grid" style={{ color: "var(--muted)" }}>
          <span>{fa ? "نام (فارسی)" : "Name (FA)"}</span>
          <span>{fa ? "نام (انگلیسی)" : "Name (EN)"}</span>
          <span>{fa ? "حداقل امتیاز" : "Min points"}</span>
          <span>{fa ? "تخفیف ٪" : "Discount %"}</span>
          <span />
        </div>
        <div className="flex flex-col gap-2">
          {cfg.tiers.map((tr, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 rounded-[12px] p-2.5 sm:grid-cols-[1fr_1fr_110px_110px_40px]" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
              <input className={mini} style={inputStyle} placeholder={fa ? "نام" : "Name FA"} value={tr.fa} onChange={(e) => updTier(i, { fa: e.target.value })} />
              <input className={mini} style={inputStyle} placeholder="Name EN" dir="ltr" value={tr.en} onChange={(e) => updTier(i, { en: e.target.value })} />
              <input className={mini} style={inputStyle} inputMode="numeric" dir="ltr" placeholder={fa ? "امتیاز" : "min"} value={String(tr.min || "")} onChange={(e) => updTier(i, { min: intv(e.target.value) })} />
              <input className={mini} style={inputStyle} inputMode="numeric" dir="ltr" placeholder="%" value={String(tr.discountPct || "")} onChange={(e) => updTier(i, { discountPct: Math.min(100, intv(e.target.value)) })} />
              <button onClick={() => rmTier(i)} aria-label={t.del} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[8px] border-none" style={{ background: "var(--surface)", color: "#e11d48" }}><Trash size={15} /></button>
            </div>
          ))}
          {cfg.tiers.length === 0 && <div className="py-4 text-center text-[12.5px]" style={{ color: "var(--muted)" }}>{fa ? "هیچ سطحی تعریف نشده" : "No tiers"}</div>}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="cursor-pointer rounded-[12px] border-none px-7 py-3 text-[14px] font-extrabold text-white" style={{ background: "var(--accent)", opacity: saving ? 0.6 : 1 }}>{saving ? (fa ? "در حال ذخیره…" : "Saving…") : (fa ? "ذخیرهٔ تنظیمات وفاداری" : "Save loyalty settings")}</button>
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

  // shipping & payment method editors
  const shipList = store.shippingMethods || [];
  const payList = store.paymentMethods || [];
  const updShip = (i: number, patch: Partial<ShipMethod>) => setS("shippingMethods", shipList.map((m, x) => (x === i ? { ...m, ...patch } : m)));
  const addShip = () => setS("shippingMethods", [...shipList, { id: "ship-" + Date.now().toString(36), fa: "", en: "", price: 0, etaFa: "", etaEn: "", enabled: true }]);
  const rmShip = (i: number) => setS("shippingMethods", shipList.filter((_, x) => x !== i));
  const updPay = (i: number, patch: Partial<PayMethod>) => setS("paymentMethods", payList.map((m, x) => (x === i ? { ...m, ...patch } : m)));
  const addPay = () => setS("paymentMethods", [...payList, { id: "pay-" + Date.now().toString(36), fa: "", en: "", kind: "online", enabled: true }]);
  const rmPay = (i: number) => setS("paymentMethods", payList.filter((_, x) => x !== i));
  const miniInput = "w-full rounded-[8px] px-2.5 py-1.5 text-[12.5px] outline-none";

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

              {/* site-wide theme */}
              <div className="sm:col-span-2 rounded-[12px] p-4" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
                <div className="mb-1 text-[13.5px] font-extrabold">🎨 {fa ? "تم سایت — رنگ‌بندی کل سایت" : "Site theme — site-wide colors"}</div>
                <div className="mb-3 text-[12px]" style={{ color: "var(--muted)" }}>{fa ? "رنگ اصلیِ دکمه‌ها، لینک‌ها، قیمت‌ها و هایلایت‌ها در کل سایت برای همهٔ بازدیدکننده‌ها." : "Primary color for buttons, links, prices and highlights across the whole site."}</div>
                <div className="flex flex-wrap items-center gap-2">
                  {["#4f46e5", "#2563eb", "#0ea5e9", "#0d9488", "#059669", "#16a34a", "#f59e0b", "#ea580c", "#e11d48", "#db2777", "#7c3aed", "#475569"].map((c) => (
                    <button key={c} type="button" aria-label={c}
                      onClick={() => { setS("themeAccent", c); document.documentElement.style.setProperty("--accent", c); }}
                      className="h-8 w-8 cursor-pointer rounded-full"
                      style={{ background: c, outline: (store.themeAccent || "") === c ? "2px solid var(--text)" : "2px solid transparent", outlineOffset: 2 }} />
                  ))}
                  <input type="color" value={store.themeAccent || "#4f46e5"}
                    onChange={(e) => { setS("themeAccent", e.target.value); document.documentElement.style.setProperty("--accent", e.target.value); }}
                    className="h-8 w-12 cursor-pointer rounded-[8px] p-0" style={{ border: "1px solid var(--border)", background: "transparent" }} aria-label={fa ? "رنگ دلخواه" : "Custom color"} />
                  {store.themeAccent && (
                    <button type="button" onClick={() => setS("themeAccent", "")} className="cursor-pointer border-none bg-transparent text-[12.5px] font-bold" style={{ color: "#e11d48" }}>{fa ? "بازنشانی" : "Reset"}</button>
                  )}
                </div>
                <div className="mt-3 text-[12.5px] font-bold" style={{ color: "var(--muted)" }}>{fa ? "گردیِ گوشه‌ها" : "Corner roundness"}</div>
                <div className="mt-1.5 flex gap-2">
                  {([["sharp", fa ? "تیز" : "Sharp"], ["soft", fa ? "ملایم" : "Soft"], ["round", fa ? "گرد" : "Round"]] as const).map(([id, label]) => (
                    <button key={id} type="button" onClick={() => setS("themeRadius", id)}
                      className="cursor-pointer rounded-[10px] px-4 py-2 text-[13px] font-bold"
                      style={{ background: (store.themeRadius || "") === id ? "var(--accent)" : "var(--surface)", color: (store.themeRadius || "") === id ? "#fff" : "var(--text)", border: "1px solid var(--border)" }}>{label}</button>
                  ))}
                </div>
                <div className="mt-3 text-[12px]" style={{ color: "var(--muted)" }}>{fa ? "بعد از ذخیره، رنگ برای همهٔ کاربران اعمال می‌شود (مگر کاربری خودش رنگ را شخصی‌سازی کرده باشد)." : "After saving, applies to all visitors unless they personally customized it."}</div>
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

            {/* shipping methods */}
            <div className="mt-2 rounded-[12px] p-4" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[14px] font-extrabold">🚚 {fa ? "روش‌های ارسال" : "Shipping methods"}</h3>
                <button onClick={addShip} className="cursor-pointer rounded-[9px] px-3 py-1.5 text-[12.5px] font-bold" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--accent)" }}>+ {fa ? "افزودن" : "Add"}</button>
              </div>
              <p className="mb-3 text-[12px]" style={{ color: "var(--muted)" }}>{fa ? "هر روش ارسال با قیمت و زمان تحویل. کاربر در تسویه‌حساب از همین‌ها انتخاب می‌کند." : "Each method with price & ETA shown at checkout."}</p>
              {shipList.length === 0 && <div className="text-[12.5px]" style={{ color: "var(--muted)" }}>{fa ? "روشی اضافه نشده." : "None."}</div>}
              <div className="flex flex-col gap-2">
                {shipList.map((m, i) => (
                  <div key={m.id} className="rounded-[10px] p-2.5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input className={miniInput} style={inputStyle} value={m.fa} placeholder={fa ? "نام (فارسی)" : "Name FA"} onChange={(e) => updShip(i, { fa: e.target.value })} />
                      <input className={miniInput} style={inputStyle} dir="ltr" value={m.en} placeholder="Name EN" onChange={(e) => updShip(i, { en: e.target.value })} />
                      <input className={miniInput} style={inputStyle} inputMode="numeric" value={String(m.price)} placeholder={fa ? "قیمت (تومان)" : "Price"} onChange={(e) => updShip(i, { price: Number(e.target.value.replace(/[^\d]/g, "")) || 0 })} />
                      <input className={miniInput} style={inputStyle} value={m.etaFa} placeholder={fa ? "زمان تحویل (فارسی)" : "ETA FA"} onChange={(e) => updShip(i, { etaFa: e.target.value })} />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <label className="flex cursor-pointer items-center gap-2 text-[12.5px] font-bold"><input type="checkbox" checked={m.enabled !== false} onChange={(e) => updShip(i, { enabled: e.target.checked })} style={{ accentColor: "var(--accent)" }} />{fa ? "فعال" : "Enabled"}</label>
                      <button onClick={() => rmShip(i)} className="cursor-pointer border-none bg-transparent text-[12px] font-bold" style={{ color: "#e11d48" }}>{fa ? "حذف" : "Remove"}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* payment methods */}
            <div className="mt-3 rounded-[12px] p-4" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[14px] font-extrabold">💳 {fa ? "روش‌های پرداخت" : "Payment methods"}</h3>
                <button onClick={addPay} className="cursor-pointer rounded-[9px] px-3 py-1.5 text-[12.5px] font-bold" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--accent)" }}>+ {fa ? "افزودن" : "Add"}</button>
              </div>
              <p className="mb-3 text-[12px]" style={{ color: "var(--muted)" }}>{fa ? "نوع «کیف پول» موجودی کاربر را کم می‌کند، «در محل» پرداخت هنگام تحویل، «آنلاین» درگاه پرداخت." : "Kind controls behaviour: wallet deducts balance, COD pays on delivery, online uses the gateway."}</p>
              {payList.length === 0 && <div className="text-[12.5px]" style={{ color: "var(--muted)" }}>{fa ? "روشی اضافه نشده." : "None."}</div>}
              <div className="flex flex-col gap-2">
                {payList.map((m, i) => (
                  <div key={m.id} className="rounded-[10px] p-2.5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <input className={miniInput} style={inputStyle} value={m.fa} placeholder={fa ? "نام (فارسی)" : "Name FA"} onChange={(e) => updPay(i, { fa: e.target.value })} />
                      <input className={miniInput} style={inputStyle} dir="ltr" value={m.en} placeholder="Name EN" onChange={(e) => updPay(i, { en: e.target.value })} />
                      <select className={miniInput} style={inputStyle} value={m.kind} onChange={(e) => updPay(i, { kind: e.target.value as PayMethod["kind"] })}>
                        <option value="online">{fa ? "آنلاین (درگاه)" : "Online"}</option>
                        <option value="wallet">{fa ? "کیف پول" : "Wallet"}</option>
                        <option value="cod">{fa ? "پرداخت در محل" : "Cash on delivery"}</option>
                      </select>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <label className="flex cursor-pointer items-center gap-2 text-[12.5px] font-bold"><input type="checkbox" checked={m.enabled !== false} onChange={(e) => updPay(i, { enabled: e.target.checked })} style={{ accentColor: "var(--accent)" }} />{fa ? "فعال" : "Enabled"}</label>
                      <button onClick={() => rmPay(i)} className="cursor-pointer border-none bg-transparent text-[12px] font-bold" style={{ color: "#e11d48" }}>{fa ? "حذف" : "Remove"}</button>
                    </div>
                  </div>
                ))}
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

        {/* SEO moved to its own dedicated section */}

        {/* AI settings (GapGPT) */}
        <Card className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[15px] font-extrabold">{fa ? "تنظیمات هوش مصنوعی" : "AI settings"}</h2>
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
              ? "کلید API سرویس هوش مصنوعی خود را وارد کن، آدرس سرویس (Base URL) را بگذار و مدل را انتخاب کن. هر سرویس سازگار با OpenAI پشتیبانی می‌شود (مثل گپ‌جی‌پی‌تی، آوال‌ای‌آی، اوپن‌ای‌آی و …)."
              : "Enter your AI service API key, Base URL, and pick a model. Any OpenAI-compatible service works."}
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
                  ? (fa ? `✓ ${num(aiModels.length, locale)} مدل از سرویس شما` : `✓ ${aiModels.length} models from your service`)
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
              {Object.keys(aiTaskModels).length > 0 && (
                <button onClick={() => setAiTaskModels({})} className="mt-3 cursor-pointer rounded-[9px] px-3 py-1.5 text-[12px] font-bold" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--accent)" }}>
                  ↺ {fa ? "همهٔ بخش‌ها از مدل پیش‌فرض استفاده کنند" : "Reset all to default model"}
                </button>
              )}
              <p className="mt-2 text-[11px] leading-relaxed" style={{ color: "var(--muted)" }}>
                {fa ? "وقتی سرویس هوش مصنوعی را عوض می‌کنی، حتماً این را بزن یا مدل هر بخش را به مدلی از سرویس جدید تغییر بده؛ وگرنه مدل قدیمی باعث خطای تولید می‌شود." : "After switching AI provider, reset these or pick models from the new service to avoid generation errors."}
              </p>
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
