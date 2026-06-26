"use client";

import { useEffect, useState } from "react";
import type { HomeBlock } from "@/lib/home";
import { useShop } from "@/lib/store";
import { BlockEditor } from "./HomeBlocks";

/** Standalone, admin-editable block region for any page (shop, /p/<slug>, …). */
export function BlockCanvas({ blockKey }: { blockKey: string }) {
  const { locale, toast } = useShop();
  const fa = locale === "fa";
  const [canEdit, setCanEdit] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saved, setSaved] = useState<HomeBlock[] | null>(null);
  const [draft, setDraft] = useState<HomeBlock[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetch("/api/auth/me").then((r) => r.json()).then((d) => setCanEdit(d?.session?.role === "super_admin")).catch(() => {}); }, []);
  useEffect(() => {
    fetch(`/api/blocks?key=${encodeURIComponent(blockKey)}`).then((r) => r.json()).then((d) => { if (Array.isArray(d?.blocks)) setSaved(d.blocks); }).catch(() => {});
  }, [blockKey]);

  if (saved === null) return null;
  const blocks = editMode ? draft : saved;
  if (!blocks.length && !canEdit) return null;

  const enter = () => { setDraft(JSON.parse(JSON.stringify(saved))); setEditMode(true); };
  const cancel = () => { setEditMode(false); setDraft([]); };
  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/blocks", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ key: blockKey, blocks: draft }) });
      const d = await r.json();
      if (d.ok) { setSaved(d.blocks); setEditMode(false); toast(fa ? "ذخیره شد ✓" : "Saved ✓"); }
      else toast(fa ? "ذخیره ناموفق بود" : "Save failed");
    } catch { toast(fa ? "خطای شبکه" : "Error"); } finally { setSaving(false); }
  };

  return (
    <div onClickCapture={(e) => { if (editMode) { const a = (e.target as HTMLElement).closest("a"); if (a) e.preventDefault(); } }}>
      {canEdit && (
        <div className="mx-auto flex max-w-[1280px] items-center gap-2 px-[22px] pt-3">
          {!editMode ? (
            <button onClick={enter} className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border-none px-3.5 py-2 text-[12.5px] font-extrabold text-white" style={{ background: "var(--accent)" }}>✏️ {fa ? "ویرایش بلوک‌های این صفحه" : "Edit blocks"}</button>
          ) : (
            <>
              <span className="text-[12px] font-bold" style={{ color: "var(--accent)" }}>{fa ? "حالت ویرایش بلوک" : "Editing blocks"}</span>
              <button onClick={save} disabled={saving} className="cursor-pointer rounded-[10px] border-none px-3.5 py-2 text-[12.5px] font-extrabold text-white disabled:opacity-60" style={{ background: "var(--accent)" }}>{saving ? "…" : fa ? "ذخیره" : "Save"}</button>
              <button onClick={cancel} className="cursor-pointer rounded-[10px] px-3 py-2 text-[12.5px] font-bold" style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}>{fa ? "انصراف" : "Cancel"}</button>
            </>
          )}
        </div>
      )}
      <BlockEditor blocks={blocks} editing={editMode} onChange={setDraft} />
    </div>
  );
}
