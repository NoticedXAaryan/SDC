import type { RecruitmentField } from "@/lib/recruitment-form";

/** Default intake. Existing recruitment rounds retain their configured questions. */
export const membershipQuestions: RecruitmentField[] = [
  { id: "fullName", label: "What should we call you?", type: "text", required: true, description: "Your full name, as you'd like it to appear on your application." },
  { id: "email", label: "Where can we reach you?", type: "email", required: true, description: "We've filled in your account email. Use an address you check for application updates." },
  { id: "course", label: "What are you studying, and which year are you in?", type: "text", required: true, placeholder: "B.Tech in Computer Science, second year" },
  { id: "teamPreference", label: "Where would you most like to contribute?", type: "select", required: true, options: ["Development", "Design", "Events and operations", "Marketing and community", "I'm still exploring"], description: "This helps us understand your interests. It doesn't lock you into a team." },
  { id: "skills", label: "What are you comfortable doing—or learning right now?", type: "textarea", required: true, description: "Include technical, creative, or organizational skills. Starting from scratch is a valid answer." },
  { id: "priorExperience", label: "Tell us about something you've made, organized, or learned.", type: "textarea", required: true, description: "A class assignment, personal project, event, or small learning exercise all count. What was your part, and what did you learn?" },
  { id: "portfolioUrl", label: "Is there a piece of work you'd like us to see?", type: "url", description: "A project, design, article, or portfolio link. Skip this if you don't have one yet.", placeholder: "https://" },
  { id: "profileUrl", label: "Would you like to share a professional or coding profile?", type: "url", description: "For example, GitHub or LinkedIn. A public profile is not required to join.", placeholder: "https://" },
  { id: "whyJoin", label: "Why would you like to join SDC?", type: "textarea", required: true, description: "What would you like to learn, and what would you like to contribute? A few thoughtful sentences are enough." },
  { id: "teamwork", label: "How do you work with other people?", type: "textarea", required: true, description: "Share a time you helped a team or handled a disagreement. If you haven't worked in a team yet, tell us how you'd approach it." },
  { id: "availability", label: "How much time could you realistically contribute each week?", type: "select", required: true, options: ["1–2 hours", "3–5 hours", "6–8 hours", "More than 8 hours", "It varies; I'd like to discuss it"], description: "Keep classes and other commitments in mind. This is a conversation starter, not a promise." },
  { id: "resume", label: "Add your résumé", type: "file", description: "PDF, up to 2 MB. Only you and authorized recruitment reviewers can download it. If you don't have a résumé yet, skip this; your answers give us the background we need." },
  { id: "anythingElse", label: "Is there anything else you'd like us to know?", type: "textarea", description: "You can mention achievements, questions, or support that would help you participate. Share only what you're comfortable sharing." },
  { id: "confirmation", label: "Are you ready to send this for review?", type: "checkbox", required: true, description: "I confirm these answers describe me accurately and understand that submitting an application does not grant membership." },
];
