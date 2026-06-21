"use client";

import { useState } from "react";
import { useShop } from "@/lib/store";
import { Close } from "./Icons";

export function LogoutButton({
  to = "/",
  label,
  block = true,
}: {
  to?: string;
  label?: string;
  block?: boolean;
}) {
  const { locale } = useShop();
  const [busy, setBusy] = useState(false);
  const fa = locale === "fa";

  const logout = async () => {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    window.location.href = `/${locale}${to === "/" ? "" : to}`;
  };

  return (
    <button
      onClick={logout}
      disabled={busy}
      className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] border-none px-3.5 py-2.5 text-[13.5px] font-bold disabled:opacity-60"
      style={{
        width: block ? "100%" : undefined,
        justifyContent: block ? "flex-start" : "center",
        textAlign: "start",
        background: "transparent",
        color: "#e11d48",
      }}
    >
      <Close size={16} />
      {label ?? (fa ? "خروج از حساب" : "Log out")}
    </button>
  );
}
