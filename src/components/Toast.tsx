"use client";

import { useShop } from "@/lib/store";
import { Check } from "./Icons";

export function Toast() {
  const { toastMsg } = useShop();
  if (!toastMsg) return null;
  return (
    <div
      className="anim-pop fixed bottom-7 z-[90] flex items-center gap-2.5 rounded-[13px] px-6 py-3.5 text-[14px] font-bold"
      style={{
        left: "50%",
        transform: "translateX(-50%)",
        background: "var(--text)",
        color: "var(--surface)",
        boxShadow: "0 14px 34px rgba(0,0,0,.3)",
      }}
    >
      <Check size={18} />
      {toastMsg}
    </div>
  );
}
