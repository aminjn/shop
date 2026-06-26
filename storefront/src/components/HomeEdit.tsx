"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { HomeContent, BiText } from "@/lib/home";
import { useShop } from "@/lib/store";
import { translateOne } from "@/lib/aitranslate";

type BiKey = {
  [K in keyof HomeContent]: HomeContent[K] extends BiText ? K : never;
}[keyof HomeContent];
type NumKey = "heroHue" | "bannerHue" | "promoAHue";
type ListKey = "examples" | "features" | "testimonials" | "faqs" | "blocks";

interface EditState {
  canEdit: boolean;
  editMode: boolean;
  enter: () => void;
  cancel: () => void;
  save: () => Promise<void>;
  saving: boolean;
  dirty: boolean;
  content: HomeContent | null; // what the page should render (draft while editing)
  locale: "fa" | "en";
  setField: (k: BiKey, val: string) => void;
  setNum: (k: NumKey, val: number) => void;
  updateList: (k: ListKey, list: unknown[]) => void;
}

const Ctx = createContext<EditState | null>(null);
export const useHomeEdit = () => useContext(Ctx);

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

export function HomeEditProvider({ children }: { children: React.ReactNode }) {
  const { locale, home: storeHome, toast } = useShop();
  const [canEdit, setCanEdit] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<HomeContent | null>(null);
  const [local, setLocal] = useState<HomeContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setCanEdit(d?.session?.role === "super_admin")).catch(() => {});
  }, []);
  // keep a local mirror of the live content when not actively editing
  useEffect(() => { if (storeHome && !editMode) setLocal(storeHome); }, [storeHome, editMode]);

  const enter = useCallback(() => {
    const base = local || storeHome;
    if (!base) { toast(locale === "fa" ? "هنوز در حال بارگذاری…" : "Loading…"); return; }
    setDraft(clone(base));
    setDirty(false);
    setEditMode(true);
  }, [local, storeHome, locale, toast]);

  const cancel = useCallback(() => { setEditMode(false); setDraft(null); setDirty(false); }, []);

  const save = useCallback(async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const r = await fetch("/api/home", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ home: draft }) });
      const d = await r.json();
      if (d.ok) { setLocal(d.home); setEditMode(false); setDraft(null); setDirty(false); toast(locale === "fa" ? "صفحه ذخیره شد ✓" : "Saved ✓"); }
      else toast(locale === "fa" ? "ذخیره ناموفق بود" : "Save failed");
    } catch { toast(locale === "fa" ? "خطای شبکه" : "Error"); } finally { setSaving(false); }
  }, [draft, locale, toast]);

  const setField = useCallback((k: BiKey, val: string) => {
    setDirty(true);
    setDraft((d) => (d ? { ...d, [k]: { ...(d[k] as BiText), [locale]: val } } : d));
  }, [locale]);
  const setNum = useCallback((k: NumKey, val: number) => { setDirty(true); setDraft((d) => (d ? { ...d, [k]: val } : d)); }, []);
  const updateList = useCallback((k: ListKey, list: unknown[]) => { setDirty(true); setDraft((d) => (d ? { ...d, [k]: list } : d)); }, []);

  const value: EditState = {
    canEdit, editMode, enter, cancel, save, saving, dirty,
    content: editMode ? draft : (local || storeHome),
    locale, setField, setNum, updateList,
  };
  return <Ctx.Provider value={value}>{children}{canEdit && <Toolbar />}</Ctx.Provider>;
}

/* ---- inline-editable text ---- */
export function Ed({ k, fallback, as: Tag = "span", className, style, multiline }: {
  k: BiKey; fallback: string; as?: React.ElementType; className?: string; style?: React.CSSProperties; multiline?: boolean;
}) {
  const ctx = useHomeEdit();
  const cur = ctx?.content ? (ctx.content[k] as BiText) : undefined;
  const v = cur ? cur[ctx!.locale] : "";
  const display = v && v.trim() ? v : fallback;
  if (!ctx?.editMode) return <Tag className={className} style={style}>{display}</Tag>;
  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      dir={ctx.locale === "fa" ? "rtl" : "ltr"}
      onBlur={(e: React.FocusEvent<HTMLElement>) => ctx.setField(k, (e.currentTarget.textContent || "").replace(/\n/g, multiline ? "\n" : " ").trim())}
      onKeyDown={(e: React.KeyboardEvent) => { if (!multiline && e.key === "Enter") { e.preventDefault(); (e.currentTarget as HTMLElement).blur(); } }}
      title={ctx.locale === "fa" ? "کلیک کن و ویرایش کن" : "Click to edit"}
      className={className}
      style={{ ...style, outline: "1.5px dashed rgba(99,102,241,.85)", outlineOffset: 3, borderRadius: 4, cursor: "text", minWidth: 24, display: "inline-block" }}
    >
      {display}
    </Tag>
  );
}

