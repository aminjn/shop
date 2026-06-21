"use client";

import { useRef, useState } from "react";
import { Download } from "./Icons";

export function UploadButton({
  accept = "image/*",
  label,
  onUploaded,
  multiple = false,
}: {
  accept?: string;
  label?: string;
  onUploaded: (url: string, kind: string) => void;
  multiple?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (files: FileList) => {
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const r = await fetch("/api/upload", { method: "POST", body: fd });
        const d = await r.json();
        if (d.ok) onUploaded(d.url, d.kind);
      }
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={busy}
        className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] px-4 py-2.5 text-[13px] font-bold disabled:opacity-60"
        style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}
      >
        <Download size={15} style={{ transform: "rotate(180deg)" }} />
        {busy ? "در حال آپلود…" : label || "آپلود فایل"}
      </button>
      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={(e) => e.target.files && e.target.files.length && upload(e.target.files)}
      />
    </>
  );
}
