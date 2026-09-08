import { describe, expect, it } from "vitest";
import {
  builderValuesToPayload,
  DEFAULT_FORM_VALUES,
  templateToBuilderValues,
  validateBuilderValues,
  type FormBuilderValues,
} from "@/app/(dashboard)/admin/forms/components/form-builder-contract";

describe("admin form builder contract", () => {
  it("normalizes values into the API contract", () => {
    const values: FormBuilderValues = {
      ...DEFAULT_FORM_VALUES,
      title: "  Recruitment  ",
      description: "  Join us  ",
      fields: [{
        type: "dropdown",
        label: "  Track  ",
        required: true,
        options: " Design, Engineering, Design,  ",
        autoFillKey: "  branch  ",
      }],
    };

    expect(builderValuesToPayload(values)).toMatchObject({
      title: "Recruitment",
      description: "Join us",
      fields: [{
        type: "dropdown",
        label: "Track",
        required: true,
        options: ["Design", "Engineering"],
        autoFillKey: "branch",
      }],
    });
  });

  it("round-trips persisted option arrays for editing", () => {
    const values = templateToBuilderValues({
      id: "form-1",
      title: "Recruitment",
      description: null,
      status: "draft",
      settings: DEFAULT_FORM_VALUES.settings,
      fields: [{ type: "checkbox", label: "Skills", required: false, options: ["React", "Design"] }],
    });

    expect(values.fields[0].options).toBe("React, Design");
    expect(builderValuesToPayload(values).fields[0].options).toEqual(["React", "Design"]);
  });

  it("rejects blank labels, empty choices, and invalid quotas", () => {
    expect(validateBuilderValues({ ...DEFAULT_FORM_VALUES, title: "" })).toMatch(/title/i);
    expect(validateBuilderValues({
      ...DEFAULT_FORM_VALUES,
      title: "Survey",
      fields: [{ type: "dropdown", label: "Choice", required: false, options: " , " }],
    })).toMatch(/option/i);
    expect(validateBuilderValues({
      ...DEFAULT_FORM_VALUES,
      title: "Survey",
      settings: { ...DEFAULT_FORM_VALUES.settings, quotaPerUser: 0 },
    })).toMatch(/quota/i);
  });
});
