import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This is a signed-in, per-business app where every screen reads live data,
  // so pages render on request rather than being prerendered and cached.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
