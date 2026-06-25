import "server-only";
import { readArray, writeArray, hasFile } from "./settings";

export interface MenuLink {
  id: string;
  fa: string;
  en: string;
  href: string; // internal (/...) or absolute (https://...)
}

const SEED: MenuLink[] = [];

/** Custom header navigation links (besides Home / categories / Blog). */
export function getMenu(): MenuLink[] {
  if (!hasFile("menu.json")) {
    writeArray<MenuLink>("menu.json", SEED);
    return SEED;
  }
  return readArray<MenuLink>("menu.json", []);
}
export function saveMenu(list: MenuLink[]): MenuLink[] {
  return writeArray<MenuLink>("menu.json", list);
}
