import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { updateUser, uid, nowIso, notify } from "@/lib/userstore";

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const action = b.action as "topup" | "withdraw";
  const amount = Math.max(0, Math.floor(Number(b.amount) || 0));
  if (!amount) return NextResponse.json({ ok: false, error: "invalid-amount" }, { status: 400 });

  let error = "";
  const u = updateUser(s.mobile, (u) => {
    if (action === "withdraw") {
      if (u.wallet.balance < amount) { error = "insufficient"; return; }
      u.wallet.balance -= amount;
      u.wallet.txns.unshift({ id: uid(), type: "withdraw", amount, date: nowIso() });
      notify(u, `برداشت ${amount.toLocaleString("fa-IR")} تومان از کیف پول انجام شد.`);
    } else {
      u.wallet.balance += amount;
      u.wallet.txns.unshift({ id: uid(), type: "topup", amount, date: nowIso() });
      notify(u, `کیف پول شما ${amount.toLocaleString("fa-IR")} تومان شارژ شد.`);
    }
  });
  if (error) return NextResponse.json({ ok: false, error }, { status: 400 });
  return NextResponse.json({ ok: true, user: u });
}
