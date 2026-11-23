import type { NextConfig } from "next";

// NFR-01. No full CSP now: the app shows no HTML that users write.
export const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  // `next dev` must not write into AGENTS.md. It holds the project rules (AGENTS.md §3).
  agentRules: false,
  cacheComponents: true,
  partialPrefetching: true,
  headers: async () => [{ source: "/:path*", headers: securityHeaders }],
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
