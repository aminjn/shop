"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import type { Brand, CartLine, Category, Coupon, Locale, Product } from "./types";
import type { HomeContent } from "./home";
import { getDict, type Dict } from "@/i18n/dictionaries";
import { ROUNDNESS } from "./format";
import { PRODUCTS as SEED_PRODUCTS } from "@/data/products";
import { CATEGORIES as SEED_CATEGORIES } from "@/data/categories";

export interface MenuLink { id: string; fa: string; en: string; href: string; }

type Roundness = "sharp" | "soft" | "round";

interface ShopState {
  locale: Locale;
  t: Dict;
  dir: "rtl" | "ltr";
  // theme
  dark: boolean;
  toggleDark: () => void;
  accent: string;
  setAccent: (c: string) => void;
  roundness: Roundness;
  setRoundness: (r: Roundness) => void;
  // cart
  cart: CartLine[];
  addToCart: (id: number, qty?: number, color?: number, size?: number, variant?: number) => void;
  changeLine: (key: string, delta: number) => void;
  removeLine: (key: string) => void;
  clearCart: () => void;
  cartCount: number;
  // wishlist / compare
  wishlist: number[];
  toggleWish: (id: number) => void;
  compare: number[];
  toggleCompare: (id: number) => void;
  // coupon
  coupon: Coupon | null;
  setCoupon: (c: Coupon | null) => void;
  // toast
  toast: (msg: string) => void;
  toastMsg: string;
  // chat
  chatOpen: boolean;
  setChatOpen: (v: boolean) => void;
  // live catalog (defaults to the seed, refreshed from /api/products)
  products: Product[];
  productById: (id: number) => Product | undefined;
  // live taxonomy & navigation (admin-editable)
  categories: Category[];
  menu: MenuLink[];
  brands: Brand[];
  home: HomeContent | null;
  // store branding
  logoUrl: string;
}

