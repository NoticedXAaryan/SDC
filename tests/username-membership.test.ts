import { describe, expect, it } from "vitest";
import { usernameError, normalizeUsername } from "@/lib/username-policy";
import { isClubMember, membershipLabel } from "@/lib/membership";
import { enrollmentFields, recruitmentFieldsSchema, validateRecruitmentAnswers } from "@/lib/recruitment-form";
import { membershipQuestions } from "@/lib/constants/membership-questions";
describe("Account and membership policies", () => {
  it("provides a complete beginner-friendly questionnaire with required private résumé upload", () => {
    expect(recruitmentFieldsSchema.safeParse(membershipQuestions).success).toBe(true);
    expect(membershipQuestions.map(field => field.id)).toEqual(expect.arrayContaining(["fullName", "email", "course", "priorExperience", "teamwork", "availability", "resume", "confirmation"]));
    expect(membershipQuestions.find(field => field.id === "resume")).toMatchObject({ type: "file" });
    const fields = enrollmentFields(membershipQuestions);
    expect(fields.find(field => field.type === "file")?.required).toBe(true);
    expect(fields.find(field => field.type === "username")?.required).toBe(true);
    expect(fields.filter(field => field.type === "url").every(field => !field.required)).toBe(true);
  });
  it("adds mandatory enrollment steps without colliding with legacy question IDs", () => {
    const fields = enrollmentFields([{ id: "resume", label: "Experience summary", type: "textarea" }, { id: "resume_file", label: "Portfolio", type: "url" }]);
    expect(recruitmentFieldsSchema.safeParse(fields).success).toBe(true);
    expect(fields.find(field => field.type === "file")?.id).toBe("resume_file_file");
    expect(enrollmentFields(fields)).toEqual(fields);
    expect(validateRecruitmentAnswers(fields, { requestedUsername: "valid_handle" })).toContain("CV");
  });
  it("normalizes handles and rejects reserved or malformed input", () => {
    expect(normalizeUsername(" Test_Name ")).toBe("test_name");
    for (const value of [null, {}, 12, "ad", "user-name", " ADMIN ", "a".repeat(21)]) expect(usernameError(value)).toBeTruthy();
    expect(usernameError("Valid_Name")).toBeNull();
  });
  it("does not confuse accounts, applicants, or unknown roles with members", () => {
    for (const role of [null, undefined, "outsider", "user", "applicant", "future-role"]) expect(isClubMember(role)).toBe(false);
    for (const role of ["member", "alumni", "admin", "owner", "co_lead", "lead", "tech_lead"]) expect(isClubMember(role)).toBe(true);
    expect(membershipLabel("outsider")).toBe("Participant");
    expect(membershipLabel("applicant")).toBe("Applicant");
    expect(membershipLabel("co_lead")).toBe("Co Lead");
  });
  it("validates the active form's required questions, types and choices", () => {
    const fields = recruitmentFieldsSchema.parse([
      { id: "why", label: "Why join?", type: "textarea", required: true },
      { id: "team", question: "Team", type: "select", required: true, options: ["design", "tech"] },
      { id: "link", label: "Portfolio", type: "url" },
    ]);
    expect(validateRecruitmentAnswers(fields, { why: " ", team: "design" })).toBeTruthy();
    expect(validateRecruitmentAnswers(fields, { why: "To learn", team: "admin" })).toBeTruthy();
    expect(validateRecruitmentAnswers(fields, { why: "To learn", team: "tech", link: "javascript:alert(1)" })).toBeTruthy();
    expect(validateRecruitmentAnswers(fields, { why: "To learn", team: "tech" })).toBeNull();
  });
});