/* ---- inline hue color control ---- */
export function HueEdit({ k }: { k: NumKey }) {
  const ctx = useHomeEdit();
  const [open, setOpen] = useState(false);
  if (!ctx?.editMode) return null;
  const val = (ctx.content?.[k] as number) ?? -1;
  const on = typeof val === "number" && val >= 0;
  const fa = ctx.locale === "fa";
  return (
    <div className="absolute z-[20]" style={{ insetInlineEnd: 10, top: 10 }} onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setOpen((o) => !o)} className="flex h-8 cursor-pointer items-center gap-1.5 rounded-[8px] border-none px-2.5 text-[12px] font-bold text-white" style={{ background: "rgba(0,0,0,.55)", backdropFilter: "blur(4px)" }}>🎨 {fa ? "رنگ" : "Color"}</button>
      {open && (
        <div className="mt-1.5 rounded-[10px] p-3 shadow-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)", width: 220 }}>
          <label className="mb-2 flex cursor-pointer items-center gap-2 text-[12.5px] font-bold" style={{ color: "var(--text)" }}>
            <input type="checkbox" checked={on} onChange={(e) => ctx.setNum(k, e.target.checked ? 255 : -1)} style={{ accentColor: "var(--accent)" }} />
            {fa ? "رنگ سفارشی" : "Custom color"}
          </label>
          {on && (
            <div className="flex items-center gap-2">
              <span className="h-7 w-7 flex-none rounded-[7px]" style={{ background: `hsl(${val} 70% 55%)`, border: "1px solid var(--border)" }} />
              <input type="range" min={0} max={360} value={val} onChange={(e) => ctx.setNum(k, Number(e.target.value))} className="h-2 flex-1 cursor-pointer" style={{ accentColor: `hsl(${val} 70% 55%)` }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---- inline list editor (examples / features / testimonials / faqs) ---- */
export function ListEdit({ kind }: { kind: ListKey }) {
  const ctx = useHomeEdit();
  if (!ctx?.editMode || !ctx.content) return null;
  const fa = ctx.locale === "fa";
  const rows = (ctx.content[kind] as unknown as Record<string, unknown>[]) || [];
  const set = (l: unknown[]) => ctx.updateList(kind, l);
  const upd = (i: number, patch: Record<string, unknown>) => set(rows.map((r, x) => (x === i ? { ...r, ...patch } : r)));
  const rm = (i: number) => set(rows.filter((_, x) => x !== i));
  const add = () => {
    const blank =
      kind === "examples" ? { fa: "", en: "" }
      : kind === "features" ? { icon: "⭐", fa: "", faSub: "", en: "", enSub: "" }
      : kind === "testimonials" ? { fa: "", faText: "", en: "", enText: "", rating: 5 }
      : { qFa: "", aFa: "", qEn: "", aEn: "" };
    set([...rows, blank]);
  };
  const aiTr = async (i: number, src: string, dst: string) => { const v = String(rows[i][src] || "").trim(); if (!v) return; const r = await translateOne(v); if (r) upd(i, { [dst]: r }); };
  const inp = (i: number, key: string, ph: string, area = false) => {
    const Tag = (area ? "textarea" : "input") as React.ElementType;
    return <Tag value={String(rows[i][key] ?? "")} placeholder={ph} dir={/En$|^en$/.test(key) ? "ltr" : undefined} onChange={(e: React.ChangeEvent<HTMLInputElement>) => upd(i, { [key]: e.target.value })} className="w-full rounded-[8px] px-2.5 py-1.5 text-[12.5px] outline-none" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }} />;
  };
  return (
    <div className="my-4 rounded-[12px] p-3" style={{ background: "color-mix(in srgb, var(--accent) 6%, var(--surface))", border: "1.5px dashed rgba(99,102,241,.6)" }}>
      <div className="mb-2 text-[12.5px] font-extrabold" style={{ color: "var(--accent)" }}>{fa ? "ویرایش این بخش" : "Edit this block"}</div>
      <div className="flex flex-col gap-2">
        {rows.map((_, i) => (
          <div key={i} className="rounded-[10px] p-2.5" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
            <div className="mb-1.5 flex items-center justify-between"><span className="text-[11px] font-bold" style={{ color: "var(--muted)" }}>#{i + 1}</span><button onClick={() => rm(i)} className="cursor-pointer border-none bg-transparent text-[11.5px] font-bold" style={{ color: "#e11d48" }}>{fa ? "حذف" : "Remove"}</button></div>
            {kind === "examples" && <div className="grid gap-1.5 sm:grid-cols-2">{inp(i, "fa", fa ? "فارسی" : "FA")}{inp(i, "en", "EN")}</div>}
            {kind === "features" && <div className="grid gap-1.5 sm:grid-cols-2">{inp(i, "icon", fa ? "آیکن" : "Icon")}<span />{inp(i, "fa", fa ? "عنوان فا" : "Title FA")}{inp(i, "faSub", fa ? "زیرنویس فا" : "Sub FA")}{inp(i, "en", "Title EN")}{inp(i, "enSub", "Sub EN")}</div>}
            {kind === "testimonials" && <div className="grid gap-1.5 sm:grid-cols-2">{inp(i, "fa", fa ? "نام فا" : "Name FA")}{inp(i, "en", "Name EN")}{inp(i, "faText", fa ? "متن فا" : "Text FA", true)}{inp(i, "enText", "Text EN", true)}<label className="flex items-center gap-1.5 text-[12px] font-bold" style={{ color: "var(--text)" }}>{fa ? "امتیاز" : "Rating"}<input type="number" min={1} max={5} value={Number(rows[i].rating ?? 5)} onChange={(e) => upd(i, { rating: Math.min(5, Math.max(1, Number(e.target.value) || 5)) })} className="w-[60px] rounded-[8px] px-2 py-1 text-[12px]" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }} dir="ltr" /></label><button onClick={() => { aiTr(i, "fa", "en"); aiTr(i, "faText", "enText"); }} className="cursor-pointer rounded-[7px] px-2 py-1 text-[11.5px] font-bold" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--accent)" }}>✨ {fa ? "ترجمه" : "Translate"}</button></div>}
            {kind === "faqs" && <div className="grid gap-1.5">{inp(i, "qFa", fa ? "سوال فا" : "Q FA")}{inp(i, "aFa", fa ? "پاسخ فا" : "A FA", true)}{inp(i, "qEn", "Q EN")}{inp(i, "aEn", "A EN", true)}<button onClick={() => { aiTr(i, "qFa", "qEn"); aiTr(i, "aFa", "aEn"); }} className="cursor-pointer self-start rounded-[7px] px-2 py-1 text-[11.5px] font-bold" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--accent)" }}>✨ {fa ? "ترجمه" : "Translate"}</button></div>}
          </div>
        ))}
        <button onClick={add} className="cursor-pointer self-start rounded-[9px] px-3 py-1.5 text-[12.5px] font-bold" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>+ {fa ? "افزودن" : "Add"}</button>
      </div>
    </div>
  );
}

