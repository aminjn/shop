import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { updateUser } from "@/lib/userstore";

export async function POST() {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const u = updateUser(s.mobile, (u) => {
    u.notifications.forEach((n) => (n.read = true));
  });
  return NextResponse.json({ ok: true, user: u });
}
