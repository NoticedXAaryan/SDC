"use client";

import { toast as sonnerToast } from "sonner";
import { useCallback } from "react";

export function useToast() {
  const success = useCallback((title: string, description?: string) => {
    sonnerToast.success(title, { description });
  }, []);

  const error = useCallback((title: string, description?: string) => {
    sonnerToast.error(title, { description });
  }, []);

  const info = useCallback((title: string, description?: string) => {
    sonnerToast.info(title, { description });
  }, []);

  const warning = useCallback((title: string, description?: string) => {
    sonnerToast.warning(title, { description });
  }, []);

  const showToast = useCallback((props: any) => {
     sonnerToast(props.body || "Notification");
  }, []);

  return { success, error, info, warning, showToast };
}
