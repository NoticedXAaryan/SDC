"use client";

import dynamic from "next/dynamic";

export const CertificateDesigner = dynamic(
  () => import("@/components/certificates/designer").then((mod) => mod.CertificateDesigner),
  { ssr: false }
);
