import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getHome, writeHome, HOME_DEFAULT, type HomeContent } from "@/lib/home";

export async function GET() {
  return NextResponse.json({ ok: true, home: getHome() });
}

export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "super_admin") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  if (b.action === "reset") {
    writeHome(HOME_DEFAULT);
    return NextResponse.json({ ok: true, home: getHome() });
  }
  const incoming = (b.home || {}) as Partial<HomeContent>;
  // merge over current so partial saves never drop other fields
  const merged = { ...getHome(), ...incoming } as HomeContent;
  writeHome(merged);
  return NextResponse.json({ ok: true, home: getHome() });
}
