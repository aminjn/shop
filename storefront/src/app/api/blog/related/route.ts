import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { relevantProducts } from "@/lib/ai";

/** Suggest catalog products relevant to a query (for the "related products"
 *  picker in the article editor). Admin-only; returns id + display fields. */
export async function GET(req: Request) {
  const s = await getSession();
  if (s?.role !== "super_admin") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const q = new URL(req.url).searchParams.get("q") || "";
  if (!q.trim()) return NextResponse.json({ ok: true, ids: [] });
  const prods = relevantProducts(q, "fa", 8);
  // relevantProducts returns url like /fa/product/<id>; extract the id
  const ids = prods.map((p) => Number(p.url.split("/").pop())).filter((n) => Number.isFinite(n));
  return NextResponse.json({ ok: true, ids });
}
