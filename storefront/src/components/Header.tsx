"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useShop } from "@/lib/store";
import { grad, priceFmt, num } from "@/lib/format";
import { LocaleLink } from "./LocaleLink";
import {
  Search,
  Sparkle,
  Compare,
  Heart,
  User,
  Cart,
  ChevronDown,
  Sun,
  Moon,
} from "./Icons";
import { MobileMenu } from "./Mobile";

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="absolute flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10.5px] font-extrabold text-white"
      style={{ top: -5, insetInlineEnd: -5, background: "var(--accent)" }}
    >
      {children}
    </span>
  );
}

const iconBtn =
  "flex h-[42px] w-[42px] items-center justify-center rounded-[10px] cursor-pointer relative";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    locale,
    t,
    toggleDark,
    dark,
    cartCount,
    wishlist,
    compare,
    setChatOpen,
    products,
    categories: CATEGORIES,
    menu,
    logoUrl,
  } = useShop();
  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [megaCat, setMegaCat] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setRole(d?.session?.role ?? null))
      .catch(() => setRole(null));
  }, []);

  const storeName = t.storeName;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { prods: [], cats: [], brands: [] };
    const prods = products.filter(
      (p) =>
        p.fa.toLowerCase().includes(q) ||
        p.en.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q),
    ).slice(0, 5);
    const cats = CATEGORIES.filter(
      (c) => c.fa.includes(q) || c.en.toLowerCase().includes(q),
    ).slice(0, 3);
    const brands = [...new Set(products.map((p) => p.brand))]
      .filter((b) => b.toLowerCase().includes(q))
      .slice(0, 3);
    return { prods, cats, brands };
  }, [query, products]);

  const runSearch = () => {
    const q = query.trim();
    if (!q) return;
    setShowSearch(false);
    router.push(`/${locale}/shop?q=${encodeURIComponent(q)}`);
  };

  const switchLang = () => {
    const next = locale === "fa" ? "en" : "fa";
    const rest = pathname.replace(/^\/(fa|en)/, "");
    router.push(`/${next}${rest || ""}`);
  };

  const mega = megaCat ? CATEGORIES.find((c) => c.id === megaCat) : null;

  return (
    <header
      className="sticky top-0 z-[60]"
      style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
    >
      {/* promo bar */}
      <div
        className="flex flex-wrap items-center justify-center gap-[18px] px-4 py-[9px] text-[13px] font-semibold text-white"
        style={{ background: "var(--accent)" }}
      >
        <span>{t.promoLeft}</span>
        <span className="opacity-50">•</span>
        <span>{t.promoRight}</span>
      </div>

      {/* main row */}
      <div className="mx-auto flex max-w-[1280px] items-center gap-3 px-4 py-3.5 md:gap-[22px] md:px-[22px]">
        <MobileMenu />
        <LocaleLink href="/" className="flex items-center gap-[11px] no-underline" style={{ color: "var(--text)" }}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={storeName} className="h-[38px] w-[38px] rounded-[11px] object-cover" />
          ) : (
            <span
              className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] text-[20px] font-extrabold text-white"
              style={{ background: "var(--accent)" }}
            >
              {storeName.charAt(0)}
            </span>
          )}
          <span className="text-[21px] font-extrabold tracking-tight">{storeName}</span>
        </LocaleLink>

        {/* search */}
        <div className="relative max-w-[560px] flex-1">
          <div
            className="flex h-[46px] items-center gap-2 rounded-[13px] px-3"
            style={{ background: "var(--surface2)", border: "1.5px solid var(--border)" }}
          >
            <Search size={19} style={{ color: "var(--muted)" }} />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSearch(true);
              }}
              onFocus={() => query && setShowSearch(true)}
              onBlur={() => setTimeout(() => setShowSearch(false), 150)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              placeholder={t.searchPh}
              className="h-full flex-1 border-none bg-transparent text-[14.5px] outline-none"
              style={{ color: "var(--text)" }}
            />
            <button
              onClick={runSearch}
              className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-[9px] border-none px-3 py-[7px] text-[12.5px] font-bold text-white"
              style={{ background: "var(--accent)" }}
            >
              <Sparkle size={15} />
              {t.aiSearch}
            </button>
          </div>

          {showSearch && query && (
            <div
              className="scrollthin anim-pop absolute z-[70] mt-1 max-h-[420px] w-full overflow-auto p-2"
              style={{
                insetInlineStart: 0,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                boxShadow: "0 20px 50px rgba(0,0,0,.18)",
              }}
            >
              {results.prods.length === 0 &&
              results.cats.length === 0 &&
              results.brands.length === 0 ? (
                <div className="p-[18px] text-center text-[13.5px]" style={{ color: "var(--muted)" }}>
                  {t.noResults}
                </div>
              ) : (
                <>
                  {results.prods.length > 0 && (
                    <div className="px-3 pb-1 pt-2 text-[11.5px] font-bold" style={{ color: "var(--muted)" }}>
                      {t.instantResults}
                    </div>
                  )}
                  {results.prods.map((p) => (
                    <LocaleLink
                      key={p.id}
                      href={`/product/${p.id}`}
                      className="row-hover flex w-full items-center gap-3 rounded-[10px] px-3 py-[9px] no-underline"
                      style={{ color: "var(--text)", textAlign: "start" }}
                    >
                      <span className="h-11 w-11 flex-none rounded-[9px]" style={{ background: grad(p.hue, dark) }} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-semibold">
                          {locale === "fa" ? p.fa : p.en}
                        </span>
                        <span className="block text-[12px]" style={{ color: "var(--muted)" }}>
                          {p.brand}
                        </span>
                      </span>
                      <span className="whitespace-nowrap text-[13px] font-bold" style={{ color: "var(--accent)" }}>
                        {priceFmt(p.price, locale, t.currency)}
                      </span>
                    </LocaleLink>
                  ))}
                  {results.cats.length > 0 && (
                    <div className="px-3 pb-1 pt-2 text-[11.5px] font-bold" style={{ color: "var(--muted)" }}>
                      {t.fCategory}
                    </div>
                  )}
                  {results.cats.map((c) => (
                    <LocaleLink
                      key={c.id}
                      href={`/shop?cat=${c.id}`}
                      className="row-hover flex w-full items-center gap-3 rounded-[10px] px-3 py-[9px] no-underline"
                      style={{ color: "var(--text)" }}
                    >
                      <span className="h-[34px] w-[34px] flex-none rounded-[9px]" style={{ background: grad(c.hue, dark) }} />
                      <span className="flex-1 text-[13.5px] font-semibold">
                        {locale === "fa" ? c.fa : c.en}
                      </span>
                    </LocaleLink>
                  ))}
                  {results.brands.length > 0 && (
                    <div className="px-3 pb-1 pt-2 text-[11.5px] font-bold" style={{ color: "var(--muted)" }}>
                      {t.fBrand}
                    </div>
                  )}
                  {results.brands.map((b) => (
                    <LocaleLink
                      key={b}
                      href={`/shop?brand=${encodeURIComponent(b)}`}
                      className="row-hover flex w-full items-center gap-3 rounded-[10px] px-3 py-[9px] no-underline"
                      style={{ color: "var(--text)" }}
                    >
                      <span
                        className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[9px] font-extrabold"
                        style={{ background: "var(--surface2)", color: "var(--accent)" }}
                      >
                        {b.charAt(0)}
                      </span>
                      <span className="flex-1 text-[13.5px] font-semibold">{b}</span>
                    </LocaleLink>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* controls */}
        <nav className="flex items-center gap-1">
          <button
            onClick={switchLang}
            title="language"
            className="hidden h-[42px] cursor-pointer rounded-[10px] px-3 text-[13px] font-bold md:block"
            style={{ border: "1px solid var(--border)", background: "none", color: "var(--text)" }}
          >
            {locale === "fa" ? "EN" : "فا"}
          </button>
          <button onClick={toggleDark} title="theme" className={`${iconBtn} hidden md:flex`} style={{ border: "1px solid var(--border)", color: "var(--text)" }}>
            {dark ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <LocaleLink href="/compare" title={t.compare} className={`${iconBtn} hidden md:flex`} style={{ border: "1px solid var(--border)", color: "var(--text)" }}>
            <Compare size={19} />
            {compare.length > 0 && <Badge>{num(compare.length, locale)}</Badge>}
          </LocaleLink>
          <LocaleLink href="/wishlist" title={t.wishlist} className={`${iconBtn} hidden md:flex`} style={{ border: "1px solid var(--border)", color: "var(--text)" }}>
            <Heart size={19} />
            {wishlist.length > 0 && <Badge>{num(wishlist.length, locale)}</Badge>}
          </LocaleLink>
          <LocaleLink href={role ? "/account" : "/login"} title={t.account} className={`${iconBtn} hidden md:flex`} style={{ border: "1px solid var(--border)", color: "var(--text)" }}>
            <User size={19} />
          </LocaleLink>
          <LocaleLink
            href="/cart"
            className="relative inline-flex h-[42px] items-center gap-2 rounded-[10px] px-4 text-[13.5px] font-bold text-white no-underline"
            style={{ background: "var(--accent)" }}
          >
            <Cart size={19} />
            <span>{t.cart}</span>
            {cartCount > 0 && (
              <span
                className="absolute flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10.5px] font-extrabold"
                style={{ top: -5, insetInlineEnd: -5, background: "var(--text)", color: "var(--surface)" }}
              >
                {num(cartCount, locale)}
              </span>
            )}
          </LocaleLink>
        </nav>
      </div>

      {/* nav row (desktop only) */}
      <div className="hidden md:block" style={{ borderTop: "1px solid var(--border)" }} onMouseLeave={() => setMegaCat(null)}>
        <div className="mx-auto flex h-12 max-w-[1280px] items-center gap-1 px-[22px]">
          <LocaleLink href="/" className="flex h-full items-center px-3.5 text-[14px] font-semibold no-underline" style={{ color: "var(--text)" }}>
            {t.navHome}
          </LocaleLink>
          {CATEGORIES.filter((c) => !c.hidden).map((c) => (
            <LocaleLink
              key={c.id}
              href={`/shop?cat=${c.id}`}
              onMouseEnter={() => setMegaCat(c.id)}
              className="link-accent flex h-full items-center gap-1.5 px-3.5 text-[14px] font-semibold no-underline"
              style={{ color: "var(--text)" }}
            >
              {locale === "fa" ? c.fa : c.en}
              <ChevronDown size={12} />
            </LocaleLink>
          ))}
          <LocaleLink href="/blog" className="flex h-full items-center px-3.5 text-[14px] font-semibold no-underline" style={{ color: "var(--text)" }}>
            {t.navBlog}
          </LocaleLink>
          {menu.map((m) =>
            /^https?:\/\//.test(m.href) ? (
              <a key={m.id} href={m.href} target="_blank" rel="noreferrer" className="flex h-full items-center px-3.5 text-[14px] font-semibold no-underline" style={{ color: "var(--text)" }}>
                {locale === "fa" ? m.fa : m.en}
              </a>
            ) : (
              <LocaleLink key={m.id} href={m.href} className="flex h-full items-center px-3.5 text-[14px] font-semibold no-underline" style={{ color: "var(--text)" }}>
                {locale === "fa" ? m.fa : m.en}
              </LocaleLink>
            ),
          )}
          <span className="flex-1" />
          {role === "super_admin" && (
            <LocaleLink
              href="/admin"
              className="link-accent inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-bold no-underline"
              style={{ border: "1px solid var(--border)", color: "var(--muted)" }}
            >
              {t.adminPanel}
            </LocaleLink>
          )}
        </div>

        {mega && (
          <div
            className="anim-pop absolute z-[55] w-full"
            style={{
              insetInlineStart: 0,
              background: "var(--surface)",
              borderTop: "1px solid var(--border)",
              borderBottom: "1px solid var(--border)",
              boxShadow: "0 24px 50px rgba(0,0,0,.16)",
            }}
          >
            <div className="mx-auto grid max-w-[1280px] grid-cols-[1fr_1fr_1fr_1.3fr] gap-[26px] px-[22px] py-6">
              {mega.subs.map(([fa, en], i) => (
                <LocaleLink
                  key={i}
                  href={`/shop?cat=${mega.id}`}
                  className="link-accent flex items-center gap-2 py-1.5 text-[14px] no-underline"
                  style={{ color: "var(--text)", textAlign: "start" }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }} />
                  {locale === "fa" ? fa : en}
                </LocaleLink>
              ))}
              <div
                className="flex min-h-[150px] flex-col justify-end rounded-[14px] p-[18px] text-white"
                style={{ background: grad(mega.hue, dark) }}
              >
                <div className="text-[12px] font-bold opacity-85">{t.megaPromo}</div>
                <div className="mt-1 text-[20px] font-extrabold">{locale === "fa" ? mega.fa : mega.en}</div>
                <LocaleLink
                  href={`/shop?cat=${mega.id}`}
                  className="mt-3 self-start rounded-[9px] bg-white px-4 py-2 text-[13px] font-bold no-underline"
                  style={{ color: "#111" }}
                >
                  {t.viewAll}
                </LocaleLink>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
