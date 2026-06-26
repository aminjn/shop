import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getBlocks, saveBlocks } from "@/lib/blocks";
import type { HomeBlock } from "@/lib/home";

const ok = (key: string) => /^[a-z0-9:_-]{1,60}$/i.test(key);

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key") || "";
  if (!ok(key)) return NextResponse.json({ ok: false, error: "bad-key" }, { status: 400 });
  return NextResponse.json({ ok: true, blocks: getBlocks(key) });
}

export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "super_admin") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const key = String(b.key || "");
  if (!ok(key)) return NextResponse.json({ ok: false, error: "bad-key" }, { status: 400 });
  const blocks = Array.isArray(b.blocks) ? (b.blocks as HomeBlock[]) : [];
  saveBlocks(key, blocks);
  return NextResponse.json({ ok: true, blocks: getBlocks(key) });
}
