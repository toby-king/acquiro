-- Acquiro: Supabase Schema
-- All IDs are UUIDs. public.users.id = auth.users.id (shared key).

-- ─── USERS ───────────────────────────────────────────────────────────────────
-- id is the same UUID as auth.users.id — no separate auth_id needed.

create table public.users (
  id                    uuid primary key references auth.users(id) on delete cascade,
  email                 text unique not null,
  name                  text,
  role                  text default 'buyer',
  is_subscribed         boolean default false,
  is_admin              boolean default false,
  subscription_id       text,
  cancel_at             text,
  dealsuite_connected   boolean default false,
  langcliffe_connected  boolean default false,
  magic_link            text,
  magic_link_expires    text,
  created_at            timestamptz default now()
);

create index idx_users_email on public.users(email);
create index idx_users_is_subscribed on public.users(is_subscribed)
  where is_subscribed = true;

-- ─── LEADS ───────────────────────────────────────────────────────────────────

create table public.leads (
  id              uuid primary key default gen_random_uuid(),
  name            text,
  email           text,
  converted       boolean default false,
  completed_form  boolean default false,
  nudged          boolean default false,
  stage           integer,
  created_at      timestamptz default now()
);

create index idx_leads_email on public.leads(email);

-- ─── AGENTS ──────────────────────────────────────────────────────────────────

create table public.agents (
  id              uuid primary key default gen_random_uuid(),
  lead_id         uuid not null references public.leads(id) on delete set null,
  user_id         uuid not null references public.users(id) on delete set null,
  email           text,
  name            text,
  personality     text,
  profanity       boolean,
  traits          text,
  type            text,
  voice           text,
  challenge_style text,
  created_at      timestamptz default now()
);

create index idx_agents_lead_id on public.agents(lead_id);
create index idx_agents_user_id on public.agents(user_id);
create index idx_agents_email on public.agents(email);

-- ─── BUYER INFO ──────────────────────────────────────────────────────────────

create table public.buyer_info (
  id                          uuid primary key default gen_random_uuid(),
  lead_id                     uuid not null references public.leads(id) on delete set null,
  user_id                     uuid not null references public.users(id) on delete set null,
  asset_base                  text,
  business_age                text,
  buyer_type                  text,
  buying_experience           text,
  buying_reason               text,
  company_overview            text,
  contractual_recurrence      text,
  customer_base_type          text,
  deal_structure_preference   text,
  decision_speed              text,
  ebitda_margin_min           text,
  ebitda_range                text,
  employee_headcount          text,
  excluded_sectors            text,
  funding_source              text,
  geography                   text,
  industry_preferences        text,
  initial_budget              text,
  involvement                 text,
  ip_technology               text,
  langcliffe_contact_email    text,
  misc_info                   text,
  physical_digital            text,
  problems                    text,
  is_returning                boolean default false,
  turnover_range              text,
  valuation_range             text,
  created_at                  timestamptz default now()
);

create index idx_buyer_info_lead_id on public.buyer_info(lead_id);
create index idx_buyer_info_user_id on public.buyer_info(user_id);

-- ─── BUSINESS ────────────────────────────────────────────────────────────────

create table public.business (
  id                  uuid primary key default gen_random_uuid(),
  archived            boolean default false,
  asking_price        integer,
  business_name       text not null,
  description         text,
  ebit                integer,
  ebitda              integer,
  franchise_fee       integer,
  freehold            integer,
  image               text,
  investment          integer,
  last_seen_at        timestamptz,
  last_verified_at    timestamptz,
  leadhold            integer,
  listing_id          text,
  location            text,
  more_info           text,
  net_profit          integer,
  other_financials    text,
  region              text,
  rent                integer,
  sector              text,
  sub_sector          text,
  source              text,
  turnover            integer,
  url                 text,
  created_at          timestamptz default now()
);

create index idx_business_listing_id on public.business(listing_id);
create index idx_business_sector on public.business(sector);
create index idx_business_source on public.business(source);
create index idx_business_active on public.business(archived) where archived = false;

-- ─── MATCHES ─────────────────────────────────────────────────────────────────

create table public.matches (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references public.business(id) on delete cascade,
  dismiss_reason  text,
  dismissed       boolean default false,
  score           integer,
  user_id         uuid not null references public.users(id) on delete cascade,
  created_at      timestamptz default now()
);

create index idx_matches_user_active on public.matches(user_id, score desc)
  where dismissed = false;
create index idx_matches_business_id on public.matches(business_id);

-- ─── EMAILS ──────────────────────────────────────────────────────────────────

create table public.emails (
  id          uuid primary key default gen_random_uuid(),
  body        text,
  is_agent    boolean,
  thread_id   text,
  user_id     uuid not null references public.users(id) on delete cascade,
  created_at  timestamptz default now()
);

create index idx_emails_user_id on public.emails(user_id);
create index idx_emails_thread_id on public.emails(thread_id);

-- ─── FEATURE ANNOUNCEMENT ───────────────────────────────────────────────────

create table public.feature_announcement (
  id                uuid primary key default gen_random_uuid(),
  active            boolean,
  completion_field  text,
  cta               text,
  headline          text,
  max_impressions   integer,
  name              text,
  created_at        timestamptz default now()
);

