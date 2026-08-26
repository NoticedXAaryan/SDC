"use client";

import Link from "next/link";
import { ThemeProvider as NextThemeProvider, useTheme } from "next-themes";
import { Theme as AstryxTheme } from "@astryxdesign/core/theme";
import { LinkProvider } from "@astryxdesign/core/Link";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import { Toaster } from "sonner";

function DesignSystemProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const mode = resolvedTheme === "light" ? "light" : "dark";

  return (
    <AstryxTheme theme={neutralTheme} mode={mode}>
      <LinkProvider component={Link}>{children}</LinkProvider>
    </AstryxTheme>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange={false}
    >
      <DesignSystemProvider>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: "!bg-card !text-primary !border-border !shadow-lg",
          }}
          richColors
          closeButton
        />
      </DesignSystemProvider>
    </NextThemeProvider>
  );
}
