import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { HomeBlock } from "./home";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const FILE = "blocks.json";

type BlockMap = Record<string, HomeBlock[]>;

function readAll(): BlockMap {
  try {
    const v = JSON.parse(fs.readFileSync(path.join(DATA_DIR, FILE), "utf8"));
    return v && typeof v === "object" ? (v as BlockMap) : {};
  } catch {
    return {};
  }
}
function writeAll(map: BlockMap) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, FILE), JSON.stringify(map, null, 2), "utf8");
}

/** Blocks for an arbitrary surface key (e.g. "shop", "page:about"). */
export function getBlocks(key: string): HomeBlock[] {
  const v = readAll()[key];
  return Array.isArray(v) ? v : [];
}
export function saveBlocks(key: string, blocks: HomeBlock[]): HomeBlock[] {
  const map = readAll();
  map[key] = blocks;
  writeAll(map);
  return blocks;
}
