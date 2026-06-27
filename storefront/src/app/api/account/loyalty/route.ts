import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUser, updateUser, uid, nowIso, notify } from "@/lib/userstore";
import { readLoyalty, tierFor } from "@/lib/settings";

/** Member's loyalty status + the program config (tiers/benefits). */
export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const u = getUser(s.mobile);
  const cfg = readLoyalty();
  const tier = tierFor(u.points, cfg);
  return NextResponse.json({ ok: true, points: u.points, tier, loyalty: cfg });
}

/** Redeem points -> wallet credit. */
export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const cfg = readLoyalty();
  if (!cfg.enabled || !cfg.redeemEnabled) return NextResponse.json({ ok: false, error: "redeem-disabled" }, { status: 400 });
  const b = await req.json().catch(() => ({}));
  const want = Math.max(0, Math.floor(Number(b.points) || 0));
  if (!want) return NextResponse.json({ ok: false, error: "invalid-amount" }, { status: 400 });
  if (want < cfg.redeemMinPoints) return NextResponse.json({ ok: false, error: "below-min" }, { status: 400 });

  let error = "";
  const u = updateUser(s.mobile, (u) => {
    if (u.points < want) { error = "insufficient-points"; return; }
    const credit = want * cfg.pointValue;
    u.points -= want;
    u.wallet.balance += credit;
    u.wallet.txns.unshift({ id: uid(), type: "topup", amount: credit, date: nowIso(), note: "تبدیل امتیاز وفاداری" });
    notify(u, `${want.toLocaleString("fa-IR")} امتیاز به ${credit.toLocaleString("fa-IR")} تومان اعتبار کیف پول تبدیل شد.`);
  });
  if (error) return NextResponse.json({ ok: false, error }, { status: 400 });
  return NextResponse.json({ ok: true, user: u });
}
