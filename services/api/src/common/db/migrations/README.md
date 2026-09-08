Run against a fresh Supabase project's Postgres database:

```bash
psql "$DATABASE_URL" -f 001_initial.sql
```

Or paste the file's contents into the Supabase dashboard's SQL Editor and run
it there. There's no migration-runner tooling in this repo (no
node-pg-migrate/knex/drizzle) — for a project this size, flat numbered SQL
files run manually are enough. `001_initial.sql` is safe to re-run (every
statement is `CREATE ... IF NOT EXISTS` / idempotent) except the RLS policy
block, which drops and recreates its policies each run on purpose.
