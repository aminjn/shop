import { NextResponse } from "next/server";
import { getSession, superAdminMobile, isSuperAdmin } from "@/lib/auth";
import { listUsers } from "@/lib/settings";
import { getUser, updateUser, deleteUser, notify, uid, nowIso } from "@/lib/userstore";

function row(mobile: string, admin: string) {
  const u = getUser(mobile);
  const spent = u.orders.reduce((sum, o) => (o.status !== "cancelled" ? sum + o.total : sum), 0);
  const lastOrder = u.orders[0]?.date || "";
  return {
    mobile: u.mobile,
    name: `${u.profile.firstName} ${u.profile.lastName}`.trim(),
    email: u.profile.email,
    status: u.status === "blocked" ? "blocked" : "active",
    orders: u.orders.length,
    spent,
    points: u.points,
    wallet: u.wallet.balance,
    addresses: u.addresses.length,
    joined: u.createdAt,
    lastOrder,
    role: u.mobile === admin ? "admin" : "customer",
    identity: u.identity || null,
  };
}

export async function GET() {
  const s = await getSession();
  if (s?.role !== "super_admin") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const admin = superAdminMobile();
  const customers = listUsers().map((m) => row(m, admin));
  customers.sort((a, b) => (a.joined < b.joined ? 1 : -1));
  return NextResponse.json({ ok: true, customers });
}

/** Bulk actions. Body: { action, mobiles[], amount?, text?, status? } */
export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "super_admin") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const action = String(b.action || "");
  const mobiles: string[] = Array.isArray(b.mobiles) ? b.mobiles.map((x: unknown) => String(x)) : [];
  if (!mobiles.length) return NextResponse.json({ ok: false, error: "no-selection" }, { status: 400 });
  const amount = Math.floor(Number(b.amount) || 0);
  const text = String(b.text || "").slice(0, 300);

  let affected = 0;
  for (const m of mobiles) {
    if (action === "delete") {
      if (isSuperAdmin(m)) continue; // never delete the super admin
      deleteUser(m);
      affected++;
      continue;
    }
    updateUser(m, (u) => {
      if (action === "points") { u.points = Math.max(0, u.points + amount); if (text || amount) notify(u, text || `${amount} امتیاز به حساب شما اضافه شد.`); }
      else if (action === "wallet") { u.wallet.balance = Math.max(0, u.wallet.balance + amount); u.wallet.txns.unshift({ id: uid(), type: amount >= 0 ? "topup" : "withdraw", amount: Math.abs(amount), date: nowIso(), note: "تعدیل توسط مدیر" }); notify(u, text || `${Math.abs(amount).toLocaleString("fa-IR")} تومان ${amount >= 0 ? "به" : "از"} کیف پول شما ${amount >= 0 ? "اضافه" : "کسر"} شد.`); }
      else if (action === "notify") { if (text) notify(u, text); }
      else if (action === "status") { u.status = b.status === "blocked" ? "blocked" : "active"; }
    });
    affected++;
  }

  const admin = superAdminMobile();
  const customers = listUsers().map((mm) => row(mm, admin));
  customers.sort((a, c) => (a.joined < c.joined ? 1 : -1));
  return NextResponse.json({ ok: true, affected, customers });
}
