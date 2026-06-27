import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAllReviews, saveReviews, type ReviewStatus } from "@/lib/reviews";
import { readLoyalty } from "@/lib/settings";
import { updateUser, notify } from "@/lib/userstore";

export async function GET() {
  const s = await getSession();
  if (s?.role !== "super_admin") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  return NextResponse.json({ ok: true, reviews: getAllReviews() });
}

export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "super_admin") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const id = Number(b.id);
  const action = String(b.action || "");
  let list = getAllReviews();

  if (action === "delete") {
    list = list.filter((r) => r.id !== id);
  } else {
    const r = list.find((x) => x.id === id);
    if (!r) return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });
    if (action === "approve" || action === "reject" || action === "pending") {
      const map = { approve: "approved", reject: "rejected", pending: "pending" } as const;
      r.status = map[action] as ReviewStatus;
      // award loyalty points once, the first time a review is approved
      if (action === "approve" && !r.pointsAwarded && r.mobile) {
        const loy = readLoyalty();
        if (loy.enabled && loy.reviewBonus > 0) {
          r.pointsAwarded = true;
          updateUser(r.mobile, (u) => {
            u.points += loy.reviewBonus;
            notify(u, `${loy.reviewBonus.toLocaleString("fa-IR")} امتیاز بابت تأیید نظر شما اضافه شد.`);
          });
        }
      }
    } else if (action === "reply") {
      r.reply = String(b.reply || "").slice(0, 1000) || undefined;
    } else {
      return NextResponse.json({ ok: false, error: "unknown-action" }, { status: 400 });
    }
  }
  saveReviews(list);
  return NextResponse.json({ ok: true, reviews: getAllReviews() });
}
