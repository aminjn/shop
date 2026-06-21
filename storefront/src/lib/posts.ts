import "server-only";
import { POSTS, type Post } from "@/data/posts";
import { readArray, writeArray } from "./settings";

export type PostStatus = "published" | "scheduled" | "draft";
export interface StoredPost extends Post {
  status: PostStatus;
  publishAt?: string; // ISO; when status === "scheduled"
}

const seed = (): StoredPost[] =>
  POSTS.map((p) => ({ ...p, status: "published" as PostStatus }));

function read(): StoredPost[] {
  const arr = readArray<StoredPost>("posts.json", []);
  return arr.length ? arr : seed();
}
function write(list: StoredPost[]) {
  return writeArray<StoredPost>("posts.json", list);
}

/** Flip any scheduled posts whose time has come to published (auto-post). */
function autoPublish(list: StoredPost[]): { list: StoredPost[]; changed: boolean } {
  const now = Date.now();
  let changed = false;
  for (const p of list) {
    if (p.status === "scheduled" && p.publishAt && new Date(p.publishAt).getTime() <= now) {
      p.status = "published";
      p.date = new Date().toISOString();
      delete p.publishAt;
      changed = true;
    }
  }
  return { list, changed };
}

export function getAllPosts(): StoredPost[] {
  const { list, changed } = autoPublish(read());
  if (changed) write(list);
  return list;
}

export function getPublishedPosts(): StoredPost[] {
  return getAllPosts()
    .filter((p) => p.status === "published")
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getScheduledPosts(): StoredPost[] {
  return getAllPosts().filter((p) => p.status !== "published");
}

export function postBySlugStore(slug: string): StoredPost | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

export function nextPostId(): number {
  return getAllPosts().reduce((m, p) => Math.max(m, p.id), 0) + 1;
}

export function savePosts(list: StoredPost[]) {
  return write(list);
}
