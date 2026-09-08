import { describe, expect, it } from "vitest";

import { isFormFieldVisible } from "@/lib/forms/visibility";
import { formDefinitionSchema } from "@/lib/validators/forms";

describe("forms workflow", () => {
  it("creates a usable draft from the minimal create-form payload", () => {
    const form = formDefinitionSchema.parse({ title: "Untitled form", fields: [] });

    expect(form.status).toBe("draft");
    expect(form.settings).toMatchObject({
      allowExternal: false,
      requireLogin: true,
      quotaPerUser: 1,
      quotaPerForm: 1000,
    });
  });

  it("preserves builder-only layout fields and conditional logic", () => {
    const form = formDefinitionSchema.parse({
      title: "Event feedback",
      fields: [
        { id: "07a73baf-a905-42c9-b781-545d17b626e8", type: "section_break", label: "Experience" },
        {
          id: "4861434b-03c1-4504-a0ce-868a693457f4",
          type: "long_text",
          label: "What should we improve?",
          visibilityRules: {
            showIf: [{ fieldId: "rating", operator: "equals", value: 2 }],
          },
        },
      ],
    });

    expect(form.fields[0].type).toBe("section_break");
    expect(form.fields[1].visibilityRules?.showIf).toHaveLength(1);
  });

  it("hides conditional questions until their rule matches", () => {
    const field = {
      visibilityRules: {
        showIf: [{ fieldId: "rating", operator: "equals" as const, value: 2 }],
      },
    };

    expect(isFormFieldVisible(field, { rating: 5 })).toBe(false);
    expect(isFormFieldVisible(field, { rating: 2 })).toBe(true);
  });
});
