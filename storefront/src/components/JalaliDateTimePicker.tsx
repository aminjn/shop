"use client";

import { useEffect, useState } from "react";
import {
  JALALI_MONTHS,
  jalaliMonthLength,
  jalaliToDate,
  dateToJalaliParts,
  jalaliYearNow,
} from "@/lib/jalali";

const faNum = (n: number) => n.toLocaleString("fa-IR", { useGrouping: false });

/** Shamsi date+time selector. Emits a Gregorian ISO string via onChange. */
export function JalaliDateTimePicker({
  value,
  onChange,
}: {
  value?: string;
  onChange: (iso: string) => void;
}) {
  const init = () => {
    const base = value ? new Date(value) : new Date(Date.now() + 60 * 60 * 1000);
    return dateToJalaliParts(base);
  };
  const [p, setP] = useState(init);

  // keep parent in sync
  useEffect(() => {
    const iso = jalaliToDate(p.jy, p.jm, p.jd, p.h, p.mi).toISOString();
    onChange(iso);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.jy, p.jm, p.jd, p.h, p.mi]);

  const set = (k: "jy" | "jm" | "jd" | "h" | "mi", v: number) =>
    setP((s) => {
      const next = { ...s, [k]: v };
      const maxD = jalaliMonthLength(next.jy, next.jm);
      if (next.jd > maxD) next.jd = maxD;
      return next;
    });

  const yNow = jalaliYearNow();
  const years = Array.from({ length: 4 }, (_, i) => yNow + i);
  const days = Array.from({ length: jalaliMonthLength(p.jy, p.jm) }, (_, i) => i + 1);
  const sel = "rounded-[10px] px-2 py-2.5 text-[13.5px] outline-none";
  const style = { background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" } as const;

  return (
    <div className="flex flex-wrap gap-2" dir="rtl">
      <select className={sel} style={style} value={p.jd} onChange={(e) => set("jd", +e.target.value)}>
        {days.map((d) => <option key={d} value={d}>{faNum(d)}</option>)}
      </select>
      <select className={`${sel} flex-1`} style={style} value={p.jm} onChange={(e) => set("jm", +e.target.value)}>
        {JALALI_MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
      </select>
      <select className={sel} style={style} value={p.jy} onChange={(e) => set("jy", +e.target.value)}>
        {years.map((y) => <option key={y} value={y}>{faNum(y)}</option>)}
      </select>
      <span className="self-center text-[13px]" style={{ color: "var(--muted)" }}>ساعت</span>
      <select className={sel} style={style} value={p.h} onChange={(e) => set("h", +e.target.value)}>
        {Array.from({ length: 24 }, (_, i) => i).map((h) => <option key={h} value={h}>{faNum(h).padStart(2, "۰")}</option>)}
      </select>
      <span className="self-center">:</span>
      <select className={sel} style={style} value={p.mi - (p.mi % 5)} onChange={(e) => set("mi", +e.target.value)}>
        {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => <option key={m} value={m}>{faNum(m).padStart(2, "۰")}</option>)}
      </select>
    </div>
  );
}
