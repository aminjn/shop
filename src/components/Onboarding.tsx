"use client";

import { useEffect, useState } from "react";
import { useShop } from "@/lib/store";
import { Sparkle, Close } from "./Icons";

export function Onboarding() {
  const { t, setChatOpen } = useShop();
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("shopx_onboard") == null) setShow(true);
    } catch {
      /* ignore */
    }
  }, []);

  const close = () => {
    try {
      localStorage.setItem("shopx_onboard", "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  if (!show) return null;
  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center p-5"
      style={{ background: "rgba(0,0,0,.5)" }}
      onClick={close}
    >
      <div
        className="anim-pop relative w-full max-w-[440px] rounded-[20px] p-8 text-center"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          aria-label="close"
          className="absolute top-4 flex h-8 w-8 items-center justify-center rounded-full border-none"
          style={{ insetInlineEnd: 16, background: "var(--surface2)", color: "var(--muted)", cursor: "pointer" }}
        >
          <Close size={16} />
        </button>
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-[18px] text-white"
          style={{ background: "var(--accent)" }}
        >
          <Sparkle size={32} />
        </div>
        <h2 className="mt-4 text-[22px] font-extrabold">{t.onboardTitle}</h2>
        <p className="mt-2 text-[14px] leading-relaxed" style={{ color: "var(--muted)" }}>
          {t.onboardText}
        </p>
        <button
          onClick={() => {
            close();
            setChatOpen(true);
          }}
          className="mt-6 w-full cursor-pointer rounded-[12px] border-none py-3.5 text-[15px] font-extrabold text-white"
          style={{ background: "var(--accent)" }}
        >
          {t.onboardStart}
        </button>
      </div>
    </div>
  );
}
