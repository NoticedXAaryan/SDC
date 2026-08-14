"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * Global motion configuration provider.
 * Applies reducedMotion="user" so that all descendant motion components
 * respect the user's prefers-reduced-motion OS preference automatically.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      {children}
    </MotionConfig>
  );
}
