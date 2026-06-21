import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { updateUser, uid, nowIso, type Ticket } from "@/lib/userstore";

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const subject = String(b.subject || "").trim().slice(0, 120);
  const body = String(b.body || "").trim().slice(0, 2000);
  if (!subject || !body) return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });

  const u = updateUser(s.mobile, (u) => {
    const ticket: Ticket = { id: uid(), subject, body, status: "open", date: nowIso(), replies: [] };
    u.tickets.unshift(ticket);
  });
  return NextResponse.json({ ok: true, user: u });
}
