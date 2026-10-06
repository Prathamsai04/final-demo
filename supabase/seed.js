// Seeds a Supabase database with the same demo data used by demo mode.
// Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node supabase/seed.js
import { createClient } from '@supabase/supabase-js';
import { buildSeed } from '../shared/seed/index.js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const toSnake = (k) => k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
const toRow = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [toSnake(k), v]));

const seed = buildSeed();
for (const table of ['users', 'properties', 'bookings']) {
  const { error } = await db.from(table).upsert(seed[table].map(toRow));
  if (error) {
    console.error(`Failed seeding ${table}:`, error.message);
    process.exit(1);
  }
  console.log(`Seeded ${seed[table].length} ${table}`);
}
