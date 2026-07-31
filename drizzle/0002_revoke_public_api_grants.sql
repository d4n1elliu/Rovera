-- Remove the blanket table privileges Supabase grants to the two roles that
-- back the public anon key.
--
-- Supabase grants anon and authenticated full CRUD on everything in `public`
-- by default, on the assumption that clients reach the database through
-- PostgREST and that RLS policies do the gatekeeping. This application never
-- uses that path: every query goes through the repositories, which connect as
-- `postgres`.
--
-- Migration 0001 already denies these roles via RLS. This is the second layer.
-- With RLS alone, a single `disable row level security` or one over-broad
-- policy hands full read/write back to anyone holding the anon key — a value
-- that ships to browsers by design. Removing the privilege as well means a
-- mistake in either layer is not, on its own, enough to expose the data.
--
-- service_role is deliberately left untouched: it is the intended escape hatch
-- for trusted server-side tooling, and it is never exposed to browsers.

revoke all privileges on all tables in schema public from anon, authenticated;
--> statement-breakpoint
revoke all privileges on all sequences in schema public from anon, authenticated;
--> statement-breakpoint
revoke all privileges on all functions in schema public from anon, authenticated;
--> statement-breakpoint

-- The statements above only affect objects that exist right now. Supabase also
-- configures DEFAULT privileges, so a table created tomorrow would be granted
-- to anon all over again. These clear that for objects created by `postgres`,
-- the role migrations run as, so every future table starts with no public-API
-- privileges instead of relying on someone remembering.
--
-- Scoped `for role postgres` on purpose: Supabase configures a parallel set
-- owned by `supabase_admin`, which this role is not a member of and cannot
-- alter. Those apply only to objects supabase_admin itself creates, which does
-- not include anything in this schema.

alter default privileges for role postgres in schema public
  revoke all privileges on tables from anon, authenticated;
--> statement-breakpoint
alter default privileges for role postgres in schema public
  revoke all privileges on sequences from anon, authenticated;
--> statement-breakpoint
alter default privileges for role postgres in schema public
  revoke all privileges on functions from anon, authenticated;