-- ─── USER FEATURE IMPRESSION ────────────────────────────────────────────────

create table public.user_feature_impression (
  id          uuid primary key default gen_random_uuid(),
  feature_id  uuid not null references public.feature_announcement(id) on delete cascade,
  impressions integer,
  user_id     uuid not null references public.users(id) on delete cascade,
  created_at  timestamptz default now()
);

create index idx_user_feature_impression_user_id on public.user_feature_impression(user_id);
create index idx_user_feature_impression_feature_id on public.user_feature_impression(feature_id);
create unique index idx_user_feature_impression_unique
  on public.user_feature_impression(user_id, feature_id);

-- ─── LANGCLIFFE OUTREACH ─────────────────────────────────────────────────────

create table public.langcliffe_outreach (
  id                      uuid primary key default gen_random_uuid(),
  acknowledgment_draft    text,
  business_name           text,
  conversation_history    text,
  draft_body              text,
  im_password             text,
  im_url                  text,
  inbound_email           text,
  langcliffe_contact      text,
  langcliffe_reply_body   text,
  listing_id              text,
  nda_file                text,
  nda_return_draft        text,
  reply_draft             text,
  sent_at                 timestamptz,
  signed_nda_file         text,
  status                  text,
  thread_message_id       text,
  user_id                 uuid not null references public.users(id) on delete cascade,
  created_at              timestamptz default now()
);

create index idx_langcliffe_outreach_user_id on public.langcliffe_outreach(user_id);
create index idx_langcliffe_outreach_status on public.langcliffe_outreach(status);
create index idx_langcliffe_outreach_listing_id on public.langcliffe_outreach(listing_id);

-- ─── PURSUE REQUEST ─────────────────────────────────────────────────────────

create table public.pursue_request (
  id              uuid primary key default gen_random_uuid(),
  admin_notes     text,
  business_id     uuid not null references public.business(id) on delete cascade,
  business_name   text,
  listing_url     text,
  notified_status text,
  status          text,
  user_id         uuid not null references public.users(id) on delete cascade,
  created_at      timestamptz default now()
);

create index idx_pursue_request_user_id on public.pursue_request(user_id);
create index idx_pursue_request_status on public.pursue_request(status);

-- ─── SCRAPE LOG ──────────────────────────────────────────────────────────────

create table public.scrape_log (
  id                  uuid primary key default gen_random_uuid(),
  last_run            timestamptz,
  matches_made        integer,
  records_added       integer,
  records_archived    integer,
  created_at          timestamptz default now()
);

-- ─── SOURCES ─────────────────────────────────────────────────────────────────

create table public.sources (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  url         text,
  created_at  timestamptz default now()
);

-- ─── USER NOTIFICATION ───────────────────────────────────────────────────────

create table public.user_notification (
  id                      uuid primary key default gen_random_uuid(),
  body                    text,
  langcliffe_outreach     text,
  status                  text,
  title                   text,
  type                    text,
  user_id                 uuid not null references public.users(id) on delete cascade,
  created_at              timestamptz default now()
);

create index idx_user_notification_user_unread
  on public.user_notification(user_id, created_at desc)
  where status = 'unread';

-- ─── AUTH: AUTO-CREATE PUBLIC USER ON SIGNUP ─────────────────────────────────
-- When Supabase Auth creates an auth.users row (magic link, OAuth, etc.),
-- this trigger inserts a matching public.users row with the same UUID.

create or replace function public.handle_new_auth_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (email) do update
    set id = new.id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────────────────────
-- Server uses service_role key (bypasses RLS). These policies apply
-- only if you later add direct client-side Supabase queries.

alter table public.users enable row level security;
alter table public.leads enable row level security;
alter table public.agents enable row level security;
alter table public.buyer_info enable row level security;
alter table public.business enable row level security;
alter table public.matches enable row level security;
alter table public.emails enable row level security;
alter table public.langcliffe_outreach enable row level security;
alter table public.user_notification enable row level security;
alter table public.pursue_request enable row level security;
alter table public.feature_announcement enable row level security;
alter table public.user_feature_impression enable row level security;

-- Users can read/update their own profile
create policy "users_select_own" on public.users
  for select using (id = auth.uid());
create policy "users_update_own" on public.users
  for update using (id = auth.uid());

-- Users can read their own related records
create policy "agents_select_own" on public.agents
  for select using (user_id = auth.uid());
create policy "buyer_info_select_own" on public.buyer_info
  for select using (user_id = auth.uid());
create policy "matches_select_own" on public.matches
  for select using (user_id = auth.uid());
create policy "emails_select_own" on public.emails
  for select using (user_id = auth.uid());
create policy "notifications_select_own" on public.user_notification
  for select using (user_id = auth.uid());
create policy "pursue_request_select_own" on public.pursue_request
  for select using (user_id = auth.uid());

-- Businesses and features readable by any authenticated user
create policy "business_select_authenticated" on public.business
  for select using (auth.role() = 'authenticated');
create policy "feature_select_authenticated" on public.feature_announcement
  for select using (auth.role() = 'authenticated');

-- Admin: full read access
create policy "admin_select_all_users" on public.users
  for select using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );
create policy "admin_select_all_matches" on public.matches
  for select using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );
create policy "admin_select_all_notifications" on public.user_notification
  for select using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );
