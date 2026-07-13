export type FormField = {
  id: string;
  label: string;
  type: "text" | "email" | "tel" | "url" | "textarea" | "select" | "multiselect";
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  description?: string;
};

export type FormStep = {
  id: string;
  title: string;
  fields: FormField[];
};

// This is the schema-driven definition of the recruitment form.
// In a fully dynamic system, this could be fetched from the database (e.g. club_settings).
export const recruitmentFormSchema: FormStep[] = [
  {
    id: "step1",
    title: "Basic Info",
    fields: [
      { id: "fullName", label: "Full Name", type: "text", placeholder: "John Doe", required: true },
      { id: "email", label: "Email", type: "email", placeholder: "john@example.com", required: true },
      { id: "course", label: "Course & Year", type: "text", placeholder: "B.Tech CS, 2nd Year", required: true },
      { id: "phone", label: "Phone Number", type: "tel", placeholder: "+1234567890", required: true },
    ]
  },
  {
    id: "step2",
    title: "Professional Links",
    fields: [
      { id: "linkedinUrl", label: "LinkedIn URL", type: "url", placeholder: "https://linkedin.com/in/username", required: true },
      { id: "githubUrl", label: "GitHub URL", type: "url", placeholder: "https://github.com/username", required: true },
      { id: "portfolioUrl", label: "Portfolio URL (Optional)", type: "url", placeholder: "https://mywebsite.com" },
      { id: "resumeUrl", label: "Resume Link (Optional, Google Drive / Dropbox)", type: "url", placeholder: "https://drive.google.com/..." },
    ]
  },
  {
    id: "step3",
    title: "Skills & Interests",
    fields: [
      { 
        id: "teamPreference", 
        label: "Team Preference", 
        type: "select", 
        required: true,
        options: [
          { label: "Technical", value: "technical" },
          { label: "Design", value: "design" },
          { label: "Management", value: "management" },
          { label: "Marketing", value: "marketing" },
        ]
      },
      { id: "skills", label: "Skills (comma separated)", type: "text", placeholder: "React, Node.js, Figma", required: true },
      { id: "whyJoin", label: "Why do you want to join SDC?", type: "textarea", placeholder: "Your motivation...", required: true },
      { id: "priorExperience", label: "Prior Experience / Projects", type: "textarea", placeholder: "Tell us about what you have built or done before...", required: true },
    ]
  },
  {
    id: "step4",
    title: "Availability",
    fields: [
      { id: "availability", label: "Weekly Time Commitment", type: "text", placeholder: "e.g. 10 hours/week, mostly evenings", required: true },
    ]
  }
];
