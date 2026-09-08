export type VisibilityRule = {
  fieldId: string;
  operator: "equals" | "not_equals";
  value: string | number | boolean;
};

export type ConditionalFormField = {
  visibilityRules?: unknown;
};

function valuesMatch(answer: unknown, expected: VisibilityRule["value"]): boolean {
  if (Array.isArray(answer)) {
    return answer.some((value) => String(value) === String(expected));
  }
  return String(answer ?? "") === String(expected);
}

export function isFormFieldVisible(
  field: ConditionalFormField,
  answers: Record<string, unknown>,
): boolean {
  const visibilityRules = field.visibilityRules as { showIf?: VisibilityRule[] } | null | undefined;
  const rules = Array.isArray(visibilityRules?.showIf) ? visibilityRules.showIf : [];
  return rules.every((rule) => {
    const matches = valuesMatch(answers[rule.fieldId], rule.value);
    return rule.operator === "not_equals" ? !matches : matches;
  });
}
