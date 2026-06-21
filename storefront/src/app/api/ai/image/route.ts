import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { aiConfig } from "@/lib/ai";

export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "super_admin") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const c = aiConfig();
  if (!c.apiKey) return NextResponse.json({ ok: false, error: "ai-not-configured" }, { status: 400 });

  const b = await req.json().catch(() => ({}));
  const prompt = String(b.prompt || "").trim();
  if (!prompt) return NextResponse.json({ ok: false, error: "prompt-required" }, { status: 400 });
  const size = ["1024x1024", "1024x1536", "1536x1024"].includes(b.size) ? b.size : "1024x1024";
  const model = String(b.model || "gpt-image-2");

  try {
    const res = await fetch(`${c.baseUrl}/images/generations`, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${c.apiKey}` },
      body: JSON.stringify({ model, prompt, size }),
    });
    const data = await res.json().catch(() => null);
    const item = data?.data?.[0];
    const url = item?.url || (item?.b64_json ? `data:image/png;base64,${item.b64_json}` : null);
    if (res.ok && url) return NextResponse.json({ ok: true, url });
    return NextResponse.json({ ok: false, error: data?.error?.message || `http ${res.status}` }, { status: 502 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "network" }, { status: 502 });
  }
}
