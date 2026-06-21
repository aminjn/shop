import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUser } from "@/lib/userstore";
import { addReview, getApprovedReviews, reviewStats } from "@/lib/reviews";

export async function GET(req: Request) {
  const id = Number(new URL(req.url).searchParams.get("productId"));
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ ok: true, reviews: [], stats: { avg: 0, count: 0 } });
  return NextResponse.json({ ok: true, reviews: getApprovedReviews(id), stats: reviewStats(id) });
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const productId = Number(b.productId);
  const rating = Number(b.rating);
  const text = String(b.text || "").trim();
  if (!Number.isFinite(productId) || productId <= 0) return NextResponse.json({ ok: false, error: "product-required" }, { status: 400 });
  if (!text) return NextResponse.json({ ok: false, error: "text-required" }, { status: 400 });

  // identity: prefer the logged-in customer's profile name
  const s = await getSession();
  let author = String(b.author || "").trim();
  let mobile: string | undefined;
  if (s) {
    mobile = s.mobile;
    const u = getUser(s.mobile);
    const nm = `${u.profile.firstName} ${u.profile.lastName}`.trim();
    if (nm) author = nm;
    if (!author) author = s.mobile.replace(/(\d{4})\d{3}(\d{4})/, "$1***$2");
  }
  if (!author) return NextResponse.json({ ok: false, error: "author-required" }, { status: 400 });

  const review = addReview({ productId, author, mobile, rating, text });
  return NextResponse.json({ ok: true, review });
}
