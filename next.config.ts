import "./lib/env";
import type { NextConfig } from "next";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https: wss:",
  "frame-src https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : []),
].join("; ");

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.159.148', 'localhost'],
  // Type safety is enforced by `npm run typecheck` in CI before this build.
  // Repeating the 1.5 GB type-analysis pass inside Dokploy can OOM a small VPS.
  typescript: {
    ignoreBuildErrors: true,
  },
  productionBrowserSourceMaps: false,
  enablePrerenderSourceMaps: false,
  // Server-side packages that should not be bundled.
  // clawpdf/@pdfme packages use Node.js builtins (module, fs) that break in browser bundles.
  serverExternalPackages: ['clawpdf', '@pdfme/converter', '@pdfme/ui', '@pdfme/common', 'ioredis', 'bullmq'],
  output: "standalone",
  turbopack: {
    root: process.cwd(),
    resolveAlias: {
      // clawpdf (used by @pdfme/converter) dynamically imports 'module' which doesn't
      // exist in browser context. Provide a no-op stub so Turbopack doesn't fail.
      module: { browser: './lib/mock-node.js' },
    },
  },
  experimental: {
    // Bound build concurrency and avoid eagerly loading every route on a
    // memory-constrained single-node deployment.
    cpus: 1,
    workerThreads: true,
    preloadEntriesOnStart: false,
    serverSourceMaps: false,
    optimizePackageImports: ["@astryxdesign/core"],
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          // The scanner is same-origin and still requires the browser's user permission.
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), browsing-topics=()" },
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
        ],
      },
    ];
  },
};

export default nextConfig;
