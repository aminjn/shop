import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { updateUser } from "@/lib/userstore";

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const u = updateUser(s.mobile, (u) => {
    u.profile.firstName = String(b.firstName ?? u.profile.firstName).slice(0, 60);
    u.profile.lastName = String(b.lastName ?? u.profile.lastName).slice(0, 60);
    u.profile.email = String(b.email ?? u.profile.email).slice(0, 120);
    if (typeof b.avatar === "string") u.profile.avatar = b.avatar.slice(0, 500);
  });
  return NextResponse.json({ ok: true, user: u });
}
