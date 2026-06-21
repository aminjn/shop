import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { aiConfig } from "@/lib/ai";
import { AI_MODELS_FLAT } from "@/data/aiModels";

export async function GET() {
  const s = await getSession();
  if (s?.role !== "super_admin") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const c = aiConfig();
  if (!c.apiKey) {
    return NextResponse.json({ ok: true, models: AI_MODELS_FLAT, source: "fallback" });
  }
  try {
    const res = await fetch(`${c.baseUrl}/models`, {
      headers: { Authorization: `Bearer ${c.apiKey}` },
    });
    if (!res.ok) return NextResponse.json({ ok: true, models: AI_MODELS_FLAT, source: "fallback" });
    const data = await res.json();
    const ids: string[] = Array.isArray(data?.data)
      ? data.data.map((m: { id?: string }) => m?.id).filter(Boolean)
      : [];
    if (!ids.length) return NextResponse.json({ ok: true, models: AI_MODELS_FLAT, source: "fallback" });
    ids.sort((a, b) => a.localeCompare(b));
    return NextResponse.json({ ok: true, models: ids, source: "live" });
  } catch {
    return NextResponse.json({ ok: true, models: AI_MODELS_FLAT, source: "fallback" });
  }
}
