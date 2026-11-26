-- Follow-Up Machine — database schema for Supabase (Postgres).
-- Run this once in the Supabase SQL editor. Column names are the snake_case
-- form of the fields in lib/types.ts; the app converts between the two.
--
-- Access model: the app talks to the database from the server with the
-- service-role key, and scopes every query by tenant_id. Row Level Security is
-- switched on with no policies, so the public (anon) key can read nothing.
-- Per-user policies arrive with Supabase Auth in v2 (see docs/ROADMAP.md).

create table if not exists tenants (
  id text primary key,
  slug text not null unique,
  name text not null,
  industry text not null default '',
  plan text not null default 'starter' check (plan in ('starter', 'growth', 'premium')),
  monthly_price numeric not null default 0,
  status text not null default 'onboarding' check (status in ('active', 'onboarding', 'paused')),
  tagline text not null default '',
  knowledge_base text not null default '',
  services jsonb not null default '[]',
  settings jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists contacts (
  id text primary key,
  tenant_id text not null references tenants (id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  email text not null default '',
  phone text not null default '',
  source text not null default 'web_form',
  stage text not null default 'new' check (stage in ('new', 'contacted', 'engaged', 'booked', 'won', 'nurture', 'lost')),
  interest text not null default '',
  tags jsonb not null default '[]',
  sms_consent boolean not null default false,
  email_consent boolean not null default false,
  opted_out boolean not null default false,
  urgent boolean not null default false,
  score integer not null default 50,
  value numeric not null default 0,
  owner text not null default '',
  created_at timestamptz not null default now(),
  last_outbound_at timestamptz,
  last_inbound_at timestamptz
);
create index if not exists contacts_tenant on contacts (tenant_id, stage);
create index if not exists contacts_phone on contacts (tenant_id, phone);
create index if not exists contacts_email on contacts (tenant_id, lower(email));

create table if not exists activities (
  id text primary key,
  tenant_id text not null references tenants (id) on delete cascade,
  contact_id text not null references contacts (id) on delete cascade,
  type text not null,
  status text not null default 'logged',
  agent text not null default 'owner',
  summary text not null default '',
  body text not null default '',
  subject text not null default '',
  sequence_key text not null default '',
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists activities_tenant on activities (tenant_id, created_at desc);
create index if not exists activities_contact on activities (contact_id, created_at desc);
create index if not exists activities_pending on activities (tenant_id) where status = 'pending_approval';

create table if not exists sequences (
  id text primary key,
  tenant_id text not null references tenants (id) on delete cascade,
  key text not null,
  name text not null,
  description text not null default '',
  active boolean not null default true,
  stop_on_reply boolean not null default true,
  loop_from_step integer,
  then_start text,
  steps jsonb not null default '[]',
  unique (tenant_id, key)
);

create table if not exists enrollments (
  id text primary key,
  tenant_id text not null references tenants (id) on delete cascade,
  contact_id text not null references contacts (id) on delete cascade,
  sequence_key text not null,
  step_index integer not null default 0,
  next_run_at timestamptz not null,
  status text not null default 'active' check (status in ('active', 'completed', 'stopped')),
  stopped_reason text not null default '',
  appointment_id text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists enrollments_due on enrollments (next_run_at) where status = 'active';
create index if not exists enrollments_contact on enrollments (contact_id, status);

create table if not exists templates (
  id text primary key,
  tenant_id text not null references tenants (id) on delete cascade,
  key text not null,
  name text not null,
  channel text not null check (channel in ('sms', 'email', 'call')),
  subject text not null default '',
  body text not null default '',
  unique (tenant_id, key)
);

create table if not exists appointments (
  id text primary key,
  tenant_id text not null references tenants (id) on delete cascade,
  contact_id text not null references contacts (id) on delete cascade,
  title text not null default '',
  starts_at timestamptz not null,
  duration_minutes integer not null default 60,
  location text not null default '',
  status text not null default 'scheduled' check (status in ('scheduled', 'confirmed', 'completed', 'no_show', 'cancelled')),
  booked_by text not null default 'owner',
  created_at timestamptz not null default now()
);
create index if not exists appointments_tenant on appointments (tenant_id, starts_at);

create table if not exists reviews (
  id text primary key,
  tenant_id text not null references tenants (id) on delete cascade,
  contact_id text not null references contacts (id) on delete cascade,
  platform text not null default 'Google',
  rating integer not null default 0,
  text text not null default '',
  status text not null default 'requested' check (status in ('requested', 'received', 'responded')),
  response text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists social_posts (
  id text primary key,
  tenant_id text not null references tenants (id) on delete cascade,
  campaign text not null default '',
  platforms jsonb not null default '[]',
  caption text not null default '',
  media_prompt text not null default '',
  media_url text not null default '',
  scheduled_at timestamptz,
  status text not null default 'idea' check (status in ('idea', 'pending_approval', 'scheduled', 'published')),
  external_id text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id text primary key,
  tenant_id text not null references tenants (id) on delete cascade,
  contact_id text not null references contacts (id) on delete cascade,
  title text not null,
  detail text not null default '',
  urgent boolean not null default false,
  status text not null default 'open' check (status in ('open', 'done')),
  due_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists tasks_open on tasks (tenant_id) where status = 'open';

alter table tenants enable row level security;
alter table contacts enable row level security;
alter table activities enable row level security;
alter table sequences enable row level security;
alter table enrollments enable row level security;
alter table templates enable row level security;
alter table appointments enable row level security;
alter table reviews enable row level security;
alter table social_posts enable row level security;
alter table tasks enable row level security;
