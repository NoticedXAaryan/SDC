import { z } from "zod";
export const COLLEGE_EMAIL_DOMAIN = "goa.paruluniversity.ac.in";
export function isCollegeEmail(value: string) {
  const email = value.trim().toLowerCase();
  return z.email().safeParse(email).success && email.split("@")[1] === COLLEGE_EMAIL_DOMAIN;
}
export const collegeDetailsSchema = z.object({
  email: z.string().trim().toLowerCase().refine(isCollegeEmail, `Use your @${COLLEGE_EMAIL_DOMAIN} address.`),
  enrollmentNumber: z.string().trim().min(4, "Enter your enrollment number.").max(50).regex(/^[a-zA-Z0-9 /-]+$/, "Check your enrollment number."),
  collegeName: z.string().trim().min(3, "Enter your college name.").max(150),
});