const Ctx = createContext<ShopState | null>(null);

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem("shopx_" + key);
    return v == null ? fallback : (JSON.parse(v) as T);
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem("shopx_" + key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function ShopProvider({
  locale,
  accentColor = "#4f46e5",
  defaultRoundness = "soft",
  children,
}: {
  locale: Locale;
  accentColor?: string;
  defaultRoundness?: Roundness;
  children: React.ReactNode;
}) {
  const dir = (locale === "fa" ? "rtl" : "ltr") as "rtl" | "ltr";
  const [brand, setBrand] = useState<{ storeName?: string; currencyFa?: string; currencyEn?: string; logoUrl?: string; faviconUrl?: string }>({});
  const t = useMemo(() => {
    const base = getDict(locale);
    const currency = (locale === "fa" ? brand.currencyFa : brand.currencyEn) || base.currency;
    const storeName = brand.storeName || base.storeName;
    return { ...base, storeName, currency } as Dict;
  }, [locale, brand]);
  const logoUrl = brand.logoUrl || "";

  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(false);
  const [accent, setAccentState] = useState(accentColor);
  const [roundness, setRoundnessState] = useState<Roundness>(defaultRoundness);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [compare, setCompare] = useState<number[]>([]);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(SEED_CATEGORIES);
  const [menu, setMenu] = useState<MenuLink[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [home, setHome] = useState<HomeContent | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  // live data (admin-editable). `cache: "no-store"` stops the browser cache,
  // and a unique `?_=<ts>` query busts any CDN/edge (Arvan) cache so edits made
  // in the admin panel always show up without a hard refresh.
  const refreshData = useCallback(() => {
    const noStore: RequestInit = { cache: "no-store" };
    const bust = () => `?_=${Date.now()}`;
    // Mark these data updates as non-urgent so a fetch resolving mid-navigation
    // yields to the route transition instead of interrupting it (which made
    // links appear to need two clicks).
    fetch("/api/products" + bust(), noStore)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (Array.isArray(d?.products)) startTransition(() => setProducts(d.products)); })
      .catch(() => {});
    fetch("/api/categories" + bust(), noStore)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (Array.isArray(d?.categories) && d.categories.length) startTransition(() => setCategories(d.categories)); })
      .catch(() => {});
    fetch("/api/menu" + bust(), noStore)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (Array.isArray(d?.menu)) startTransition(() => setMenu(d.menu)); })
      .catch(() => {});
    fetch("/api/brands" + bust(), noStore)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (Array.isArray(d?.brands)) startTransition(() => setBrands(d.brands)); })
      .catch(() => {});
    fetch("/api/home" + bust(), noStore)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.home) startTransition(() => setHome(d.home)); })
      .catch(() => {});
  }, []);

  // hydrate from localStorage on mount
  useEffect(() => {
    setDark(load("dark", false));
    setAccentState(load("accent", accentColor));
    setRoundnessState(load("roundness", defaultRoundness));
    setCart(load("cart", []));
    setWishlist(load("wishlist", []));
    setCompare(load("compare", []));
    setMounted(true);
    // Refetch live data when the tab regains focus / becomes visible so edits
    // made in the admin panel show up on the site without a hard refresh.
    const onVisible = () => { if (document.visibilityState === "visible") refreshData(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refreshData);
    // apply store branding (name / currency / logo) saved in admin
    fetch("/api/settings/store", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.settings) return;
        setBrand({
          storeName: d.settings.storeName,
          currencyFa: d.settings.currencyFa,
          currencyEn: d.settings.currencyEn,
          logoUrl: d.settings.logoUrl,
          faviconUrl: d.settings.faviconUrl,
        });
        // apply the site-wide theme set in super admin, unless this visitor
        // has personally customized their accent/roundness (localStorage).
        if (d.settings.themeAccent && localStorage.getItem("shopx_accent") == null) {
          setAccentState(d.settings.themeAccent);
        }
        if (d.settings.themeRadius && localStorage.getItem("shopx_roundness") == null) {
          setRoundnessState(d.settings.themeRadius as Roundness);
        }
      })
      .catch(() => {});
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refreshData);
    };
  }, [accentColor, defaultRoundness, refreshData]);

  // Refetch live data after each client-side navigation so edits made in the
  // admin panel show up without a hard refresh. The fetch is deferred to a
  // macrotask so the route transition commits FIRST — running the setState
  // storm synchronously on pathname change interrupted Next's navigation and
  // made links appear to need two clicks.
  useEffect(() => {
    const id = setTimeout(refreshData, 0);
    return () => clearTimeout(id);
  }, [pathname, refreshData]);

  // reflect theme on <html> for SSR-safe theming via CSS vars
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.dataset.theme = dark ? "dark" : "light";
    root.style.setProperty("--accent", accent);
    root.style.setProperty("--radius", ROUNDNESS[roundness]);
  }, [dark, accent, roundness, mounted]);

  // live-apply favicon set in admin. Pages are prerendered with a build-time
  // icon, so on the client we remove every existing icon link and add the
  // uploaded one — guaranteeing it wins on the homepage and every page.
  useEffect(() => {
    if (!brand.faviconUrl) return;
    document.querySelectorAll("link[rel~='icon'],link[rel='shortcut icon']").forEach((l) => l.remove());
    const link = document.createElement("link");
    link.rel = "icon";
    link.href = brand.faviconUrl;
    document.head.appendChild(link);
  }, [brand.faviconUrl]);

  // keep the document title in sync with the store name on the client
  useEffect(() => {
    if (brand.storeName) {
      const base = getDict(locale);
      if (!document.title || document.title.includes(base.storeName)) {
        document.title = document.title.replace(base.storeName, brand.storeName) || brand.storeName;
      }
    }
  }, [brand.storeName, locale]);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(""), 2600);
  }, []);

  const toggleDark = useCallback(() => {
    setDark((d) => {
      save("dark", !d);
      return !d;
    });
  }, []);
  const setAccent = useCallback((c: string) => {
    setAccentState(c);
    save("accent", c);
  }, []);
  const setRoundness = useCallback((r: Roundness) => {
    setRoundnessState(r);
    save("roundness", r);
  }, []);

  const addToCart = useCallback(
    (id: number, qty = 1, color = 0, size = 0, variant = 0) => {
      const key = `${id}_${color}_${size}_${variant}`;
      setCart((prev) => {
        const next = [...prev];
        const i = next.findIndex((c) => c.key === key);
        if (i >= 0) next[i] = { ...next[i], qty: next[i].qty + qty };
        else next.push({ key, id, qty, color, size, variant });
        save("cart", next);
        return next;
      });
      toast(t.addedToCart);
    },
    [t.addedToCart, toast],
  );
  const changeLine = useCallback((key: string, delta: number) => {
    setCart((prev) => {
      const next = prev.map((c) =>
        c.key === key ? { ...c, qty: Math.max(1, c.qty + delta) } : c,
      );
      save("cart", next);
      return next;
    });
  }, []);
  const removeLine = useCallback((key: string) => {
    setCart((prev) => {
      const next = prev.filter((c) => c.key !== key);
      save("cart", next);
      return next;
    });
  }, []);
  const clearCart = useCallback(() => {
    setCart([]);
    save("cart", []);
  }, []);

  const toggleWish = useCallback(
    (id: number) => {
      setWishlist((prev) => {
        const has = prev.includes(id);
        const next = has ? prev.filter((x) => x !== id) : [...prev, id];
        save("wishlist", next);
        toast(
          has
            ? locale === "fa"
              ? "از علاقه‌مندی حذف شد"
              : "Removed from wishlist"
            : locale === "fa"
              ? "به علاقه‌مندی اضافه شد"
              : "Added to wishlist",
        );
        return next;
      });
    },
    [locale, toast],
  );
  const toggleCompare = useCallback(
    (id: number) => {
      setCompare((prev) => {
        if (!prev.includes(id) && prev.length >= 4) {
          toast(
            locale === "fa"
              ? "حداکثر ۴ محصول قابل مقایسه است"
              : "Max 4 products to compare",
          );
          return prev;
        }
        const next = prev.includes(id)
          ? prev.filter((x) => x !== id)
          : [...prev, id];
        save("compare", next);
        return next;
      });
    },
    [locale, toast],
  );

  const cartCount = useMemo(
    () => cart.reduce((s, c) => s + c.qty, 0),
    [cart],
  );

  const value: ShopState = {
    locale,
    t,
    dir,
    dark,
    toggleDark,
    accent,
    setAccent,
    roundness,
    setRoundness,
    cart,
    addToCart,
    changeLine,
    removeLine,
    clearCart,
    cartCount,
    wishlist,
    toggleWish,
    compare,
    toggleCompare,
    coupon,
    setCoupon,
    toast,
    toastMsg,
    chatOpen,
    setChatOpen,
    products,
    productById: (id: number) => products.find((p) => p.id === id),
    categories,
    menu,
    brands,
    home,
    logoUrl,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useShop() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useShop must be used within ShopProvider");
  return ctx;
}

/** Set the document title to "<page> | <store>" using the LIVE store name.
 *  Re-applies after navigation so the prerendered/default title can't stick. */
export function usePageTitle(title?: string) {
  const { t } = useShop();
  const store = t.storeName;
  useEffect(() => {
    const desired = title && title.trim() ? `${title} | ${store}` : store;
    document.title = desired;
    // guard against Next applying the prerendered metadata title a tick later
    const id = setTimeout(() => { if (document.title !== desired) document.title = desired; }, 50);
    return () => clearTimeout(id);
  }, [title, store]);
}
