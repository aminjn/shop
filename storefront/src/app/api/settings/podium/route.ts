import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readPodiumPublic, writePodium } from "@/lib/podium";

export async function GET() {
  const s = await getSession();
  if (s?.role !== "super_admin") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  return NextResponse.json({ ok: true, podium: readPodiumPublic() });
}

export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "super_admin") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  writePodium({
    url: str(b.url),
    token: str(b.token),
    idKey: str(b.idKey),
    matchKey: str(b.matchKey),
    idProduct: str(b.idProduct),
    matchProduct: str(b.matchProduct),
  });
  return NextResponse.json({ ok: true, podium: readPodiumPublic() });
}
