"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useShop } from "@/lib/store";
import { Sparkle } from "./Icons";

export function AiSearchBox({ examples }: { examples?: string[] }) {
  const router = useRouter();
  const { locale, t } = useShop();
  const [q, setQ] = useState("");

  const go = (text?: string) => {
    const query = (text ?? q).trim();
    if (!query) return;
    router.push(`/${locale}/shop?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="max-w-[640px]">
      <div
        className="flex gap-2.5 rounded-[16px] bg-white p-2"
        style={{ boxShadow: "0 14px 40px rgba(0,0,0,.18)" }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder={t.aiHeroPh}
          className="flex-1 border-none bg-transparent px-3 text-[15.5px] outline-none"
          style={{ color: "#111" }}
        />
        <button
          onClick={() => go()}
          className="inline-flex h-12 cursor-pointer items-center gap-2 whitespace-nowrap rounded-[11px] border-none px-[22px] text-[14.5px] font-extrabold text-white"
          style={{ background: "var(--accent)" }}
        >
          <Sparkle size={17} />
          {t.aiSearchFull}
        </button>
      </div>
      {examples && examples.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2.5">
          {examples.map((ex) => (
            <button
              key={ex}
              onClick={() => go(ex)}
              className="cursor-pointer rounded-full px-4 py-2 text-[13px] font-semibold text-white"
              style={{ background: "rgba(255,255,255,.18)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,.35)" }}
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
