import { NextResponse } from "next/server";
import { postBySlugStore, getAllPosts } from "@/lib/posts";
import { callAI, modelFor, type ChatMessage } from "@/lib/ai";

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const slug = String(b.slug || "");
  const id = Number(b.id);
  const messages: ChatMessage[] = Array.isArray(b?.messages) ? b.messages.slice(-8) : [];
  if (!messages.length) return NextResponse.json({ ok: false, error: "no-question" }, { status: 400 });

  // resolve the article (by slug, then by id)
  const post = postBySlugStore(slug) || (Number.isFinite(id) ? getAllPosts().find((p) => p.id === id) : undefined);
  if (!post) return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });

  const body = (post.bodyFa || post.bodyEn || "").replace(/\s+/g, " ").slice(0, 9000);
  const system = `تو دستیار همین مقاله هستی. فقط بر اساس متنِ همین مقاله و دانش عمومی مرتبط، کوتاه و دقیق و فارسی پاسخ بده (حداکثر ۵ جمله). اگر پاسخ سوال در مقاله نیست، صادقانه بگو در این مقاله به آن اشاره نشده اما در صورت امکان راهنمایی کلی بده.
عنوان مقاله: ${post.fa}
دستهٔ مقاله: ${post.catFa}
متن مقاله:
${body}`;

  const reply = await callAI(system, messages, modelFor("chat"));
  if (reply) return NextResponse.json({ ok: true, reply });
  return NextResponse.json({
    ok: true,
    reply: "متاسفم، الان نمی‌تونم پاسخ بدم. لطفاً کمی بعد دوباره تلاش کن یا متن مقاله را بخوان.",
  });
}
