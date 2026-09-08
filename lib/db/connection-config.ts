const LOCAL_DATABASE_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export type SecurePostgresConnection = {
  connectionString: string;
  ssl?: false;
};

/**
 * Keep local development simple while requiring hostname-verified TLS for every
 * remote PostgreSQL connection, independent of driver default changes.
 */
export function getSecurePostgresConnection(databaseUrl: string): SecurePostgresConnection {
  const url = new URL(databaseUrl);
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error("DATABASE_URL must use the postgres or postgresql protocol.");
  }

  if (LOCAL_DATABASE_HOSTS.has(url.hostname.toLowerCase())) {
    url.searchParams.delete("sslmode");
    return { connectionString: url.toString(), ssl: false };
  }

  // Pin the strongest libpq-compatible behavior instead of relying on the
  // changing meaning of `require` in future pg releases.
  url.searchParams.set("sslmode", "verify-full");
  return { connectionString: url.toString() };
}
