import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-expect-error - Next.js internal type missing this
  allowedDevOrigins: ['192.168.159.148', 'localhost'],
  serverExternalPackages: ['clawpdf', '@pdfme/converter', '@pdfme/ui', '@pdfme/common'],
  output: "standalone",
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        module: false,
        fs: false,
        path: false,
        url: false,
        zlib: false,
        "node:fs/promises": false,
        "node:url": false,
        "node:zlib": false,
        "node:fs": false,
        "node:path": false,
      };
    }
    return config;
  },
};

export default nextConfig;
