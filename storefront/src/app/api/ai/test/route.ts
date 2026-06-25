import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { aiConfig, callAIDetailed } from "@/lib/ai";

export async function POST() {
  const s = await getSession();
  if (s?.role !== "super_admin") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const c = aiConfig();
  if (!c.configured) {
    return NextResponse.json({ ok: false, error: "ai-not-configured" }, { status: 400 });
  }
  const r = await callAIDetailed(
    "You are a helpful assistant. Answer in one short sentence.",
    [{ role: "user", content: "بگو سلام و یک جملهٔ کوتاه تست." }],
    undefined,
    256,
  );
  if (r.text) return NextResponse.json({ ok: true, sample: r.text, model: c.model });
  return NextResponse.json(
    { ok: false, error: r.error || "request-failed", model: c.model, baseUrl: c.baseUrl },
    { status: 502 },
  );
}
