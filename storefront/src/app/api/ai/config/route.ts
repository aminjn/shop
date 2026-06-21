import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { aiConfigPublic } from "@/lib/ai";
import { writeAi } from "@/lib/settings";

export async function GET() {
  const s = await getSession();
  if (s?.role !== "super_admin") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  return NextResponse.json({ ok: true, config: aiConfigPublic() });
}

export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "super_admin") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const patch: { apiKey?: string; baseUrl?: string; model?: string; models?: Record<string, string> } = {};
  if (typeof body.apiKey === "string" && body.apiKey.trim()) patch.apiKey = body.apiKey.trim();
  if (typeof body.baseUrl === "string") patch.baseUrl = body.baseUrl.trim();
  if (typeof body.model === "string") patch.model = body.model.trim();
  if (body.models && typeof body.models === "object") {
    const m: Record<string, string> = {};
    for (const [k, v] of Object.entries(body.models)) {
      if (typeof v === "string" && v.trim()) m[k] = v.trim();
    }
    if (Object.keys(m).length) patch.models = m;
  }
  writeAi(patch);
  return NextResponse.json({ ok: true, config: aiConfigPublic() });
}
