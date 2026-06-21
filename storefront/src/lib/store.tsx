"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CartLine, Coupon, Locale } from "./types";
import { getDict, type Dict } from "@/i18n/dictionaries";
import { ROUNDNESS } from "./format";

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
  addToCart: (id: number, qty?: number, color?: number, size?: number) => void;
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
  const t = getDict(locale);
  const dir = (locale === "fa" ? "rtl" : "ltr") as "rtl" | "ltr";

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
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // hydrate from localStorage on mount
  useEffect(() => {
    setDark(load("dark", false));
    setAccentState(load("accent", accentColor));
    setRoundnessState(load("roundness", defaultRoundness));
    setCart(load("cart", []));
    setWishlist(load("wishlist", []));
    setCompare(load("compare", []));
    setMounted(true);
  }, [accentColor, defaultRoundness]);

  // reflect theme on <html> for SSR-safe theming via CSS vars
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.dataset.theme = dark ? "dark" : "light";
    root.style.setProperty("--accent", accent);
    root.style.setProperty("--radius", ROUNDNESS[roundness]);
  }, [dark, accent, roundness, mounted]);

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
    (id: number, qty = 1, color = 0, size = 0) => {
      const key = `${id}_${color}_${size}`;
      setCart((prev) => {
        const next = [...prev];
        const i = next.findIndex((c) => c.key === key);
        if (i >= 0) next[i] = { ...next[i], qty: next[i].qty + qty };
        else next.push({ key, id, qty, color, size });
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
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useShop() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useShop must be used within ShopProvider");
  return ctx;
}
