"use client";

import { useState } from "react";
import { useShop } from "@/lib/store";
import { CATEGORIES, BRANDS } from "@/data/categories";
import type { Product, Variation } from "@/lib/types";
import { Plus, Trash, Close } from "@/components/Icons";

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
  onSave: (p: Product) => void;
}) {
  const { locale, t, toast } = useShop();

  const [fa, setFa] = useState(initial?.fa ?? "");
  const [en, setEn] = useState(initial?.en ?? "");
  const [cat, setCat] = useState(initial?.cat ?? CATEGORIES[0].id);
  const [brand, setBrand] = useState(initial?.brand ?? BRANDS[0]);
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [old, setOld] = useState(String(initial?.old ?? ""));
  const [stock, setStock] = useState(String(initial?.stock ?? ""));
  const [country, setCountry] = useState(initial?.country ?? "");
  const [warranty, setWarranty] = useState(initial?.warranty ?? "");
  const [shortFa, setShortFa] = useState(initial?.shortFa ?? "");
  const [shortEn, setShortEn] = useState(initial?.shortEn ?? "");
  const [vars, setVars] = useState<Variation[]>(initial?.variations ?? []);

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
      brand,
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
      sku: sku.trim() || undefined,
      variations: vars.length ? vars : undefined,
    };
    onSave(product);
    toast(initial ? t.saved : locale === "fa" ? "محصول اضافه شد ✓" : "Product added ✓");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.55)" }}
      onClick={onClose}
    >
      <div
        className="max-h-[88vh] w-full max-w-[680px] overflow-y-auto rounded-[16px] p-6 scrollthin"
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
            <input className={inputCls} style={inputStyle} value={fa} onChange={(e) => setFa(e.target.value)} />
          </div>
          <div>
            {lbl(locale === "fa" ? "نام (انگلیسی)" : "Name (English)")}
            <input className={inputCls} style={inputStyle} value={en} onChange={(e) => setEn(e.target.value)} />
          </div>
          <div>
            {lbl(t.thCat)}
            <select className={inputCls} style={inputStyle} value={cat} onChange={(e) => setCat(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {locale === "fa" ? c.fa : c.en}
                </option>
              ))}
            </select>
          </div>
          <div>
            {lbl(t.brand)}
            <select className={inputCls} style={inputStyle} value={brand} onChange={(e) => setBrand(e.target.value)}>
              {BRANDS.map((b) => (
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
            <input className={inputCls} style={inputStyle} inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            {lbl(locale === "fa" ? "قیمت قبل از تخفیف" : "Compare-at price")}
            <input className={inputCls} style={inputStyle} inputMode="numeric" value={old} onChange={(e) => setOld(e.target.value)} />
          </div>
          <div>
            {lbl(t.thStock)}
            <input className={inputCls} style={inputStyle} inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} />
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
            {lbl(locale === "fa" ? "توضیح کوتاه (فارسی)" : "Short description (Persian)")}
            <input className={inputCls} style={inputStyle} value={shortFa} onChange={(e) => setShortFa(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            {lbl(locale === "fa" ? "توضیح کوتاه (انگلیسی)" : "Short description (English)")}
            <input className={inputCls} style={inputStyle} value={shortEn} onChange={(e) => setShortEn(e.target.value)} />
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
                <input className="w-[90px] rounded-[8px] px-2.5 py-2 text-[12.5px] outline-none" style={inputStyle} inputMode="numeric" placeholder={t.thPrice} value={v.price || ""} onChange={(e) => setVar(i, "price", e.target.value)} />
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
