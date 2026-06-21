"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useShop } from "@/lib/store";
import { CATEGORIES } from "@/data/categories";
import { num } from "@/lib/format";
import { ProductCard } from "@/components/ProductCard";
import { Grid, List, Sparkle, Close } from "@/components/Icons";
import type { Product } from "@/lib/types";

const ALL_COLORS = [
  ["مشکی", "Black", "#1a1a1a"],
  ["سفید", "White", "#f1f3f6"],
  ["آبی", "Blue", "#2a6fdb"],
  ["قرمز", "Red", "#e11d48"],
  ["سبز", "Green", "#1f8a5b"],
  ["طلایی", "Gold", "#d4af37"],
];
const ALL_SIZES = ["۴۰", "۴۱", "۴۲", "۴۳", "۴۴"];
const MAX_PRICE = 15_000_000;

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1280px] px-[22px] py-7" />}>
      <ShopContent />
    </Suspense>
  );
}

function ShopContent() {
  const sp = useSearchParams();
  const { locale, t, products } = useShop();

  const qParam = sp.get("q") || "";
  const catParam = sp.get("cat") || "all";
  const brandParam = sp.get("brand") || "";

  const [activeCat, setActiveCat] = useState(catParam);
  const [priceMax, setPriceMax] = useState(MAX_PRICE);
  const [brandFilter, setBrandFilter] = useState<string[]>(brandParam ? [brandParam] : []);
  const [ratingMin, setRatingMin] = useState(0);
  const [colorFilter, setColorFilter] = useState<string[]>([]);
  const [sizeFilter, setSizeFilter] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState("popular");
  const [view, setView] = useState<"grid" | "list">("grid");

  const [aiIds, setAiIds] = useState<number[] | null>(null);
  const [aiNote, setAiNote] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    setActiveCat(catParam);
  }, [catParam]);
  useEffect(() => {
    setBrandFilter(brandParam ? [brandParam] : []);
  }, [brandParam]);

  // AI search
  useEffect(() => {
    if (!qParam) {
      setAiIds(null);
      setAiNote("");
      return;
    }
    let cancelled = false;
    setAiLoading(true);
    fetch("/api/ai-search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: qParam, locale }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setAiIds(Array.isArray(d.ids) ? d.ids : []);
        setAiNote(d.note || "");
      })
      .catch(() => !cancelled && setAiIds([]))
      .finally(() => !cancelled && setAiLoading(false));
    return () => {
      cancelled = true;
    };
  }, [qParam, locale]);

  const brands = useMemo(() => [...new Set(products.map((p) => p.brand))], [products]);

  const list: Product[] = useMemo(() => {
    if (aiIds) {
      return aiIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is Product => Boolean(p));
    }
    let out = products.filter((p) => {
      if (activeCat !== "all" && p.cat !== activeCat) return false;
      if (p.price > priceMax) return false;
      if (brandFilter.length && !brandFilter.includes(p.brand)) return false;
      if (ratingMin && p.rating < ratingMin) return false;
      if (inStockOnly && p.stock <= 0) return false;
      if (colorFilter.length) {
        const names = (p.colors || []).map((c) => c[0]);
        if (!colorFilter.some((cf) => names.includes(cf))) return false;
      }
      if (sizeFilter.length) {
        if (!(p.sizes || []).some((sz) => sizeFilter.includes(sz))) return false;
      }
      return true;
    });
    out = [...out];
    switch (sort) {
      case "newest": out.reverse(); break;
      case "cheap": out.sort((a, b) => a.price - b.price); break;
      case "expensive": out.sort((a, b) => b.price - a.price); break;
      case "best": out.sort((a, b) => b.reviews - a.reviews); break;
      case "discount":
        out.sort((a, b) => (b.old ? b.old - b.price : 0) - (a.old ? a.old - a.price : 0));
        break;
      default: out.sort((a, b) => b.rating - a.rating);
    }
    return out;
  }, [products, aiIds, activeCat, priceMax, brandFilter, ratingMin, inStockOnly, colorFilter, sizeFilter, sort]);

  const reset = () => {
    setActiveCat("all");
    setPriceMax(MAX_PRICE);
    setBrandFilter([]);
    setRatingMin(0);
    setColorFilter([]);
    setSizeFilter([]);
    setInStockOnly(false);
  };

  const toggle = <T,>(arr: T[], v: T, set: (x: T[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const fieldBox = "rounded-[12px] p-4";
  const fieldStyle = { background: "var(--surface)", border: "1px solid var(--border)" };

  return (
    <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-6 px-[22px] py-7 md:grid-cols-[260px_1fr]">
      {/* sidebar */}
      <aside className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-extrabold">{t.filters}</h2>
          <button onClick={reset} className="cursor-pointer border-none bg-transparent text-[13px] font-bold" style={{ color: "var(--accent)" }}>{t.reset}</button>
        </div>

        <div className={fieldBox} style={fieldStyle}>
          <div className="mb-2.5 text-[13.5px] font-bold">{t.fCategory}</div>
          <div className="flex flex-col gap-1.5">
            {[["all", t.allCats] as const, ...CATEGORIES.map((c) => [c.id, locale === "fa" ? c.fa : c.en] as const)].map(([id, label]) => (
              <button key={id} onClick={() => setActiveCat(id)} className="cursor-pointer border-none bg-transparent py-1 text-[13.5px]" style={{ color: activeCat === id ? "var(--accent)" : "var(--text)", fontWeight: activeCat === id ? 700 : 400, textAlign: "start" }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className={fieldBox} style={fieldStyle}>
          <div className="mb-2.5 text-[13.5px] font-bold">{t.fPrice}</div>
          <input type="range" min={0} max={MAX_PRICE} step={100000} value={priceMax} onChange={(e) => setPriceMax(Number(e.target.value))} className="w-full" style={{ accentColor: "var(--accent)" }} />
          <div className="mt-1 text-[12.5px]" style={{ color: "var(--muted)" }}>{t.upTo} {num(priceMax, locale)} {t.currency}</div>
        </div>

        <div className={fieldBox} style={fieldStyle}>
          <div className="mb-2.5 text-[13.5px] font-bold">{t.fBrand}</div>
          <div className="flex flex-col gap-1.5">
            {brands.map((b) => (
              <label key={b} className="flex cursor-pointer items-center gap-2 text-[13.5px]">
                <input type="checkbox" checked={brandFilter.includes(b)} onChange={() => toggle(brandFilter, b, setBrandFilter)} style={{ accentColor: "var(--accent)" }} />
                {b}
              </label>
            ))}
          </div>
        </div>

        <div className={fieldBox} style={fieldStyle}>
          <div className="mb-2.5 text-[13.5px] font-bold">{t.fRating}</div>
          <div className="flex flex-col gap-1.5">
            {[4, 3, 0].map((r) => (
              <button key={r} onClick={() => setRatingMin(r)} className="cursor-pointer border-none bg-transparent py-1 text-[13.5px]" style={{ color: ratingMin === r ? "var(--accent)" : "var(--text)", fontWeight: ratingMin === r ? 700 : 400, textAlign: "start" }}>
                {r === 0 ? (locale === "fa" ? "همه" : "All") : `${"★".repeat(r)}+ `}
              </button>
            ))}
          </div>
        </div>

        <div className={fieldBox} style={fieldStyle}>
          <div className="mb-2.5 text-[13.5px] font-bold">{t.fColor}</div>
          <div className="flex flex-wrap gap-2">
            {ALL_COLORS.map(([fa, en, hex]) => {
              const name = locale === "fa" ? fa : en;
              const on = colorFilter.includes(fa);
              return (
                <button key={fa} onClick={() => toggle(colorFilter, fa, setColorFilter)} title={name} className="h-7 w-7 cursor-pointer rounded-full" style={{ background: hex, border: on ? "2px solid var(--accent)" : "2px solid var(--border)", outline: on ? "2px solid var(--accent)" : "none", outlineOffset: 1 }} />
              );
            })}
          </div>
        </div>

        <div className={fieldBox} style={fieldStyle}>
          <div className="mb-2.5 text-[13.5px] font-bold">{t.fSize}</div>
          <div className="flex flex-wrap gap-2">
            {ALL_SIZES.map((sz) => {
              const on = sizeFilter.includes(sz);
              return (
                <button key={sz} onClick={() => toggle(sizeFilter, sz, setSizeFilter)} className="min-w-[40px] cursor-pointer rounded-[8px] px-2.5 py-1.5 text-[13px] font-bold" style={{ background: on ? "var(--accent)" : "var(--surface2)", color: on ? "#fff" : "var(--text)", border: "1px solid var(--border)" }}>{sz}</button>
              );
            })}
          </div>
        </div>

        <label className={`${fieldBox} flex cursor-pointer items-center justify-between text-[13.5px] font-bold`} style={fieldStyle}>
          {t.fInStock}
          <input type="checkbox" checked={inStockOnly} onChange={() => setInStockOnly(!inStockOnly)} style={{ accentColor: "var(--accent)" }} />
        </label>
      </aside>

      {/* main */}
      <div>
        {qParam && (
          <div className="mb-4 flex items-center justify-between rounded-[14px] p-4 text-white" style={{ background: "var(--accent)" }}>
            <div className="flex items-center gap-2.5">
              <Sparkle size={20} />
              <div>
                <div className="text-[14px] font-extrabold">{t.aiResultNote}: “{qParam}”</div>
                {aiNote && <div className="text-[12.5px] opacity-90">{aiNote}</div>}
              </div>
            </div>
            <button onClick={() => { history.replaceState(null, "", `/${locale}/shop`); setAiIds(null); setAiNote(""); }} className="inline-flex cursor-pointer items-center gap-1.5 rounded-[9px] border-none px-3 py-2 text-[12.5px] font-bold" style={{ background: "rgba(255,255,255,.2)", color: "#fff" }}>
              <Close size={14} /> {t.clearAi}
            </button>
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[14px]" style={{ color: "var(--muted)" }}>
            {aiLoading ? (locale === "fa" ? "در حال جستجوی هوشمند…" : "Searching…") : `${num(list.length, locale)} ${t.resultsCount}`}
          </div>
          <div className="flex items-center gap-2">
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="cursor-pointer rounded-[10px] px-3 py-2 text-[13.5px] outline-none" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>
              <option value="popular">{t.sortPopular}</option>
              <option value="newest">{t.sortNewest}</option>
              <option value="cheap">{t.sortCheap}</option>
              <option value="expensive">{t.sortExpensive}</option>
              <option value="best">{t.sortBest}</option>
              <option value="discount">{t.sortDiscount}</option>
            </select>
            <button onClick={() => setView("grid")} className="flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-[10px]" style={{ background: view === "grid" ? "var(--accent)" : "var(--surface)", color: view === "grid" ? "#fff" : "var(--text)", border: "1px solid var(--border)" }}><Grid size={18} /></button>
            <button onClick={() => setView("list")} className="flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-[10px]" style={{ background: view === "list" ? "var(--accent)" : "var(--surface)", color: view === "list" ? "#fff" : "var(--text)", border: "1px solid var(--border)" }}><List size={18} /></button>
          </div>
        </div>

        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-[70px] text-[15px]" style={{ color: "var(--muted)" }}>{t.noResults}</div>
        ) : (
          <div className={view === "grid" ? "grid grid-cols-2 gap-[18px] md:grid-cols-3" : "flex flex-col gap-3.5"}>
            {list.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
