"use client";

import { useState } from "react";
import type { HomeBlock, HomeBlockType } from "@/lib/home";
import { useShop } from "@/lib/store";
import { useHomeEdit } from "./HomeEdit";
import { grad } from "@/lib/format";
import { ProductCard } from "./ProductCard";
import { LocaleLink } from "./LocaleLink";
import { UploadButton } from "./UploadButton";
import { translateOne } from "@/lib/aitranslate";
import { featured, newest, bestSellers, onSale } from "@/lib/selectors";

const newId = () => "blk-" + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);

function blankBlock(type: HomeBlockType): HomeBlock {
  const base: HomeBlock = { id: newId(), type, hue: -1, align: "start" };
  if (type === "hero") return { ...base, titleFa: "عنوان جدید", titleEn: "New title", textFa: "توضیح کوتاه", textEn: "Short description", btnFa: "بیشتر", btnEn: "More", href: "/shop", hue: 255 };
  if (type === "cta") return { ...base, titleFa: "یک پیشنهاد ویژه", titleEn: "A special offer", btnFa: "مشاهده", btnEn: "View", href: "/shop", hue: 255, align: "center" };
  if (type === "richtext") return { ...base, titleFa: "عنوان", titleEn: "Title", textFa: "متن دلخواه شما…", textEn: "Your text…" };
  if (type === "products") return { ...base, titleFa: "محصولات", titleEn: "Products", source: "featured" };
  if (type === "spacer") return { ...base, height: 40 };
  return base; // image
}

/** Thin wrapper: drives the homepage's blocks through the inline edit context. */
export function HomeBlocks() {
  const ctx = useHomeEdit();
  if (!ctx?.content) return null;
  if (!(ctx.content.blocks || []).length && !ctx.editMode) return null;
  return <BlockEditor blocks={ctx.content.blocks || []} editing={ctx.editMode} onChange={(arr) => ctx.updateList("blocks", arr)} />;
}

