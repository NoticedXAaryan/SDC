export const CONTENT_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  idea: ["drafting"],
  drafting: ["review"],
  review: ["drafting", "scheduled"],
  scheduled: ["drafting", "published"],
  published: [],
};

export function canTransitionContent(currentStatus: string, nextStatus: string) {
  return (CONTENT_STATUS_TRANSITIONS[currentStatus] || []).includes(nextStatus);
}
