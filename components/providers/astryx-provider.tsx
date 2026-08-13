"use client";

import { ReactNode } from "react";
import { Theme, LinkProvider, InternationalizationProvider } from "@astryxdesign/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { neutralTheme } from "@astryxdesign/theme-neutral";

export function AstryxProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <Theme theme={neutralTheme}>
      <LinkProvider component={Link as any}>
        <InternationalizationProvider locale="en-US">
          {children}
        </InternationalizationProvider>
      </LinkProvider>
    </Theme>
  );
}
