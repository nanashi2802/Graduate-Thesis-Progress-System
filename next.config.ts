import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `next dev` must not write into AGENTS.md. It holds the project rules (AGENTS.md §3).
  agentRules: false,
  cacheComponents: true,
  partialPrefetching: true,
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
