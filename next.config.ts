import "./lib/env";
import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.159.148', 'localhost'],
  serverExternalPackages: ['clawpdf', '@pdfme/converter', '@pdfme/ui', '@pdfme/common'],
  output: "standalone",
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        module: false,
        path: false,
        crypto: false,
        zlib: false,
        url: false,
      };
    }
    return config;
  },
  turbopack: {
    resolveAlias: {
      fs: { browser: './lib/mock-node.js' },
      module: { browser: './lib/mock-node.js' },
      path: { browser: './lib/mock-node.js' },
      crypto: { browser: './lib/mock-node.js' },
      zlib: { browser: './lib/mock-node.js' },
      url: { browser: './lib/mock-node.js' },
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
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
