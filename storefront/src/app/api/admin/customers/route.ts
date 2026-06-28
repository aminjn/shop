import { NextResponse } from "next/server";
import { getSession, superAdminMobile } from "@/lib/auth";
import { listUsers } from "@/lib/settings";
import { getUser } from "@/lib/userstore";

export async function GET() {
  const s = await getSession();
  if (s?.role !== "super_admin") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const admin = superAdminMobile();
  const customers = listUsers().map((m) => {
    const u = getUser(m);
    const spent = u.orders.reduce((sum, o) => (o.status !== "cancelled" ? sum + o.total : sum), 0);
    return {
      mobile: u.mobile,
      name: `${u.profile.firstName} ${u.profile.lastName}`.trim(),
      email: u.profile.email,
      orders: u.orders.length,
      spent,
      points: u.points,
      wallet: u.wallet.balance,
      joined: u.createdAt,
      role: u.mobile === admin ? "admin" : "customer",
      // full verified identity (Shahkar) — super admin only
      identity: u.identity || null,
    };
  });
  customers.sort((a, b) => (a.joined < b.joined ? 1 : -1));
  return NextResponse.json({ ok: true, customers });
}
