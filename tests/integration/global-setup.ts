import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as schema from '../../lib/db/schema';
import path from 'path';
import { execSync } from 'child_process';

export default async function setup() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || !dbUrl.includes('test')) {
    throw new Error('Test environment must use a database URL containing "test"');
  }

  // Try starting docker container if it's the default local one, but don't fail if docker is missing
  if (dbUrl.includes('127.0.0.1:5432/sdc_test')) {
    try {
      execSync('docker run --name sdc-test-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=sdc_test -p 5432:5432 -d postgres:15-alpine', { stdio: 'ignore' });
    } catch (e) {
      try { execSync('docker start sdc-test-db', { stdio: 'ignore' }); } catch (e2) {}
    }
  }

  console.log("Connecting to test database...");
  const pool = new Pool({ connectionString: dbUrl });
  
  let retries = 15;
  while (retries > 0) {
    try {
      await pool.query('SELECT 1');
      break;
    } catch (err) {
      retries--;
      if (retries === 0) {
        console.warn("Could not connect to test database. Is it running? Skipping DB setup.");
        return;
      }
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log("Cleaning database...");
  await pool.query(`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`);
  await pool.query(`GRANT ALL ON SCHEMA public TO public;`);
  
  console.log("Running migrations...");
  const db = drizzle(pool, { schema });
  await migrate(db, { migrationsFolder: path.resolve(__dirname, '../../drizzle') });
  await pool.end();
}

export function teardown() {
  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl.includes('127.0.0.1:5432/sdc_test')) {
    try {
      execSync('docker stop sdc-test-db', { stdio: 'ignore' });
    } catch (e) {}
  }
}
