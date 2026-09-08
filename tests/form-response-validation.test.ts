import { describe, expect, it } from "vitest";
import { buildResponseSchema, isUniversityEmail } from "@/lib/forms/response-validation";

describe("form response validation", () => {
  const schema = buildResponseSchema([
    { id: "track", type: "dropdown", required: true, options: ["Design", "Engineering"] },
    { id: "skills", type: "checkbox", required: true, options: ["React", "Figma"] },
    { id: "date", type: "date", required: true, options: null },
    { id: "file", type: "file", required: false, options: null },
  ]);

  it("accepts valid structured answers", () => {
    expect(schema.safeParse({
      track: "Engineering",
      skills: ["React"],
      date: "2026-08-26",
      file: "https://files.example/resume.pdf",
    }).success).toBe(true);
  });

  it("rejects invalid options, arbitrary objects, and unknown fields", () => {
    expect(schema.safeParse({ track: "Other", skills: ["React"], date: "2026-08-26" }).success).toBe(false);
    expect(schema.safeParse({ track: "Design", skills: ["React"], date: "not-a-date", file: {} }).success).toBe(false);
    expect(schema.safeParse({ track: "Design", skills: ["React"], date: "2026-08-26", injected: true }).success).toBe(false);
  });

  it("allows an empty answer for optional checkbox fields", () => {
    const optional = buildResponseSchema([
      { id: "skills", type: "checkbox", required: false, options: ["React"] },
    ]);
    expect(optional.safeParse({ skills: [] }).success).toBe(true);
  });

  it("uses the university domains configured by authentication", () => {
    expect(isUniversityEmail("student@goa.paruluniversity.ac.in")).toBe(true);
    expect(isUniversityEmail("student@paruluniversity.ac.in")).toBe(true);
    expect(isUniversityEmail("student@college.edu.in")).toBe(false);
  });
});
