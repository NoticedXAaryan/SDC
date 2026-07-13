import * as z from "zod";

export const applicationSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  course: z.string().min(2, "Course must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  
  linkedinUrl: z.string().url("Must be a valid URL").regex(/linkedin\.com/, "Must be a LinkedIn URL").optional().or(z.literal("")),
  githubUrl: z.string().url("Must be a valid URL").regex(/github\.com/, "Must be a GitHub URL").optional().or(z.literal("")),
  portfolioUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  resumeUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  
  skills: z.array(z.string()).min(1, "Select at least one skill"),
  teamPreference: z.string().min(1, "Select a team preference"),
  whyJoin: z.string().min(10, "Please provide a more detailed reason"),
  priorExperience: z.string().optional(),
  
  availability: z.string().min(1, "Please specify your availability"),
  status: z.enum(["draft", "applied"]).optional()
});

export type ApplicationValues = z.infer<typeof applicationSchema>;
