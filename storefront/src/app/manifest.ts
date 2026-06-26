import type { MetadataRoute } from "next";
import { readStore } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default function manifest(): MetadataRoute.Manifest {
  const store = readStore();
  const name = store.storeName || "فروشگاه";
  return {
    name,
    short_name: name.slice(0, 12),
    description: store.metaDescription || store.tagline || name,
    start_url: "/fa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0e1116",
    theme_color: "#4f46e5",
    dir: "rtl",
    lang: "fa",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
