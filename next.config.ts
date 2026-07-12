import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.159.148', 'localhost'],
  serverExternalPackages: ['clawpdf', '@pdfme/converter', '@pdfme/ui', '@pdfme/common'],
  output: "standalone",
};

export default nextConfig;
