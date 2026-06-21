import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { getSession } from "@/lib/auth";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "application/pdf": "pdf",
};
const MAX = 60 * 1024 * 1024; // 60MB

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "no-file" }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ ok: false, error: "too-large" }, { status: 413 });

  const ext = EXT[file.type] || (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!Object.values(EXT).includes(ext)) {
    return NextResponse.json({ ok: false, error: "bad-type" }, { status: 415 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const name = `${Date.now()}-${crypto.randomBytes(5).toString("hex")}.${ext}`;
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);

  const kind = ext === "mp4" || ext === "webm" ? "video" : ext === "pdf" ? "pdf" : "image";
  return NextResponse.json({ ok: true, url: `/api/uploads/${name}`, kind });
}
