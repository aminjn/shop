"use client";

import { useShop } from "@/lib/store";
import { ProductCard } from "@/components/ProductCard";
import { LocaleLink } from "@/components/LocaleLink";
import { Heart } from "@/components/Icons";

export default function WishlistPage() {
  const { t, wishlist, productById } = useShop();
  const items = wishlist.map((id) => productById(id)).filter(Boolean);

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-[600px] flex-col items-center px-[22px] py-20 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full" style={{ background: "var(--surface2)", color: "#e11d48" }}><Heart size={36} /></span>
        <h1 className="mt-5 text-[22px] font-extrabold">{t.emptyWish}</h1>
        <p className="mt-2 text-[14px]" style={{ color: "var(--muted)" }}>{t.emptyWishSub}</p>
        <LocaleLink href="/shop" className="mt-6 rounded-[12px] px-7 py-3.5 text-[15px] font-bold text-white no-underline" style={{ background: "var(--accent)" }}>{t.continueShopping}</LocaleLink>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] px-[22px] py-7">
      <h1 className="mb-5 text-[24px] font-extrabold tracking-tight">{t.wishlistTitle}</h1>
      <div className="grid grid-cols-2 gap-[18px] md:grid-cols-4">
        {items.map((p) => p && <ProductCard key={p.id} p={p} />)}
      </div>
    </div>
  );
}
