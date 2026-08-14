import { test, expect } from "vitest";

import { scanGovernedStyles } from "./style-governance";

test("accepts governed token declarations and utility classes", () => {
  const violations = scanGovernedStyles([
    {
      path: "valid.tsx",
      content: `
        <div className="bg-canvas text-ink p-4 rounded-md shadow-sm" />
        <style>{\`.card {
          color: var(--color-ink);
          padding: var(--space-4);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
        }\`}</style>
      `,
    },
  ]);

  expect(violations).toEqual([]);
});

test("reports non-token colors, spacing, radii, and shadows", () => {
  const violations = scanGovernedStyles([
    {
      path: "invalid.tsx",
      content: `<div className="bg-[#fff] px-[13px] rounded-[9px] shadow-[0_1px_3px_#000]" />`,
    },
  ]);

  expect(violations.map(({ category }) => category)).toEqual([
    "color", "spacing", "radius", "shadow"
  ]);
  expect(violations.every(({ line, column }) => line === 1 && column > 0)).toBe(true);
});
