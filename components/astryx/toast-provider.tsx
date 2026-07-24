"use client";

import { useToast as useAstryxToast } from "@astryxdesign/core/Toast";
import { useCallback } from "react";

export function useToast() {
  const showToast = useAstryxToast();

  const success = useCallback((title: string, description?: string) => {
    showToast({ body: description ? `${title}: ${description}` : title, type: "info" });
  }, [showToast]);

  const error = useCallback((title: string, description?: string) => {
    showToast({ body: description ? `${title}: ${description}` : title, type: "error" });
  }, [showToast]);

  const info = useCallback((title: string, description?: string) => {
    showToast({ body: description ? `${title}: ${description}` : title, type: "info" });
  }, [showToast]);

  const warning = useCallback((title: string, description?: string) => {
    showToast({ body: description ? `${title}: ${description}` : title, type: "info" });
  }, [showToast]);

  return { success, error, info, warning, showToast };
}
