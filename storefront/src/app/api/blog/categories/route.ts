import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readArray, writeArray } from "@/lib/settings";
import { getAllPosts } from "@/lib/posts";

/** Union of explicitly-managed categories and those already used by posts. */
function list(): string[] {
  const stored = readArray<string>("blogcats.json", []);
  const used = getAllPosts().map((p) => p.catFa).filter(Boolean);
  return Array.from(new Set([...stored, ...used])).filter(Boolean);
}

export async function GET() {
  return NextResponse.json({ ok: true, categories: list() });
}

export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "super_admin") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const stored = readArray<string>("blogcats.json", []);

  if (b.action === "add") {
    const name = String(b.name || "").trim().slice(0, 60);
    if (name && !stored.includes(name)) writeArray("blogcats.json", [...stored, name]);
  } else if (b.action === "delete") {
    const name = String(b.name || "");
    writeArray("blogcats.json", stored.filter((c) => c !== name));
  }
  return NextResponse.json({ ok: true, categories: list() });
}
