"use client";

import { AlertDialog } from "@astryxdesign/core";
import { useCallback, useState } from "react";

export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<{
    title: string;
    description: string;
    actionLabel: string;
    actionVariant?: "primary" | "secondary" | "ghost" | "destructive";
    onConfirm?: () => void;
    onCancel?: () => void;
  } | null>(null);

  const confirm = useCallback(
    (title: string, message: string, confirmLabel = "Confirm", variant: "danger" | "primary" = "danger") => {
      return new Promise<boolean>((resolve) => {
        setOptions({
          title,
          description: message,
          actionLabel: confirmLabel,
          actionVariant: variant === "danger" ? "destructive" : variant,
          onConfirm: () => resolve(true),
          onCancel: () => resolve(false),
        });
        setIsOpen(true);
      });
    },
    []
  );

  const confirmDelete = useCallback(
    (itemType: string, itemName?: string) => {
      return confirm(
        `Delete ${itemType}`,
        `Are you sure you want to delete ${itemName ? `"${itemName}"` : `this ${itemType}`}? This action cannot be undone.`,
        "Delete",
        "danger"
      );
    },
    [confirm]
  );

  const element = options ? (
    <AlertDialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          options.onCancel?.();
          setIsOpen(false);
        }
      }}
      title={options.title}
      description={options.description}
      actionLabel={options.actionLabel}
      actionVariant={options.actionVariant}
      onAction={() => {
        options.onConfirm?.();
        setIsOpen(false);
      }}
    />
  ) : null;

  return { confirm, confirmDelete, element };
}
