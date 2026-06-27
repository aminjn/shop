import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { callAIDetailed, modelFor, stripFence } from "@/lib/ai";
import { readStore } from "@/lib/settings";

export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "super_admin") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const title = String(b.title || "").trim();
  if (!title) return NextResponse.json({ ok: false, error: "title-required" }, { status: 400 });

  const store = readStore();
  const name = store.storeName || "این فروشگاه";
  const system = "تو یک نویسندهٔ حرفه‌ای محتوای فارسی و متخصص فروشگاه‌های اینترنتی هستی. متن را به‌صورت Markdown خام (با ## و فهرست‌ها) بنویس، حرفه‌ای، روان و آمادهٔ انتشار. هرگز داخل بلوک کد قرار نده و فقط متن صفحه را برگردان.";
  const prompt = `یک صفحهٔ کامل و حرفه‌ای برای فروشگاه «${name}» با عنوان «${title}» بنویس. متن مناسب همین صفحه باشد (مثلاً اگر «تماس با ما» است شامل راه‌های ارتباطی، اگر «درباره ما» است معرفی و ارزش‌ها، اگر «قوانین» است بندهای مقررات و …). از Markdown استفاده کن و جای اطلاعاتی که باید صاحب فروشگاه پر کند placeholder بگذار.`;

  const r = await callAIDetailed(system, [{ role: "user", content: prompt }], modelFor("article"), 4000);
  if (r.text) return NextResponse.json({ ok: true, body: stripFence(r.text) });
  return NextResponse.json({ ok: false, error: r.error || "ai-unavailable" }, { status: 502 });
}
