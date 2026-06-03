-- Run this in Supabase SQL editor (Dashboard → SQL Editor → New query)
-- Enable pgvector extension first
create extension if not exists vector;

-- ── Users (extends Supabase auth.users) ───────────────────────────
create table public.profiles (
  id           uuid references auth.users on delete cascade primary key,
  username     text unique,
  expertise    text[],                    -- ['AI', 'marketing', 'finance']
  budget_range text,                      -- 'bootstrap' | 'small' | 'funded'
  looking_for  text[],                    -- ['co-founder', 'investor', 'developer']
  bio          text,
  avatar_url   text,
  created_at   timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "profiles are viewable by everyone" on public.profiles for select using (true);
create policy "users can update own profile" on public.profiles for update using (auth.uid() = id);

-- ── Niches ────────────────────────────────────────────────────────
create table public.niches (
  id              uuid default gen_random_uuid() primary key,
  name            text not null,
  category        text,                   -- 'ai_saas' | 'health' | 'b2b' | 'creator'
  why_summary     text,                   -- 1-line reason it's in the list
  signal_score    int,                    -- 0-100
  fit_score       int,                    -- 0-100
  mvp_weeks       int,                    -- estimated weeks to MVP
  competition     text,                   -- 'low' | 'medium' | 'high'
  tags            text[],
  embedding       vector(1536),           -- pgvector for semantic dedup
  scan_id         uuid,                   -- which scan produced this
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index niches_embedding_idx on public.niches using ivfflat (embedding vector_cosine_ops);
create index niches_signal_idx on public.niches (signal_score desc);

-- ── Raw signals (everything scraped, tagged by source) ────────────
create table public.signals (
  id          uuid default gen_random_uuid() primary key,
  source      text not null,             -- 'reddit' | 'trends' | 'producthunt' | 'meta_ads' | 'appstore'
  source_url  text,                      -- real URL to the original post/page
  title       text,
  content     text,
  metadata    jsonb,                     -- upvotes, comments, date, subreddit, etc.
  niche_id    uuid references public.niches,
  scan_id     uuid,
  created_at  timestamptz default now()
);
create index signals_niche_idx on public.signals (niche_id);
create index signals_source_idx on public.signals (source);

-- ── Competitors ───────────────────────────────────────────────────
create table public.competitors (
  id            uuid default gen_random_uuid() primary key,
  niche_id      uuid references public.niches on delete cascade,
  name          text not null,
  website       text,
  arr_estimate  text,                    -- '~$1.2M ARR'
  funding       text,                    -- '$4M seed'
  team_size     int,
  founded_year  int,
  gaps          text[],                  -- exploitable weaknesses
  strengths     text[],
  ph_url        text,                    -- Product Hunt profile URL
  li_url        text,                    -- LinkedIn URL
  metadata      jsonb,
  created_at    timestamptz default now()
);

-- ── Scans (each full scan run) ────────────────────────────────────
create table public.scans (
  id            uuid default gen_random_uuid() primary key,
  status        text default 'running',  -- 'running' | 'done' | 'failed'
  sources_done  text[],
  niches_found  int default 0,
  signals_found int default 0,
  triggered_by  text default 'auto',    -- 'auto' | 'manual' | user_id
  started_at    timestamptz default now(),
  finished_at   timestamptz
);

-- ── User saved niches ─────────────────────────────────────────────
create table public.saved_niches (
  user_id    uuid references auth.users on delete cascade,
  niche_id   uuid references public.niches on delete cascade,
  saved_at   timestamptz default now(),
  primary key (user_id, niche_id)
);
alter table public.saved_niches enable row level security;
create policy "users manage own saved niches" on public.saved_niches
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Reactions (human-in-the-loop feedback) ────────────────────────
create table public.reactions (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users on delete cascade,
  niche_id   uuid references public.niches on delete cascade,
  reaction   text not null,             -- 'real' | 'not_real' | 'interested'
  comment    text,
  created_at timestamptz default now(),
  unique (user_id, niche_id, reaction)
);
alter table public.reactions enable row level security;
create policy "reactions viewable by all" on public.reactions for select using (true);
create policy "users manage own reactions" on public.reactions
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── User-submitted niche ideas ────────────────────────────────────
create table public.community_niches (
  id           uuid default gen_random_uuid() primary key,
  submitted_by uuid references auth.users on delete cascade,
  name         text not null,
  description  text,
  category     text,
  ai_score     int,                     -- Claude scores it after submission
  upvotes      int default 0,
  status       text default 'pending',  -- 'pending' | 'analyzed' | 'featured'
  created_at   timestamptz default now()
);

-- ── Helper: auto-update updated_at ────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger niches_updated_at before update on public.niches
  for each row execute procedure public.handle_updated_at();
