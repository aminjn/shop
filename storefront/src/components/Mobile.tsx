"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useShop } from "@/lib/store";
import { num } from "@/lib/format";
import { LocaleLink } from "./LocaleLink";
import { Search, Cart, User, Grid, Heart, Compare, Sun, Moon, ChevronDown, Close } from "./Icons";

/* ---- inline icons not in the icon set ---- */
function HomeIcon({ size = 22 }: { size?: number }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></svg>);
}
function Burger({ size = 24 }: { size?: number }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>);
}

const localeStrip = (p: string) => p.replace(/^\/(fa|en)(?=\/|$)/, "") || "/";

/* ===================== bottom navigation ===================== */
export function MobileNav() {
  const { locale, t, cartCount } = useShop();
  const pathname = usePathname();
  const here = localeStrip(pathname || "/");
  const items: { href: string; label: string; icon: React.ReactNode; match: (p: string) => boolean }[] = [
    { href: "/", label: t.navHome, icon: <HomeIcon />, match: (p) => p === "/" },
    { href: "/shop", label: locale === "fa" ? "فروشگاه" : "Shop", icon: <Grid size={22} />, match: (p) => p.startsWith("/shop") },
    { href: "/wishlist", label: t.wishlist, icon: <Heart size={22} />, match: (p) => p.startsWith("/wishlist") },
    { href: "/cart", label: t.cart, icon: <Cart size={22} />, match: (p) => p.startsWith("/cart") },
    { href: "/account", label: t.account, icon: <User size={22} />, match: (p) => p.startsWith("/account") || p.startsWith("/login") },
  ];
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[70] flex md:hidden"
      style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((it) => {
        const active = it.match(here);
        return (
          <LocaleLink key={it.href} href={it.href} className="relative flex flex-1 flex-col items-center gap-0.5 py-2 no-underline" style={{ color: active ? "var(--accent)" : "var(--muted)" }}>
            <span className="relative">
              {it.icon}
              {it.href === "/cart" && cartCount > 0 && (
                <span className="absolute flex h-[16px] min-w-[16px] items-center justify-center rounded-full px-1 text-[9.5px] font-extrabold text-white" style={{ top: -6, insetInlineEnd: -8, background: "var(--accent)" }}>{num(cartCount, locale)}</span>
              )}
            </span>
            <span className="text-[10.5px] font-bold">{it.label}</span>
          </LocaleLink>
        );
      })}
    </nav>
  );
}

