import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { aiConfig, callAI } from "@/lib/ai";

export async function POST() {
  const s = await getSession();
  if (s?.role !== "super_admin") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  if (!aiConfig().configured) {
    return NextResponse.json({ ok: false, error: "ai-not-configured" }, { status: 400 });
  }
  const reply = await callAI("You are a helpful assistant. Answer in one short sentence.", [
    { role: "user", content: "بگو سلام و یک جملهٔ کوتاه تست." },
  ]);
  if (reply) return NextResponse.json({ ok: true, sample: reply, model: aiConfig().model });
  return NextResponse.json({ ok: false, error: "request-failed" }, { status: 502 });
}
