import { z } from "zod";

export type ResponseField = {
  id: string;
  type: string;
  required: boolean | null;
  options: unknown;
  visibilityRules?: unknown;
};

const UNIVERSITY_DOMAINS = new Set([
  "goa.paruluniversity.ac.in",
  "paruluniversity.ac.in",
]);

export function isUniversityEmail(email: string | null | undefined) {
  const domain = email?.trim().toLowerCase().split("@")[1];
  return !!domain && UNIVERSITY_DOMAINS.has(domain);
}

function dateOnlySchema() {
  return z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a date in YYYY-MM-DD format").refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
  }, "Invalid date");
}

function schemaForField(field: ResponseField): z.ZodTypeAny {
  const options = Array.isArray(field.options)
    ? field.options.filter((option): option is string => typeof option === "string")
    : [];
  const requiredString = z.string().trim().min(1).max(10_000);
  let schema: z.ZodTypeAny;

  switch (field.type) {
    case "short_text": schema = z.string().trim().min(1).max(500); break;
    case "long_text": schema = requiredString; break;
    case "email": schema = z.string().trim().email().max(320); break;
    case "number": schema = z.number().finite(); break;
    case "rating": schema = z.number().int().min(1).max(5); break;
    case "dropdown":
      schema = z.string().refine((value) => options.includes(value), "Select a valid option");
      break;
    case "checkbox": {
      let choices = z.array(z.string()).max(options.length || 100).refine(
        (values) => values.every((value) => options.includes(value)),
        "Select only valid options",
      );
      if (field.required) choices = choices.refine((values) => values.length > 0, "Select at least one option");
      schema = choices;
      break;
    }
    case "file": schema = z.string().trim().min(1).max(2_048); break;
    case "date": schema = dateOnlySchema(); break;
    default: schema = z.never();
  }

  return field.required ? schema : schema.optional();
}

export function buildResponseSchema(fields: ResponseField[]) {
  return z.object(Object.fromEntries(fields.map((field) => [field.id, schemaForField(field)]))).strict();
}