/* ---- floating toolbar ---- */
function Toolbar() {
  const ctx = useHomeEdit()!;
  const fa = ctx.locale === "fa";
  return (
    <div className="fixed z-[120] flex items-center gap-2 rounded-[14px] p-2 shadow-xl" style={{ insetInlineStart: 16, bottom: "calc(16px + env(safe-area-inset-bottom))", background: "var(--surface)", border: "1px solid var(--border)" }}>
      {!ctx.editMode ? (
        <button onClick={ctx.enter} className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border-none px-4 py-2.5 text-[13.5px] font-extrabold text-white" style={{ background: "var(--accent)" }}>✏️ {fa ? "ویرایش صفحه" : "Edit page"}</button>
      ) : (
        <>
          <span className="px-1 text-[12.5px] font-bold" style={{ color: "var(--accent)" }}>{fa ? "حالت ویرایش" : "Editing"}{ctx.dirty ? " •" : ""}</span>
          <button onClick={ctx.save} disabled={ctx.saving} className="cursor-pointer rounded-[10px] border-none px-4 py-2.5 text-[13.5px] font-extrabold text-white disabled:opacity-60" style={{ background: "var(--accent)" }}>{ctx.saving ? "…" : fa ? "ذخیره" : "Save"}</button>
          <button onClick={ctx.cancel} className="cursor-pointer rounded-[10px] px-3 py-2.5 text-[13px] font-bold" style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}>{fa ? "انصراف" : "Cancel"}</button>
        </>
      )}
    </div>
  );
}
