/** Validate the database name itself, never a hostname or password substring. */
export function assertTestDatabase(value: string | undefined): asserts value is string {
  let valid = false;
  try {
    const url = new URL(value || "");
    const name = decodeURIComponent(url.pathname.slice(1));
    valid = ["postgres:", "postgresql:"].includes(url.protocol) && /(^|[_-])test([_-]|$)/i.test(name);
  } catch { /* Report one actionable configuration error below. */ }
  if (!valid) throw new Error("TEST_DATABASE_URL must target a disposable database with a 'test' segment in its name, such as sdc_test. Integration tests reset its schema.");
}
