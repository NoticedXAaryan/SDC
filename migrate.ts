require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
import { db } from './lib/db';

async function migrate() {
  try {
    await db.execute('ALTER TABLE events ADD COLUMN IF NOT EXISTS "budgetId" text;');
    console.log('success');
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}

migrate();
