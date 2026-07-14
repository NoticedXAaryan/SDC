import { db } from "../lib/db";
import { formTemplates } from "../lib/db/schema";
import crypto from "crypto";

async function main() {
  const fields = [
    { id: "fullName", type: "text", question: "Full Name", required: true },
    { id: "email", type: "text", question: "Email", required: true },
    { id: "course", type: "text", question: "Course", required: true },
    { id: "phone", type: "text", question: "Phone Number", required: true },
    { id: "skills", type: "text", question: "What are your primary skills?", required: true },
    { id: "teamPreference", type: "radio", question: "Team Preference", options: ["Frontend", "Backend", "Design", "DevOps"], required: true },
    { id: "whyJoin", type: "textarea", question: "Why do you want to join SDC?", required: true },
    { id: "availability", type: "text", question: "Availability (hours per week)", required: true },
    { id: "linkedinUrl", type: "url", question: "LinkedIn Profile URL", required: false },
    { id: "githubUrl", type: "url", question: "GitHub Profile URL", required: false },
    { id: "portfolioUrl", type: "url", question: "Portfolio URL", required: false },
    { id: "resumeUrl", type: "url", question: "Resume Link", required: false }
  ];

  await db.insert(formTemplates).values({
    id: crypto.randomUUID(),
    cycleName: "2026-odd-sem",
    fields: fields,
    isActive: true
  }).onConflictDoNothing();

  console.log("Initialized default form template for 2026-odd-sem.");
}

main().catch(console.error);