/* ===================== hamburger + drawer ===================== */
export function MobileMenu() {
  const { locale, t, categories, menu, dark, toggleDark } = useShop();
  const [open, setOpen] = useState(false);
  const [exp, setExp] = useState<string | null>(null);
  const fa = locale === "fa";
  const cats = categories.filter((c) => !c.hidden);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const link = "flex items-center justify-between rounded-[10px] px-3 py-3 text-[15px] font-semibold no-underline";
  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="menu" className="flex h-[42px] w-[42px] items-center justify-center rounded-[10px] md:hidden" style={{ border: "1px solid var(--border)", color: "var(--text)" }}>
        <Burger size={22} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] md:hidden" onClick={() => setOpen(false)} style={{ background: "rgba(0,0,0,.5)" }}>
          <div
            className="absolute inset-y-0 flex w-[84%] max-w-[340px] flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{ insetInlineStart: 0, background: "var(--surface)", boxShadow: "0 0 40px rgba(0,0,0,.3)" }}
          >
            <div className="flex items-center justify-between border-b px-4 py-3.5" style={{ borderColor: "var(--border)" }}>
              <span className="text-[16px] font-extrabold">{fa ? "منو" : "Menu"}</span>
              <button onClick={() => setOpen(false)} aria-label="close" className="flex h-9 w-9 items-center justify-center rounded-[10px]" style={{ background: "var(--surface2)", color: "var(--text)" }}><Close size={18} /></button>
            </div>

            <div className="scrollthin flex-1 overflow-auto p-3">
              <LocaleLink href="/" onClick={() => setOpen(false)} className={link} style={{ color: "var(--text)" }}>{t.navHome}</LocaleLink>

              {/* categories with expandable subs */}
              {cats.map((c) => (
                <div key={c.id}>
                  <div className={link} style={{ color: "var(--text)" }}>
                    <LocaleLink href={`/shop?cat=${c.id}`} onClick={() => setOpen(false)} className="flex-1 no-underline" style={{ color: "var(--text)" }}>{fa ? c.fa : c.en}</LocaleLink>
                    {c.subs.length > 0 && (
                      <button onClick={() => setExp(exp === c.id ? null : c.id)} aria-label="expand" className="flex h-7 w-7 items-center justify-center rounded-[8px]" style={{ color: "var(--muted)" }}>
                        <span className="dir-flip" style={{ transform: exp === c.id ? "rotate(180deg)" : "none", transition: "transform .15s" }}><ChevronDown size={16} /></span>
                      </button>
                    )}
                  </div>
                  {exp === c.id && c.subs.length > 0 && (
                    <div className="mb-1 flex flex-col gap-0.5 ps-4">
                      {c.subs.map(([f1, e1], i) => (
                        <LocaleLink key={i} href={`/shop?cat=${c.id}`} onClick={() => setOpen(false)} className="rounded-[8px] px-3 py-2 text-[13.5px] no-underline" style={{ color: "var(--muted)" }}>{fa ? f1 : e1}</LocaleLink>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <LocaleLink href="/blog" onClick={() => setOpen(false)} className={link} style={{ color: "var(--text)" }}>{t.navBlog}</LocaleLink>
              {menu.map((m) => (
                /^https?:\/\//.test(m.href)
                  ? <a key={m.id} href={m.href} target="_blank" rel="noreferrer" className={link} style={{ color: "var(--text)" }}>{fa ? m.fa : m.en}</a>
                  : <LocaleLink key={m.id} href={m.href} onClick={() => setOpen(false)} className={link} style={{ color: "var(--text)" }}>{fa ? m.fa : m.en}</LocaleLink>
              ))}

              <div className="my-2 border-t" style={{ borderColor: "var(--border)" }} />
              <LocaleLink href="/compare" onClick={() => setOpen(false)} className={link} style={{ color: "var(--text)" }}><span className="flex items-center gap-2"><Compare size={18} /> {t.compare}</span></LocaleLink>
              <LocaleLink href="/wishlist" onClick={() => setOpen(false)} className={link} style={{ color: "var(--text)" }}><span className="flex items-center gap-2"><Heart size={18} /> {t.wishlist}</span></LocaleLink>
              <button onClick={() => { toggleDark(); }} className={`${link} w-full cursor-pointer border-none bg-transparent`} style={{ color: "var(--text)" }}>
                <span className="flex items-center gap-2">{dark ? <Sun size={18} /> : <Moon size={18} />} {fa ? (dark ? "حالت روشن" : "حالت تیره") : "Theme"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ===================== PWA: register SW + install banner ===================== */
interface BIPEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }>; }

export function PwaInstall() {
  const { locale } = useShop();
  const fa = locale === "fa";
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    // The old service worker cached JS cache-first and broke navigation, so we
    // no longer register one. Existing registrations auto-update to the
    // self-destructing /sw.js kill switch on their next load; also proactively
    // unregister any that are still around.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister())).catch(() => {});
    }
    if (typeof caches !== "undefined" && caches.keys) {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
    }
    const dismissed = localStorage.getItem("pwa_dismissed");
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as unknown as { standalone?: boolean }).standalone;
    if (standalone || dismissed) return;

    const onBIP = (e: Event) => { e.preventDefault(); setDeferred(e as BIPEvent); setShow(true); };
    window.addEventListener("beforeinstallprompt", onBIP);

    // iOS Safari has no beforeinstallprompt — show manual hint
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && /safari/i.test(navigator.userAgent);
    if (isIOS) { setIosHint(true); setShow(true); }

    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  const dismiss = () => { setShow(false); localStorage.setItem("pwa_dismissed", "1"); };
  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => {});
    setShow(false);
    localStorage.setItem("pwa_dismissed", "1");
  };

  if (!show) return null;
  return (
    <div className="fixed inset-x-0 z-[80] mx-auto max-w-[1280px] px-3" style={{ bottom: "calc(64px + env(safe-area-inset-bottom))" }}>
      <div className="flex items-center gap-3 rounded-[14px] p-3 shadow-lg" style={{ background: "var(--surface)", border: "1px solid var(--accent)" }}>
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[10px] text-white" style={{ background: "var(--accent)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="" className="h-7 w-7 rounded-[8px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-extrabold">{fa ? "نصب اپلیکیشن" : "Install app"}</div>
          <div className="truncate text-[11.5px]" style={{ color: "var(--muted)" }}>
            {iosHint ? (fa ? "دکمهٔ اشتراک‌گذاری → «افزودن به صفحهٔ اصلی»" : "Share → Add to Home Screen") : (fa ? "برای دسترسی سریع، روی گوشی نصبش کن" : "Add to your home screen")}
          </div>
        </div>
        {!iosHint && (
          <button onClick={install} className="flex-none cursor-pointer rounded-[10px] border-none px-4 py-2 text-[13px] font-extrabold text-white" style={{ background: "var(--accent)" }}>{fa ? "نصب" : "Install"}</button>
        )}
        <button onClick={dismiss} aria-label="close" className="flex-none cursor-pointer rounded-[10px] px-2 py-2" style={{ background: "var(--surface2)", color: "var(--text)" }}><Close size={16} /></button>
      </div>
    </div>
  );
}
