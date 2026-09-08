/** Describe only what an application status establishes; never infer an interview date. */
export function describeApplicationStatus(status: string | null) {
  switch (status) {
    case "draft": return { label: "Draft", description: "Your application has not been submitted yet." };
    case "applied": return { label: "Under review", description: "Your application is with the recruitment team. No action is needed right now." };
    case "ai_graded":
    case "needs_manual_review": return { label: "Under review", description: "Your application is awaiting a decision from the recruitment team." };
    case "interviewing": return { label: "Interview stage", description: "The team will share the interview details with you. Check your notifications for updates." };
    case "accepted": return { label: "Accepted", description: "You have been accepted. Check your notifications for the next steps from your team." };
    case "rejected": return { label: "Not selected", description: "You were not selected in this round. You can still take part in public club events." };
    default: return { label: "Status unavailable", description: "We cannot show your application status right now. Check your notifications for updates." };
  }
}
