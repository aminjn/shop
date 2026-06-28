"use client";

import { useState } from "react";
import { useShop } from "@/lib/store";
import { CATEGORIES as SEED_CATS, BRANDS } from "@/data/categories";
import type { Product, Variation } from "@/lib/types";
import { Plus, Trash, Close, Play } from "@/components/Icons";
import { UploadButton } from "@/components/UploadButton";
import { translateOne } from "@/lib/aitranslate";

const inputCls = "w-full rounded-[10px] px-3 py-2.5 text-[13.5px] outline-none";
const inputStyle = {
  background: "var(--surface2)",
  border: "1px solid var(--border)",
  color: "var(--text)",
} as const;

export function ProductModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: Product | null;
  onClose: () => void;
  onSave: (p: Product) => void | Promise<void>;
}) {
  const { locale, t, toast, categories: liveCats, brands: liveBrands } = useShop();
  const CATEGORIES = liveCats.length ? liveCats : SEED_CATS;
  const BRAND_NAMES = liveBrands.length ? liveBrands.map((b) => b.name) : BRANDS;

  const [fa, setFa] = useState(initial?.fa ?? "");
  const [en, setEn] = useState(initial?.en ?? "");
  const [cat, setCat] = useState(initial?.cat ?? CATEGORIES[0].id);
  const [sub, setSub] = useState(initial?.sub ?? "");
  const curCat = CATEGORIES.find((c) => c.id === cat);
  const subOptions = curCat?.subs ?? [];
  const [brand, setBrand] = useState(initial?.brand ?? BRAND_NAMES[0] ?? "");
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [old, setOld] = useState(String(initial?.old ?? ""));
  const [stock, setStock] = useState(String(initial?.stock ?? ""));
  const [country, setCountry] = useState(initial?.country ?? "");
  const [warranty, setWarranty] = useState(initial?.warranty ?? "");
  const [shortFa, setShortFa] = useState(initial?.shortFa ?? "");
  const [shortEn, setShortEn] = useState(initial?.shortEn ?? "");
  const [specs, setSpecs] = useState<[string, string][]>(initial?.specs ?? []);
  const [aiBusy, setAiBusy] = useState(false);
  const [vars, setVars] = useState<Variation[]>(initial?.variations ?? []);
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [video, setVideo] = useState(initial?.video ?? "");
  const [enBusy, setEnBusy] = useState(false);
  const [featured, setFeatured] = useState(!!initial?.featured);
  const [packMode, setPackMode] = useState(!!(initial?.packSize && initial.packSize > 1));
  const [packSize, setPackSize] = useState(String(initial?.packSize ?? ""));
  const [perCm, setPerCm] = useState(initial?.pricingType === "per_cm");
  const [pricePerCm, setPricePerCm] = useState(String(initial?.pricePerCm ?? ""));
  const [width, setWidth] = useState(String(initial?.width ?? ""));

  // group digits with thousands separators for price fields (state stays raw digits)
  const grp = (v: string) => { const d = String(v).replace(/[^\d]/g, ""); return d ? Number(d).toLocaleString("en-US") : ""; };
  const digits = (v: string) => v.replace(/[^\d]/g, "");

  const lbl = (s: string) => (
    <label className="mb-1 block text-[12.5px] font-bold" style={{ color: "var(--muted)" }}>
      {s}
    </label>
  );

  const addVar = () =>
    setVars((v) => [...v, { type: "", value: "", price: 0, stock: 0, sku: "" }]);
  const rmVar = (i: number) => setVars((v) => v.filter((_, idx) => idx !== i));
  const setVar = (i: number, key: keyof Variation, val: string) =>
    setVars((v) =>
      v.map((row, idx) =>
        idx === i
          ? { ...row, [key]: key === "price" || key === "stock" ? Number(val) || 0 : val }
          : row,
      ),
    );

  // specs editor
  const addSpec = () => setSpecs((s) => [...s, ["", ""]]);
  const setSpec = (i: number, idx: 0 | 1, val: string) =>
    setSpecs((s) => s.map((row, x) => (x === i ? (idx === 0 ? [val, row[1]] : [row[0], val]) : row)));
  const rmSpec = (i: number) => setSpecs((s) => s.filter((_, x) => x !== i));

  // one-click AI: write the description + technical specs from the product name
  const aiFill = async () => {
    if (!fa.trim()) { toast(locale === "fa" ? "اول نام محصول را بنویس" : "Enter product name"); return; }
    setAiBusy(true);
    try {
      const r = await fetch("/api/ai/generate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: fa.trim(), category: cat }) });
      const d = await r.json().catch(() => ({}));
      if (!d.ok || !d.result) { toast(locale === "fa" ? "هوش مصنوعی پاسخی نداد — اعتبار سرویس را بررسی کن" : "AI unavailable — check account credit"); return; }
      const res = d.result as { shortDesc?: string; longDesc?: string; longDescEn?: string; shortDescEn?: string; specs?: { k: string; v: string }[] };
      const desc = (res.longDesc || res.shortDesc || "").trim();
      if (desc) {
        setShortFa(desc);
        // prefer the English the model wrote directly; only translate as a fallback
        const enDirect = (res.longDescEn || res.shortDescEn || "").trim();
        const en = enDirect || (await translateOne(desc, true)) || "";
        if (en) setShortEn(en);
      }
      if (Array.isArray(res.specs) && res.specs.length)
        setSpecs(res.specs.filter((s) => s && s.k && s.v).map((s) => [String(s.k), String(s.v)] as [string, string]));
      toast(locale === "fa" ? "توضیحات و مشخصات با هوش مصنوعی پر شد ✓" : "Filled with AI ✓");
    } catch { toast(locale === "fa" ? "خطای شبکه" : "Error"); } finally { setAiBusy(false); }
  };

  const save = () => {
    if (!fa.trim()) {
      toast(locale === "fa" ? "نام محصول الزامی است" : "Product name is required");
      return;
    }
    const product: Product = {
      id: initial?.id ?? Date.now(),
      fa: fa.trim(),
      en: en.trim() || fa.trim(),
      cat,
      sub: sub || undefined,
      brand,
      featured: featured || undefined,
      packSize: packMode && Number(packSize) > 1 ? Number(packSize) : undefined,
      price: Number(price) || 0,
      old: Number(old) || undefined,
      rating: initial?.rating ?? 0,
      reviews: initial?.reviews ?? 0,
      hue: initial?.hue ?? Math.floor(Math.random() * 360),
      country: country.trim(),
      warranty: warranty.trim() || "-",
      stock: Number(stock) || 0,
      shortFa: shortFa.trim() || undefined,
      shortEn: shortEn.trim() || undefined,
      specs: specs.filter(([k, v]) => k.trim() && v.trim()).length ? specs.filter(([k, v]) => k.trim() && v.trim()) : undefined,
      sku: sku.trim() || undefined,
      variations: vars.length ? vars : undefined,
      images: images.length ? images : undefined,
      video: video || undefined,
      pricingType: perCm ? "per_cm" : undefined,
      pricePerCm: perCm ? Number(pricePerCm) || 0 : undefined,
      width: perCm && width ? Number(width) || undefined : undefined,
    };
    // The parent persists to the API and shows the success/failure toast.
    onSave(product);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.55)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[680px] max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain scrollthin rounded-[16px] p-5 sm:p-6"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[18px] font-extrabold">
            {initial
              ? locale === "fa"
                ? "ویرایش محصول"
                : "Edit product"
              : locale === "fa"
                ? "افزودن محصول"
                : "Add product"}
          </h2>
          <button
            onClick={onClose}
            aria-label={t.remove}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[10px] border-none"
            style={{ background: "var(--surface2)", color: "var(--text)" }}
          >
            <Close size={18} />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            {lbl(locale === "fa" ? "نام (فارسی)" : "Name (Persian)")}
            <input className={inputCls} style={inputStyle} value={fa} onChange={(e) => setFa(e.target.value)}
              onBlur={async () => { if (fa.trim() && !en.trim()) { setEnBusy(true); const v = await translateOne(fa); if (v) setEn(v); setEnBusy(false); } }} />
          </div>
          <div>
            {lbl((locale === "fa" ? "نام (انگلیسی)" : "Name (English)") + (enBusy ? (locale === "fa" ? " — در حال ترجمه…" : " — translating…") : ""))}
            <div className="flex gap-2">
              <input className={inputCls} style={inputStyle} value={en} onChange={(e) => setEn(e.target.value)} dir="ltr" placeholder={locale === "fa" ? "خودکار از روی نام فارسی" : "auto from Persian"} />
              <button type="button" onClick={async () => { if (!fa.trim()) return; setEnBusy(true); const v = await translateOne(fa); if (v) setEn(v); setEnBusy(false); }} disabled={enBusy} title={locale === "fa" ? "تکمیل با هوش مصنوعی" : "AI complete"} className="flex-none cursor-pointer rounded-[10px] px-3 text-[13px] font-bold disabled:opacity-60" style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--accent)" }}>✨</button>
            </div>
          </div>
          <div>
            {lbl(t.thCat)}
            <select className={inputCls} style={inputStyle} value={cat} onChange={(e) => { setCat(e.target.value); setSub(""); }}>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {locale === "fa" ? c.fa : c.en}
                </option>
              ))}
            </select>
          </div>
          <div>
            {lbl(locale === "fa" ? "زیردسته" : "Subcategory")}
            <select className={inputCls} style={inputStyle} value={sub} onChange={(e) => setSub(e.target.value)} disabled={!subOptions.length}>
              <option value="">{locale === "fa" ? (subOptions.length ? "بدون زیردسته" : "زیردسته‌ای ندارد") : "None"}</option>
              {subOptions.map(([sf, se]) => (
                <option key={se} value={se}>
                  {locale === "fa" ? sf : se}
                </option>
              ))}
            </select>
          </div>
          <div>
            {lbl(t.brand)}
            <select className={inputCls} style={inputStyle} value={brand} onChange={(e) => setBrand(e.target.value)}>
              {brand && !BRAND_NAMES.includes(brand) && <option value={brand}>{brand}</option>}
              {BRAND_NAMES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div>
            {lbl(t.sku)}
            <input className={inputCls} style={inputStyle} value={sku} onChange={(e) => setSku(e.target.value)} />
          </div>
          <div>
            {lbl(t.thPrice)}
            <input className={inputCls} style={inputStyle} inputMode="numeric" dir="ltr" value={grp(price)} onChange={(e) => setPrice(digits(e.target.value))} />
          </div>
          <div>
            {lbl(locale === "fa" ? "قیمت قبل از تخفیف" : "Compare-at price")}
            <input className={inputCls} style={inputStyle} inputMode="numeric" dir="ltr" value={grp(old)} onChange={(e) => setOld(digits(e.target.value))} />
          </div>
          <div>
            {lbl(t.thStock)}
            <input className={inputCls} style={inputStyle} inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} />
          </div>
          {/* featured / special product */}
          <div className="sm:col-span-2 rounded-[12px] p-3.5" style={{ background: featured ? "color-mix(in srgb, var(--accent) 12%, var(--surface2))" : "var(--surface2)", border: "1px solid var(--border)" }}>
            <label className="flex cursor-pointer items-center gap-2 text-[13px] font-extrabold">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--accent)" }} />
              ⭐ {locale === "fa" ? "محصول ویژه (در صفحهٔ اصلی و با نشان ویژه نمایش داده می‌شود)" : "Featured product"}
            </label>
          </div>
          {/* pack / carton sales */}
          <div className="sm:col-span-2 rounded-[12px] p-3.5" style={{ background: packMode ? "color-mix(in srgb, var(--accent) 12%, var(--surface2))" : "var(--surface2)", border: "1px solid var(--border)" }}>
            <label className="flex cursor-pointer items-center gap-2 text-[13px] font-extrabold">
              <input type="checkbox" checked={packMode} onChange={(e) => setPackMode(e.target.checked)} style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--accent)" }} />
              📦 {locale === "fa" ? "فروش کارتنی / بسته‌ای (خرید تکی ممکن نیست)" : "Pack/carton sales (no single unit)"}
            </label>
            {packMode && (
              <div className="mt-3">
                {lbl(locale === "fa" ? "تعداد در هر کارتن" : "Units per carton")}
                <input className={inputCls} style={{ ...inputStyle, maxWidth: 200 }} inputMode="numeric" value={packSize} onChange={(e) => setPackSize(e.target.value)} placeholder={locale === "fa" ? "مثلاً ۱۰" : "e.g. 10"} />
                <p className="mt-1.5 text-[12px]" style={{ color: "var(--muted)" }}>{locale === "fa" ? `قیمت وارد شده، قیمت «هر عدد» است. هر کارتن = قیمت × تعداد. مشتری فقط مضربی از این تعداد می‌تواند بخرد.` : "Price is per unit; a carton = price × units."}</p>
              </div>
            )}
          </div>
          {/* per-cm pricing (rolls/fabric sold by length) */}
          <div className="sm:col-span-2 rounded-[12px] p-3.5" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
            <label className="flex cursor-pointer items-center gap-2 text-[13px] font-extrabold">
              <input type="checkbox" checked={perCm} onChange={(e) => setPerCm(e.target.checked)} style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--accent)" }} />
              {locale === "fa" ? "قیمت‌گذاری بر اساس سانت (محصول سانتی/متراژی)" : "Per-centimeter pricing"}
            </label>
            {perCm && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  {lbl(locale === "fa" ? "قیمت هر سانت (تومان)" : "Price per cm")}
                  <input className={inputCls} style={inputStyle} inputMode="numeric" value={grp(pricePerCm)} onChange={(e) => setPricePerCm(digits(e.target.value))} dir="ltr" />
                </div>
                <div>
                  {lbl(locale === "fa" ? "عرض (سانت)" : "Width (cm)")}
                  <input className={inputCls} style={inputStyle} inputMode="numeric" value={width} onChange={(e) => setWidth(e.target.value)} dir="ltr" />
                </div>
                <p className="text-[11.5px] sm:col-span-2" style={{ color: "var(--muted)" }}>
                  {locale === "fa" ? "این محصول‌ها بر اساس طول (سانت) فروخته می‌شوند. می‌توانی قیمت هر سانت را به‌صورت دسته‌ای هم در فهرست محصولات تغییر دهی." : "Sold by length; per-cm price is bulk-editable in the product list."}
                </p>
              </div>
            )}
          </div>
          <div>
            {lbl(t.origin)}
            <input className={inputCls} style={inputStyle} value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
          <div>
            {lbl(t.warranty)}
            <input className={inputCls} style={inputStyle} value={warranty} onChange={(e) => setWarranty(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <div className="mb-1 flex items-center justify-between gap-2">
              {lbl(locale === "fa" ? "توضیحات" : "Description")}
              <button type="button" onClick={aiFill} disabled={aiBusy} className="mb-1 inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[12.5px] font-bold disabled:opacity-60" style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--accent)" }}>
                ✨ {aiBusy ? (locale === "fa" ? "در حال تولید…" : "…") : locale === "fa" ? "تولید توضیحات و مشخصات با هوش مصنوعی" : "Generate with AI"}
              </button>
            </div>
            <textarea className={inputCls} style={{ ...inputStyle, minHeight: 72 }} rows={3} value={shortFa} onChange={(e) => setShortFa(e.target.value)} placeholder={locale === "fa" ? "توضیح فارسی محصول (یا با دکمهٔ ✨ بالا تولید کن)" : "Persian description"} />
          </div>
          <div className="sm:col-span-2">
            {lbl(locale === "fa" ? "توضیح (انگلیسی)" : "Description (English)")}
            <textarea className={inputCls} style={{ ...inputStyle, minHeight: 56 }} rows={2} dir="ltr" value={shortEn} onChange={(e) => setShortEn(e.target.value)} placeholder={locale === "fa" ? "خودکار از فارسی با ✨" : "English description"} />
          </div>
          {/* technical specs */}
          <div className="sm:col-span-2">
            <div className="mb-1.5 flex items-center justify-between">
              {lbl(locale === "fa" ? "مشخصات فنی" : "Technical specs")}
              <button type="button" onClick={addSpec} className="mb-1 cursor-pointer rounded-[10px] px-3 py-1.5 text-[12.5px] font-bold" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>+ {locale === "fa" ? "افزودن مشخصه" : "Add spec"}</button>
            </div>
            {specs.length === 0 ? (
              <p className="text-[12px]" style={{ color: "var(--muted)" }}>{locale === "fa" ? "مشخصه‌ای اضافه نشده — دستی اضافه کن یا با دکمهٔ ✨ بساز." : "No specs yet."}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {specs.map(([k, v], i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input className={inputCls} style={{ ...inputStyle, maxWidth: 200 }} value={k} onChange={(e) => setSpec(i, 0, e.target.value)} placeholder={locale === "fa" ? "عنوان (مثلاً جنس)" : "Label"} />
                    <input className={inputCls} style={inputStyle} value={v} onChange={(e) => setSpec(i, 1, e.target.value)} placeholder={locale === "fa" ? "مقدار" : "Value"} />
                    <button type="button" onClick={() => rmSpec(i)} aria-label={t.remove} className="flex-none cursor-pointer rounded-[10px] px-2.5 py-2 text-[13px] font-bold" style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "#e11d48" }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* media */}
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[14px] font-extrabold">{locale === "fa" ? "تصاویر و ویدئو" : "Images & video"}</h3>
            <UploadButton accept="image/*" multiple label={locale === "fa" ? "آپلود تصویر" : "Upload images"} onUploaded={(url) => setImages((arr) => [...arr, url])} />
          </div>
          {images.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2.5">
              {images.map((src, i) => (
                <div key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-20 w-20 rounded-[10px] object-cover" style={{ border: "1px solid var(--border)" }} />
                  <button onClick={() => setImages((a) => a.filter((_, idx) => idx !== i))} aria-label={t.del} className="absolute flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-none text-white" style={{ insetInlineEnd: -6, top: -6, background: "#e11d48" }}>
                    <Close size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3">
            <UploadButton accept="video/mp4,video/webm" label={locale === "fa" ? "آپلود ویدئو" : "Upload video"} onUploaded={(url) => setVideo(url)} />
            {video && (
              <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold" style={{ color: "var(--accent)" }}>
                <Play size={14} /> {locale === "fa" ? "ویدئو بارگذاری شد" : "Video uploaded"}
                <button onClick={() => setVideo("")} className="cursor-pointer border-none bg-transparent" style={{ color: "#e11d48" }}>✕</button>
              </span>
            )}
          </div>
        </div>

        {/* variations */}
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[14px] font-extrabold">
              {locale === "fa" ? "تنوع‌ها (واریاسیون)" : "Variations"}
            </h3>
            <button
              onClick={addVar}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border-none px-3 py-2 text-[12.5px] font-bold"
              style={{ background: "var(--surface2)", color: "var(--accent)" }}
            >
              <Plus size={14} /> {locale === "fa" ? "افزودن تنوع" : "Add variation"}
            </button>
          </div>
          <div className="flex flex-col gap-2.5">
            {vars.length === 0 && (
              <p className="text-[12.5px]" style={{ color: "var(--muted)" }}>
                {locale === "fa" ? "هنوز تنوعی اضافه نشده است." : "No variations added yet."}
              </p>
            )}
            {vars.map((v, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 rounded-[12px] p-2.5" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
                <input className="min-w-0 flex-1 rounded-[8px] px-2.5 py-2 text-[12.5px] outline-none" style={inputStyle} placeholder={locale === "fa" ? "نوع" : "Type"} value={v.type} onChange={(e) => setVar(i, "type", e.target.value)} />
                <input className="min-w-0 flex-1 rounded-[8px] px-2.5 py-2 text-[12.5px] outline-none" style={inputStyle} placeholder={locale === "fa" ? "مقدار" : "Value"} value={v.value} onChange={(e) => setVar(i, "value", e.target.value)} />
                <input className="w-[110px] rounded-[8px] px-2.5 py-2 text-[12.5px] outline-none" style={inputStyle} inputMode="numeric" placeholder={t.thPrice} value={grp(String(v.price || ""))} onChange={(e) => setVar(i, "price", digits(e.target.value))} />
                <input className="w-[72px] rounded-[8px] px-2.5 py-2 text-[12.5px] outline-none" style={inputStyle} inputMode="numeric" placeholder={t.thStock} value={v.stock || ""} onChange={(e) => setVar(i, "stock", e.target.value)} />
                <input className="w-[100px] rounded-[8px] px-2.5 py-2 text-[12.5px] outline-none" style={inputStyle} placeholder={t.sku} value={v.sku} onChange={(e) => setVar(i, "sku", e.target.value)} />
                <button onClick={() => rmVar(i)} aria-label={t.del} className="flex h-8 w-8 flex-none cursor-pointer items-center justify-center rounded-[8px] border-none" style={{ background: "var(--surface)", color: "#e11d48" }}>
                  <Trash size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="cursor-pointer rounded-[12px] border-none px-5 py-3 text-[14px] font-bold"
            style={{ background: "var(--surface2)", color: "var(--text)" }}
          >
            {locale === "fa" ? "انصراف" : "Cancel"}
          </button>
          <button
            onClick={save}
            className="cursor-pointer rounded-[12px] border-none px-6 py-3 text-[14px] font-extrabold text-white"
            style={{ background: "var(--accent)" }}
          >
            {locale === "fa" ? "ذخیره" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
