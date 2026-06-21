"use client";

import { useEffect, useState } from "react";
import { useShop } from "@/lib/store";
import { num } from "@/lib/format";

export function Countdown() {
  const { t, locale } = useShop();
  const [end] = useState(() => Date.now() + 1000 * 60 * 60 * 8 + 1000 * 60 * 23);
  const [now, setNow] = useState(end);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(0, end - now);
  const h = Math.floor(diff / 3.6e6);
  const m = Math.floor((diff % 3.6e6) / 6e4);
  const s = Math.floor((diff % 6e4) / 1000);
  const pad = (n: number) => num(n, locale).padStart(2, locale === "fa" ? "۰" : "0");

  const cell = (val: string, label: string) => (
    <div
      className="min-w-[54px] rounded-[10px] py-2 text-center"
      style={{ background: "rgba(0,0,0,.25)" }}
    >
      <div className="text-[22px] font-extrabold">{val}</div>
      <div className="text-[10.5px] opacity-80">{label}</div>
    </div>
  );

  return (
    <div className="mt-3.5 flex gap-2">
      {cell(pad(h), t.hrs)}
      {cell(pad(m), t.min)}
      {cell(pad(s), t.sec)}
    </div>
  );
}
