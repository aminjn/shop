import "server-only";
import { readArray, writeArray } from "./settings";

export type ReviewStatus = "pending" | "approved" | "rejected";
export interface Review {
  id: number;
  productId: number;
  author: string;
  mobile?: string;
  rating: number; // 1..5
  text: string;
  date: string; // ISO
  status: ReviewStatus;
  reply?: string; // admin reply
}

const FILE = "reviews.json";

export function getAllReviews(): Review[] {
  return readArray<Review>(FILE, []);
}

export function getApprovedReviews(productId: number): Review[] {
  return getAllReviews()
    .filter((r) => r.productId === productId && r.status === "approved")
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function saveReviews(list: Review[]) {
  return writeArray<Review>(FILE, list);
}

function nextId(list: Review[]): number {
  return list.reduce((m, r) => Math.max(m, r.id), 0) + 1;
}

export function addReview(input: {
  productId: number;
  author: string;
  mobile?: string;
  rating: number;
  text: string;
}): Review {
  const list = getAllReviews();
  const review: Review = {
    id: nextId(list),
    productId: input.productId,
    author: input.author.slice(0, 60) || "کاربر",
    mobile: input.mobile,
    rating: Math.min(5, Math.max(1, Math.round(input.rating) || 5)),
    text: input.text.slice(0, 2000),
    date: new Date().toISOString(),
    status: "pending",
  };
  list.unshift(review);
  saveReviews(list);
  return review;
}

/** Average rating + count over approved reviews for a product. */
export function reviewStats(productId: number): { avg: number; count: number } {
  const r = getApprovedReviews(productId);
  if (!r.length) return { avg: 0, count: 0 };
  const avg = r.reduce((s, x) => s + x.rating, 0) / r.length;
  return { avg: Math.round(avg * 10) / 10, count: r.length };
}
