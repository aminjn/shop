import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

const TYPE: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  ico: "image/x-icon",
  mp4: "video/mp4",
  webm: "video/webm",
  pdf: "application/pdf",
};

export async function GET(_req: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  // prevent path traversal
  const safe = path.basename(name);
  const file = path.join(UPLOAD_DIR, safe);
  if (!file.startsWith(UPLOAD_DIR) || !fs.existsSync(file)) {
    return new NextResponse("Not found", { status: 404 });
  }
  const ext = safe.split(".").pop()?.toLowerCase() || "";
  const buf = fs.readFileSync(file);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "content-type": TYPE[ext] || "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
