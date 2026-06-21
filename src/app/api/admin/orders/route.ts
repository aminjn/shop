import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listUsers } from "@/lib/settings";
import { getUser, updateUser, notify, type OrderStatus } from "@/lib/userstore";

export async function GET() {
  const s = await getSession();
  if (s?.role !== "super_admin") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const orders = listUsers().flatMap((m) => {
    const u = getUser(m);
    const name = `${u.profile.firstName} ${u.profile.lastName}`.trim() || u.mobile;
    return u.orders.map((o) => ({ ...o, mobile: u.mobile, customer: name }));
  });
  orders.sort((a, b) => (a.date < b.date ? 1 : -1));
  return NextResponse.json({ ok: true, orders });
}

export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "super_admin") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const mobile = String(b.mobile || "");
  const orderId = String(b.orderId || "");
  const status = b.status as OrderStatus;
  if (!["processing", "shipped", "delivered", "cancelled"].includes(status))
    return NextResponse.json({ ok: false, error: "bad-status" }, { status: 400 });

  updateUser(mobile, (u) => {
    const o = u.orders.find((x) => x.id === orderId);
    if (o) {
      o.status = status;
      const fa: Record<string, string> = { processing: "در حال پردازش", shipped: "ارسال شد", delivered: "تحویل شد", cancelled: "لغو شد" };
      notify(u, `وضعیت سفارش #${orderId} به «${fa[status]}» تغییر کرد.`);
    }
  });
  return NextResponse.json({ ok: true });
}
