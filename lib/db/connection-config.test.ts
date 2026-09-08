import { describe, expect, it } from "vitest";
import { getSecurePostgresConnection } from "./connection-config";

describe("secure PostgreSQL connection configuration", () => {
  it("uses plain local connections for Docker and developer databases", () => {
    const config = getSecurePostgresConnection("postgresql://club:secret@localhost:5432/club_test");
    expect(config.ssl).toBe(false);
    expect(config.connectionString).not.toContain("sslmode=");
  });

  it("forces hostname-verified TLS for remote databases", () => {
    const config = getSecurePostgresConnection("postgresql://club:secret@db.example.com/club?sslmode=require");
    expect(config.ssl).toBeUndefined();
    expect(config.connectionString).toContain("sslmode=verify-full");
  });

  it("overrides an unsafe remote SSL mode", () => {
    const config = getSecurePostgresConnection("postgres://club:secret@db.example.com/club?sslmode=disable");
    expect(config.connectionString).toContain("sslmode=verify-full");
  });

  it("rejects non-PostgreSQL URLs", () => {
    expect(() => getSecurePostgresConnection("https://db.example.com/club")).toThrow(
      "postgres or postgresql",
    );
  });
});
