import React from "react";
import { Badge } from "@astryxdesign/core/Badge";
import { StatusDot } from "@astryxdesign/core/StatusDot";

type BadgeVariant = "neutral" | "success" | "warning" | "error" | "blue" | "teal" | "purple" | "pink" | "orange";

type StatusConfig = { variant: BadgeVariant; label: string };
type StatusMap = Record<string, StatusConfig>;

const EVENT_STATUS_MAP: StatusMap = {
  draft: { variant: "neutral", label: "Draft" },
  published: { variant: "success", label: "Published" },
  cancelled: { variant: "error", label: "Cancelled" },
  completed: { variant: "blue", label: "Completed" },
};

const APPLICATION_STATUS_MAP: StatusMap = {
  draft: { variant: "neutral", label: "Draft" },
  applied: { variant: "blue", label: "Applied" },
  ai_graded: { variant: "purple", label: "AI Graded" },
  needs_manual_review: { variant: "warning", label: "Needs Review" },
  interviewing: { variant: "orange", label: "Interviewing" },
  accepted: { variant: "success", label: "Accepted" },
  rejected: { variant: "error", label: "Rejected" },
};

const REGISTRATION_STATUS_MAP: StatusMap = {
  confirmed: { variant: "success", label: "Confirmed" },
  waitlist: { variant: "warning", label: "Waitlisted" },
  checked_in: { variant: "blue", label: "Checked In" },
  cancelled: { variant: "error", label: "Cancelled" },
  no_show: { variant: "neutral", label: "No Show" },
};

const EXPENSE_STATUS_MAP: StatusMap = {
  pending: { variant: "warning", label: "Pending" },
  approved: { variant: "success", label: "Approved" },
  rejected: { variant: "error", label: "Rejected" },
};

const PROJECT_STATUS_MAP: StatusMap = {
  pending: { variant: "warning", label: "Pending Review" },
  approved: { variant: "success", label: "Approved" },
  rejected: { variant: "error", label: "Rejected" },
};

interface StatusBadgeProps {
  status: string;
  type: "event" | "application" | "registration" | "expense" | "project" | "generic";
  label?: string;
  variantOverride?: BadgeVariant;
}

export function StatusBadge({ status, type, label, variantOverride }: StatusBadgeProps) {
  const defaultConfig: StatusConfig = { variant: "neutral", label: status };
  let mappedConfig: StatusConfig = defaultConfig;

  switch (type) {
    case "event":
      mappedConfig = EVENT_STATUS_MAP[status] || defaultConfig;
      break;
    case "application":
      mappedConfig = APPLICATION_STATUS_MAP[status] || defaultConfig;
      break;
    case "registration":
      mappedConfig = REGISTRATION_STATUS_MAP[status] || defaultConfig;
      break;
    case "expense":
      mappedConfig = EXPENSE_STATUS_MAP[status] || defaultConfig;
      break;
    case "project":
      mappedConfig = PROJECT_STATUS_MAP[status] || defaultConfig;
      break;
  }

  return (
    <Badge
      variant={variantOverride || mappedConfig.variant}
      label={label || mappedConfig.label}
    />
  );
}

export function UserStatusDot({ isBanned }: { isBanned: boolean }) {
  return (
    <StatusDot 
      variant={isBanned ? "error" : "success"} 
      label={isBanned ? "Banned" : "Active"} 
    />
  );
}
