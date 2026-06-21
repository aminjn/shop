import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { callAI, modelFor } from "@/lib/ai";

export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "super_admin") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const tool = String(b.tool || "").trim();
  const input = String(b.input || "").trim();
  if (!tool) return NextResponse.json({ ok: false, error: "tool-required" }, { status: 400 });

  const system = "تو یک دستیار هوش مصنوعی فروشگاهی فارسی‌زبان و متخصص سئو، بازاریابی و فروش هستی. خروجی تمیز، کوتاه و کاربردی به فارسی بده.";
  const prompt = `ابزار: «${tool}»\n${input ? `ورودی: ${input}\n` : ""}بر اساس این ابزار، خروجی مناسب و آماده‌استفاده تولید کن.`;

  const reply = await callAI(system, [{ role: "user", content: prompt }], modelFor("tool"));
  if (reply) return NextResponse.json({ ok: true, output: reply });
  return NextResponse.json({ ok: false, error: "ai-unavailable" }, { status: 502 });
}
