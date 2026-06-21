import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUser } from "@/lib/userstore";
import { callAI, catalog, modelFor, type ChatMessage } from "@/lib/ai";

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const messages: ChatMessage[] = Array.isArray(b?.messages) ? b.messages : [];
  const last = messages.filter((m) => m.role === "user").at(-1)?.content?.toLowerCase() ?? "";

  const u = getUser(s.mobile);
  const name = `${u.profile.firstName} ${u.profile.lastName}`.trim() || u.mobile;
  const orderSummary = u.orders
    .slice(0, 6)
    .map((o) => `#${o.id} (${o.status}, ${o.total} تومان, ${o.items.map((i) => i.name + "×" + i.qty).join("، ")})`)
    .join(" | ") || "بدون سفارش";

  const system = `تو دستیار هوشمند شخصی فروشگاه «مارکت‌لند» برای مشتری «${name}» هستی. مودب، صمیمی و کوتاه پاسخ بده (حداکثر ۴ جمله) و فارسی بنویس.
اطلاعات این مشتری:
- امتیاز باشگاه: ${u.points}
- موجودی کیف پول: ${u.wallet.balance} تومان
- سفارش‌ها: ${orderSummary}
وقتی دربارهٔ وضعیت سفارش می‌پرسد از همین اطلاعات استفاده کن. در صورت نیاز محصول مناسب از کاتالوگ پیشنهاد بده و قیمت را به تومان بگو.
کاتالوگ (JSON): ${JSON.stringify(catalog("fa"))}`;

  const reply = await callAI(system, messages, modelFor("chat"));
  if (reply) return NextResponse.json({ ok: true, reply });

  // graceful local fallback (order tracking + simple help)
  let local: string;
  if (/(سفارش|کجاست|پیگیری|وضعیت)/.test(last) && u.orders.length) {
    const o = u.orders[0];
    const map: Record<string, string> = { processing: "در حال پردازش", shipped: "ارسال شده", delivered: "تحویل شده", cancelled: "لغو شده" };
    local = `آخرین سفارش شما #${o.id} در وضعیت «${map[o.status] || o.status}» است.`;
  } else {
    local = "سلام! می‌تونم دربارهٔ سفارش‌ها، پیشنهاد محصول، کیف پول و امتیازت کمکت کنم. چی لازم داری؟";
  }
  return NextResponse.json({ ok: true, reply: local });
}
