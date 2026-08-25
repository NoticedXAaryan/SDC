export const PROCUREMENT_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  draft: ["pending_quotes"],
  pending_quotes: ["approval", "rejected"],
  approval: ["approved", "rejected"],
  approved: ["completed"],
  rejected: [],
  completed: [],
};

export function canTransitionProcurement(currentStatus: string, nextStatus: string): boolean {
  return (PROCUREMENT_STATUS_TRANSITIONS[currentStatus] ?? []).includes(nextStatus);
}
