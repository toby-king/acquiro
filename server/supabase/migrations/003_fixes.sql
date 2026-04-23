-- ─── Fix 1: agents.lead_id and agents.user_id ────────────────────────────────
-- NOT NULL + ON DELETE SET NULL is a contradiction — if the referenced row is
-- deleted, Postgres sets the FK to NULL, which violates NOT NULL immediately.
-- Agents are also created before a user exists (onboarding), so user_id must
-- allow NULL until the subscriber account is created.

alter table public.agents
  alter column lead_id drop not null,
  alter column user_id drop not null;

-- ─── Fix 2: buyer_info.lead_id and buyer_info.user_id ────────────────────────
-- Same contradiction as above. buyer_info is created alongside the lead, before
-- any user row exists.

alter table public.buyer_info
  alter column lead_id drop not null,
  alter column user_id drop not null;

-- ─── Fix 3: matches.match_reason — column missing from schema ─────────────────
-- bubble.ts:610 selects match_reason and the migration script inserts it, but
-- the column was never created.

alter table public.matches
  add column if not exists match_reason text;

-- ─── Fix 4: business.leadhold → leasehold — typo in column name ───────────────
-- Schema used "leadhold" but all application code (bubbleClient.js, migration
-- script, Pinecone metadata) references "leasehold". Every listing insert that
-- includes a leasehold value would either error or silently drop it.

alter table public.business
  rename column leadhold to leasehold;

-- ─── Fix 5: buyer_info.industry_preferences / excluded_sectors — text → text[] ─
-- The extraction endpoint stores these as JSON arrays and reads them back with
-- Array.isArray() checks. The schema had them as plain text, which breaks both
-- reads and writes.

alter table public.buyer_info
  alter column industry_preferences type text[] using
    case
      when industry_preferences is null then null
      when industry_preferences = '' then '{}'::text[]
      else array(select jsonb_array_elements_text(industry_preferences::jsonb))
    end,
  alter column excluded_sectors type text[] using
    case
      when excluded_sectors is null then null
      when excluded_sectors = '' then '{}'::text[]
      else array(select jsonb_array_elements_text(excluded_sectors::jsonb))
    end;
