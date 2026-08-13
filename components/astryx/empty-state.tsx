import React from "react";
import { EmptyState as AstryxEmptyState } from "@astryxdesign/core/EmptyState";
import { Button } from "@astryxdesign/core/Button";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  isCompact?: boolean;
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  isCompact = false,
}: EmptyStateProps) {
  return (
    <AstryxEmptyState
      title={title}
      description={description}
      icon={icon}
      isCompact={isCompact}
      headingLevel={3}
      actions={
        actionLabel && onAction ? (
          <Button onClick={onAction} label={actionLabel} />
        ) : undefined
      }
    />
  );
}
