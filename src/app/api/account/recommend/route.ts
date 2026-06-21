import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUser } from "@/lib/userstore";
import { getCatalog } from "@/lib/catalog";
import { catById } from "@/data/categories";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const u = getUser(s.mobile);
  const products = getCatalog();

  const boughtIds = new Set(u.orders.flatMap((o) => o.items.map((i) => i.id)));
  const boughtCats = new Set(
    [...boughtIds].map((id) => products.find((p) => p.id === id)?.cat).filter(Boolean) as string[],
  );

  const pool = products.filter((p) => !boughtIds.has(p.id));
  const ranked = pool
    .map((p) => {
      let s2 = p.rating;
      if (boughtCats.has(p.cat)) s2 += 3; // same category as past purchases
      if (p.old) s2 += 0.5; // on sale
      return { p, s: s2 };
    })
    .sort((a, b) => b.s - a.s)
    .slice(0, 4);

  const recs = ranked.map(({ p }) => {
    const cat = catById(p.cat);
    const reason = boughtCats.has(p.cat)
      ? `چون قبلاً از دستهٔ «${cat?.fa ?? ""}» خرید کرده‌اید`
      : p.old
        ? "پیشنهاد ویژه با تخفیف و امتیاز بالا"
        : "پرفروش و محبوب بین کاربران مشابه شما";
    return { id: p.id, reason };
  });

  return NextResponse.json({ ok: true, recommendations: recs });
}
