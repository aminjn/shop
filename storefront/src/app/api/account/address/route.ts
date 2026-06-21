import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { updateUser, uid, type Address } from "@/lib/userstore";

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const action = b.action as "add" | "update" | "delete" | "default";

  const u = updateUser(s.mobile, (u) => {
    if (action === "delete") {
      u.addresses = u.addresses.filter((a) => a.id !== b.id);
      if (u.addresses.length && !u.addresses.some((a) => a.isDefault)) u.addresses[0].isDefault = true;
      return;
    }
    if (action === "default") {
      u.addresses.forEach((a) => (a.isDefault = a.id === b.id));
      return;
    }
    const fields = {
      title: String(b.title || "").slice(0, 60),
      receiver: String(b.receiver || "").slice(0, 60),
      phone: String(b.phone || "").slice(0, 20),
      province: String(b.province || "").slice(0, 40),
      city: String(b.city || "").slice(0, 40),
      postal: String(b.postal || "").slice(0, 20),
      address: String(b.address || "").slice(0, 300),
    };
    if (action === "update") {
      const a = u.addresses.find((x) => x.id === b.id);
      if (a) Object.assign(a, fields);
    } else {
      const addr: Address = { id: uid(), ...fields, isDefault: u.addresses.length === 0 };
      u.addresses.push(addr);
    }
  });
  return NextResponse.json({ ok: true, user: u });
}