/** Reusable block canvas — used by the homepage and by standalone surfaces. */
export function BlockEditor({ blocks, editing, onChange }: { blocks: HomeBlock[]; editing: boolean; onChange: (b: HomeBlock[]) => void }) {
  const { locale, products, dark } = useShop();
  const [openId, setOpenId] = useState<string | null>(null);
  const fa = locale === "fa";
  if (!blocks.length && !editing) return null;

  const set = (arr: HomeBlock[]) => onChange(arr);
  const upd = (i: number, patch: Partial<HomeBlock>) => set(blocks.map((b, x) => (x === i ? { ...b, ...patch } : b)));
  const rm = (i: number) => set(blocks.filter((_, x) => x !== i));
  const move = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= blocks.length) return; const a = [...blocks]; [a[i], a[j]] = [a[j], a[i]]; set(a); };
  const add = (type: HomeBlockType) => set([...blocks, blankBlock(type)]);

  const tx = (f?: string, e?: string) => (fa ? f : e) || "";
  const pickProducts = (b: HomeBlock) => {
    let list = products;
    if (b.cat) list = list.filter((p) => p.cat === b.cat);
    const fn = b.source === "newest" ? newest : b.source === "bestsellers" ? bestSellers : b.source === "onsale" ? onSale : featured;
    return fn(list).slice(0, 4);
  };

  const view = (b: HomeBlock) => {
    switch (b.type) {
      case "spacer":
        return <div style={{ height: b.height || 40 }} />;
      case "image":
        return b.image ? (
          <LocaleLink href={b.href || "/shop"} className="block overflow-hidden rounded-[18px] no-underline">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.image} alt="" className="w-full object-cover" />
          </LocaleLink>
        ) : <div className="rounded-[18px] p-10 text-center text-[14px]" style={{ background: "var(--surface2)", border: "1px dashed var(--border)", color: "var(--muted)" }}>{fa ? "تصویری انتخاب نشده — از تنظیمات بلوک آپلود کن" : "No image"}</div>;
      case "richtext":
        return (
          <div className="rounded-[18px] p-7" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            {tx(b.titleFa, b.titleEn) && <h2 className="mb-2 text-[22px] font-extrabold tracking-tight">{tx(b.titleFa, b.titleEn)}</h2>}
            <p className="whitespace-pre-line text-[15px] leading-loose" style={{ color: "var(--muted)" }}>{tx(b.textFa, b.textEn)}</p>
          </div>
        );
      case "cta":
        return (
          <div className={`flex flex-col gap-4 rounded-[20px] p-10 text-white ${b.align === "center" ? "items-center text-center" : "items-start"}`} style={{ background: (b.hue ?? -1) >= 0 ? grad(b.hue!, dark) : "var(--accent)" }}>
            <h2 className="text-[30px] font-black leading-tight">{tx(b.titleFa, b.titleEn)}</h2>
            {tx(b.textFa, b.textEn) && <p className="max-w-[560px] text-[16px] opacity-90">{tx(b.textFa, b.textEn)}</p>}
            {tx(b.btnFa, b.btnEn) && <LocaleLink href={b.href || "/shop"} className="rounded-[12px] bg-white px-7 py-3 text-[15px] font-extrabold no-underline" style={{ color: "#111" }}>{tx(b.btnFa, b.btnEn)}</LocaleLink>}
          </div>
        );
      case "products": {
        const list = pickProducts(b);
        return (
          <div>
            {tx(b.titleFa, b.titleEn) && <h2 className="mb-[18px] text-[24px] font-extrabold tracking-tight">{tx(b.titleFa, b.titleEn)}</h2>}
            {list.length ? <div className="grid grid-cols-2 gap-[18px] md:grid-cols-4">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div>
              : <div className="rounded-[14px] p-8 text-center text-[14px]" style={{ background: "var(--surface2)", color: "var(--muted)" }}>{fa ? "محصولی برای این بلوک نیست" : "No products"}</div>}
          </div>
        );
      }
      case "hero":
      default:
        return (
          <div className={`relative flex min-h-[300px] flex-col justify-center gap-4 overflow-hidden rounded-[22px] p-12 text-white ${b.align === "center" ? "items-center text-center" : "items-start"}`} style={{ background: (b.hue ?? -1) >= 0 ? grad(b.hue!, dark) : grad(255, dark) }}>
            <h2 className="text-[40px] font-black leading-tight tracking-tight">{tx(b.titleFa, b.titleEn)}</h2>
            {tx(b.textFa, b.textEn) && <p className="max-w-[520px] text-[17px] opacity-90">{tx(b.textFa, b.textEn)}</p>}
            {tx(b.btnFa, b.btnEn) && <LocaleLink href={b.href || "/shop"} className="rounded-[12px] bg-white px-7 py-3.5 text-[15px] font-extrabold no-underline" style={{ color: "#111" }}>{tx(b.btnFa, b.btnEn)}</LocaleLink>}
          </div>
        );
    }
  };

  // ---- per-block settings panel (edit mode) ----
  const fld = (i: number, key: keyof HomeBlock, ph: string, area = false, ltr = false) => {
    const Tag = (area ? "textarea" : "input") as React.ElementType;
    return <Tag value={String(blocks[i][key] ?? "")} placeholder={ph} dir={ltr ? "ltr" : undefined} onChange={(e: React.ChangeEvent<HTMLInputElement>) => upd(i, { [key]: e.target.value })} className="w-full rounded-[8px] px-2.5 py-1.5 text-[12.5px] outline-none" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }} />;
  };
  const aiTr = async (i: number, src: keyof HomeBlock, dst: keyof HomeBlock) => { const v = String(blocks[i][src] || "").trim(); if (!v) return; const r = await translateOne(v); if (r) upd(i, { [dst]: r } as Partial<HomeBlock>); };

  const settings = (b: HomeBlock, i: number) => (
    <div className="mt-2 rounded-[12px] p-3" style={{ background: "color-mix(in srgb, var(--accent) 7%, var(--surface))", border: "1.5px dashed rgba(99,102,241,.6)" }}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12px] font-extrabold" style={{ color: "var(--accent)" }}>{fa ? "تنظیمات بلوک" : "Block settings"} — {b.type}</span>
        <button onClick={() => setOpenId(null)} className="cursor-pointer border-none bg-transparent text-[12px] font-bold" style={{ color: "var(--muted)" }}>{fa ? "بستن" : "Close"}</button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {b.type !== "spacer" && b.type !== "image" && b.type !== "products" && <>
          {fld(i, "titleFa", fa ? "عنوان فارسی" : "Title FA")}{fld(i, "titleEn", "Title EN", false, true)}
        </>}
        {(b.type === "hero" || b.type === "cta" || b.type === "richtext") && <>
          {fld(i, "textFa", fa ? "متن فارسی" : "Text FA", true)}{fld(i, "textEn", "Text EN", true, true)}
        </>}
        {(b.type === "hero" || b.type === "cta") && <>
          {fld(i, "btnFa", fa ? "متن دکمه فا" : "Button FA")}{fld(i, "btnEn", "Button EN", false, true)}
        </>}
        {(b.type === "products") && <>{fld(i, "titleFa", fa ? "عنوان فارسی" : "Title FA")}{fld(i, "titleEn", "Title EN", false, true)}</>}
        {(b.type === "hero" || b.type === "cta" || b.type === "image") && fld(i, "href", fa ? "لینک (مثلاً /shop?cat=tech)" : "Link", false, true)}
      </div>

      {b.type === "products" && (
        <div className="mt-2 flex flex-wrap gap-2">
          <select value={b.source || "featured"} onChange={(e) => upd(i, { source: e.target.value as HomeBlock["source"] })} className="rounded-[8px] px-2.5 py-1.5 text-[12.5px]" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>
            <option value="featured">{fa ? "ویژه" : "Featured"}</option>
            <option value="newest">{fa ? "جدیدترین" : "Newest"}</option>
            <option value="bestsellers">{fa ? "پرفروش" : "Best sellers"}</option>
            <option value="onsale">{fa ? "تخفیف‌دار" : "On sale"}</option>
          </select>
          {fld(i, "cat", fa ? "آیدی دسته (اختیاری)" : "Category id", false, true)}
        </div>
      )}

      {b.type === "image" && <div className="mt-2"><UploadButton accept="image/*" label={fa ? "آپلود تصویر" : "Upload image"} onUploaded={(url) => upd(i, { image: url })} />{b.image && <span className="ms-2 text-[11.5px]" style={{ color: "var(--accent)" }}>{fa ? "تصویر بارگذاری شد" : "uploaded"}</span>}</div>}

      {b.type === "spacer" && <label className="mt-2 flex items-center gap-2 text-[12.5px] font-bold">{fa ? "ارتفاع (px)" : "Height"}<input type="number" min={8} max={240} value={b.height || 40} onChange={(e) => upd(i, { height: Number(e.target.value) || 40 })} className="w-[80px] rounded-[8px] px-2 py-1 text-[12.5px]" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }} dir="ltr" /></label>}

      {b.type !== "spacer" && b.type !== "image" && b.type !== "products" && (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {(b.type === "hero" || b.type === "cta") && (
            <label className="flex items-center gap-2 text-[12.5px] font-bold">{fa ? "رنگ" : "Color"}
              <input type="checkbox" checked={(b.hue ?? -1) >= 0} onChange={(e) => upd(i, { hue: e.target.checked ? 255 : -1 })} style={{ accentColor: "var(--accent)" }} />
              {(b.hue ?? -1) >= 0 && <input type="range" min={0} max={360} value={b.hue} onChange={(e) => upd(i, { hue: Number(e.target.value) })} style={{ accentColor: `hsl(${b.hue} 70% 55%)` }} />}
            </label>
          )}
          <label className="flex items-center gap-2 text-[12.5px] font-bold">{fa ? "چینش" : "Align"}
            <select value={b.align || "start"} onChange={(e) => upd(i, { align: e.target.value as HomeBlock["align"] })} className="rounded-[8px] px-2 py-1 text-[12.5px]" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>
              <option value="start">{fa ? "راست/چپ" : "Start"}</option>
              <option value="center">{fa ? "وسط" : "Center"}</option>
            </select>
          </label>
          <button onClick={() => { aiTr(i, "titleFa", "titleEn"); aiTr(i, "textFa", "textEn"); aiTr(i, "btnFa", "btnEn"); }} className="cursor-pointer rounded-[8px] px-2.5 py-1 text-[12px] font-bold" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--accent)" }}>✨ {fa ? "ترجمه" : "Translate"}</button>
        </div>
      )}
    </div>
  );

  const ADD: { type: HomeBlockType; label: string }[] = [
    { type: "hero", label: fa ? "بنر بزرگ" : "Hero" },
    { type: "cta", label: fa ? "دعوت به اقدام" : "CTA" },
    { type: "richtext", label: fa ? "متن" : "Text" },
    { type: "image", label: fa ? "تصویر" : "Image" },
    { type: "products", label: fa ? "ردیف محصولات" : "Products" },
    { type: "spacer", label: fa ? "فاصله" : "Spacer" },
  ];

  return (
    <section className="mx-auto max-w-[1280px] px-[22px] py-4">
      {blocks.map((b, i) => (
        <div key={b.id} className="relative my-4">
          {editing && (
            <div className="absolute z-[15] flex items-center gap-1 rounded-[10px] p-1" style={{ insetInlineEnd: 8, top: 8, background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)" }}>
              <button onClick={() => move(i, -1)} title={fa ? "بالا" : "Up"} className="h-7 w-7 cursor-pointer rounded-[7px] border-none text-[13px] text-white" style={{ background: "rgba(255,255,255,.15)" }}>↑</button>
              <button onClick={() => move(i, 1)} title={fa ? "پایین" : "Down"} className="h-7 w-7 cursor-pointer rounded-[7px] border-none text-[13px] text-white" style={{ background: "rgba(255,255,255,.15)" }}>↓</button>
              <button onClick={() => setOpenId(openId === b.id ? null : b.id)} title={fa ? "تنظیمات" : "Settings"} className="h-7 cursor-pointer rounded-[7px] border-none px-2 text-[12px] font-bold text-white" style={{ background: "var(--accent)" }}>⚙ {fa ? "تنظیم" : "Edit"}</button>
              <button onClick={() => rm(i)} title={fa ? "حذف" : "Delete"} className="h-7 w-7 cursor-pointer rounded-[7px] border-none text-[13px] text-white" style={{ background: "#e11d48" }}>✕</button>
            </div>
          )}
          {view(b)}
          {editing && openId === b.id && settings(b, i)}
        </div>
      ))}
      {editing && (
        <div className="my-4 rounded-[14px] p-4" style={{ background: "color-mix(in srgb, var(--accent) 6%, var(--surface))", border: "1.5px dashed rgba(99,102,241,.6)" }}>
          <div className="mb-2 text-[12.5px] font-extrabold" style={{ color: "var(--accent)" }}>+ {fa ? "افزودن بلوک جدید" : "Add a block"}</div>
          <div className="flex flex-wrap gap-2">
            {ADD.map((a) => (
              <button key={a.type} onClick={() => add(a.type)} className="cursor-pointer rounded-[10px] px-3.5 py-2 text-[13px] font-bold" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>{a.label}</button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
