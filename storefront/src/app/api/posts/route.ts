import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAllPosts, getPublishedPosts, savePosts, nextPostId, type StoredPost, type PostStatus } from "@/lib/posts";

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("all") === "1") {
    const s = await getSession();
    if (s?.role !== "super_admin") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    return NextResponse.json({ ok: true, posts: getAllPosts() });
  }
  return NextResponse.json({ ok: true, posts: getPublishedPosts() });
}

function slugify(s: string): string {
  return (s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .slice(0, 80) || `post-${Date.now()}`;
}

export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "super_admin") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const action = b.action as "create" | "update" | "delete";
  const list = getAllPosts();

  if (action === "delete") {
    savePosts(list.filter((p) => p.id !== Number(b.id)));
    return NextResponse.json({ ok: true, posts: getAllPosts() });
  }

  const p = b.post || {};
  const status: PostStatus = ["published", "scheduled", "draft"].includes(b.status) ? b.status : "published";
  const fa = String(p.fa || "").trim();
  if (!fa) return NextResponse.json({ ok: false, error: "title-required" }, { status: 400 });

  if (action === "update") {
    const idx = list.findIndex((x) => x.id === Number(b.id));
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...sanitize(p), status, publishAt: status === "scheduled" ? b.publishAt : undefined };
      savePosts(list);
    }
    return NextResponse.json({ ok: true, posts: getAllPosts() });
  }

  const post: StoredPost = {
    id: nextPostId(),
    slug: slugify(p.slug || p.en || p.fa),
    hue: typeof p.hue === "number" ? p.hue : Math.floor(Math.random() * 360),
    author: String(p.author || "تیم محتوا"),
    date: new Date().toISOString(),
    status,
    publishAt: status === "scheduled" ? b.publishAt : undefined,
    ...sanitize(p),
  } as StoredPost;
  list.unshift(post);
  savePosts(list);
  return NextResponse.json({ ok: true, posts: getAllPosts(), post });
}

function sanitize(p: Record<string, unknown>) {
  const str = (v: unknown, n = 4000) => String(v ?? "").slice(0, n);
  const fa = str(p.fa, 160);
  const en = str(p.en, 160) || fa;
  return {
    fa,
    en,
    excerptFa: str(p.excerptFa, 320),
    excerptEn: str(p.excerptEn, 320) || str(p.excerptFa, 320),
    bodyFa: str(p.bodyFa),
    bodyEn: str(p.bodyEn) || str(p.bodyFa),
    catFa: str(p.catFa, 60) || "عمومی",
    catEn: str(p.catEn, 60) || "General",
    tags: Array.isArray(p.tags) ? (p.tags as unknown[]).map((x) => String(x)).slice(0, 8) : [],
  };
}
