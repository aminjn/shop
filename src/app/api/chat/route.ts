import { NextResponse } from "next/server";
import { callClaude, catalog, localChat, type ChatMessage } from "@/lib/ai";
import type { Locale } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const locale: Locale = body?.locale === "en" ? "en" : "fa";
  const messages: ChatMessage[] = Array.isArray(body?.messages)
    ? body.messages
    : [];
  const last = messages.filter((m) => m.role === "user").at(-1)?.content ?? "";

  const system =
    locale === "fa"
      ? `تو دستیار فروش فارسی‌زبان یک فروشگاه آنلاین چندمنظوره هستی. مودب، صمیمی و کوتاه پاسخ بده (حداکثر ۴ جمله). در صورت نیاز محصول مناسب از کاتالوگ پیشنهاد بده و قیمت را به تومان بگو. کاتالوگ (JSON): ${JSON.stringify(catalog(locale))}`
      : `You are the sales assistant of a multipurpose online store. Be polite, friendly and concise (max 4 sentences). Suggest suitable products from the catalog and quote prices. Catalog (JSON): ${JSON.stringify(catalog(locale))}`;

  const reply = await callClaude(system, messages);
  return NextResponse.json({ reply: reply ?? localChat(last, locale) });
}
