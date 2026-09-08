export type FormStatus = "draft" | "published" | "closed" | "archived";

export type FormSettings = {
  allowExternal: boolean;
  requireLogin: boolean;
  allowMultiple: boolean;
  autoFillProfile: boolean;
  quotaPerUser: number;
  quotaPerForm: number;
  collegeDomainOnly: boolean;
};

export type FormField = {
  id?: string;
  type: "short_text" | "long_text" | "email" | "number" | "dropdown" | "checkbox" | "file" | "date" | "rating";
  label: string;
  required: boolean;
  options?: string[];
  autoFillKey?: string | null;
};

export type FormTemplate = {
  id: string;
  title: string;
  description: string | null;
  status: FormStatus;
  settings: FormSettings;
  fields: FormField[];
};

export type FormBuilderValues = Omit<FormTemplate, "id" | "fields"> & {
  description: string;
  fields: Array<Omit<FormField, "options"> & { options?: string }>;
};

export const DEFAULT_FORM_VALUES: FormBuilderValues = {
  title: "",
  description: "",
  status: "draft",
  settings: {
    allowExternal: false,
    requireLogin: true,
    allowMultiple: false,
    autoFillProfile: true,
    quotaPerUser: 1,
    quotaPerForm: 1000,
    collegeDomainOnly: true,
  },
  fields: [],
};

export function templateToBuilderValues(template: FormTemplate): FormBuilderValues {
  return {
    title: template.title,
    description: template.description ?? "",
    status: template.status,
    settings: { ...DEFAULT_FORM_VALUES.settings, ...template.settings },
    fields: template.fields.map((field) => ({
      ...field,
      autoFillKey: field.autoFillKey ?? "",
      options: field.options?.join(", ") ?? "",
    })),
  };
}

export function builderValuesToPayload(values: FormBuilderValues) {
  return {
    ...values,
    title: values.title.trim(),
    description: values.description.trim(),
    settings: {
      ...values.settings,
      quotaPerUser: Math.max(1, values.settings.quotaPerUser),
      quotaPerForm: Math.max(1, values.settings.quotaPerForm),
    },
    fields: values.fields.map((field) => {
      const supportsOptions = field.type === "dropdown" || field.type === "checkbox";
      const options = supportsOptions
        ? Array.from(new Set((field.options ?? "").split(",").map((option) => option.trim()).filter(Boolean)))
        : undefined;

      return {
        type: field.type,
        label: field.label.trim(),
        required: field.required,
        autoFillKey: field.autoFillKey?.trim() || undefined,
        ...(supportsOptions ? { options } : {}),
      };
    }),
  };
}

export function validateBuilderValues(values: FormBuilderValues): string | null {
  if (!values.title.trim()) return "Enter a form title.";
  if (values.settings.quotaPerUser < 1 || values.settings.quotaPerForm < 1) {
    return "Submission quotas must be at least 1.";
  }

  for (const [index, field] of values.fields.entries()) {
    if (!field.label.trim()) return `Enter a label for field ${index + 1}.`;
    if ((field.type === "dropdown" || field.type === "checkbox") &&
        builderValuesToPayload({ ...values, fields: [field] }).fields[0].options?.length === 0) {
      return `Add at least one option for field ${index + 1}.`;
    }
  }

  return null;
}
