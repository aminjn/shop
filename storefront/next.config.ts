import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for small Docker images (ArvanCloud / any host)
  output: "standalone",
  // Never let the browser or a CDN (ArvanCloud) cache live data — otherwise
  // admin edits only appear after a hard refresh. APIs are always revalidated.
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" },
          { key: "CDN-Cache-Control", value: "no-store" },
          { key: "Vary", value: "Cookie" },
        ],
      },
    ];
  },
};

export default nextConfig;
