import { Pool } from 'pg';

// Supabase's Postgres always terminates TLS with a cert not in Node's default
// trust store; rejectUnauthorized:false still gets an encrypted connection,
// it just skips chain-of-trust verification (standard for Supabase's pooler
// and direct connection strings alike).
export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase.co')
    ? { rejectUnauthorized: false }
    : undefined,
});
