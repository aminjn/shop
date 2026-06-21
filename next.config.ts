import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for small Docker images (ArvanCloud / any host)
  output: "standalone",
};

export default nextConfig;
