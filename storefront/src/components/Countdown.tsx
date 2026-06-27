"use client";

import { useEffect, useRef } from "react";
import { useShop } from "@/lib/store";
import { num } from "@/lib/format";

/** Decorative deal countdown. Updates the displayed time via DOM refs instead
 *  of React state so it never re-renders — a per-second setState here used to
 *  interrupt slow route transitions and make links feel like they need two
 *  clicks. */
export function Countdown() {
  const { t, locale } = useShop();
  const hRef = useRef<HTMLDivElement>(null);
  const mRef = useRef<HTMLDivElement>(null);
  const sRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const end = Date.now() + 1000 * 60 * 60 * 8 + 1000 * 60 * 23;
    const pad = (n: number) => num(n, locale).padStart(2, locale === "fa" ? "۰" : "0");
    const tick = () => {
      const diff = Math.max(0, end - Date.now());
      const h = Math.floor(diff / 3.6e6);
      const m = Math.floor((diff % 3.6e6) / 6e4);
      const s = Math.floor((diff % 6e4) / 1000);
      if (hRef.current) hRef.current.textContent = pad(h);
      if (mRef.current) mRef.current.textContent = pad(m);
      if (sRef.current) sRef.current.textContent = pad(s);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [locale]);

  const cell = (ref: React.RefObject<HTMLDivElement | null>, label: string) => (
    <div className="min-w-[54px] rounded-[10px] py-2 text-center" style={{ background: "rgba(0,0,0,.25)" }}>
      <div ref={ref} className="text-[22px] font-extrabold">--</div>
      <div className="text-[10.5px] opacity-80">{label}</div>
    </div>
  );

  return (
    <div className="mt-3.5 flex gap-2">
      {cell(hRef, t.hrs)}
      {cell(mRef, t.min)}
      {cell(sRef, t.sec)}
    </div>
  );
}
