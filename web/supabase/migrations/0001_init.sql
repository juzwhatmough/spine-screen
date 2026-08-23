-- Spine & Screen — initial schema. Paste this whole block into
-- Supabase Dashboard -> SQL Editor -> New query -> Run. Safe to re-run.

create extension if not exists "pgcrypto";

create table if not exists public.user_profile (
  id uuid primary key references auth.users(id) on delete cascade,
  favorite_authors text[] not null default '{}',
  favorite_genres  text[] not null default '{}',
  loved_books      text[] not null default '{}',
  disliked_books   text[] not null default '{}',
  loved_shows      text[] not null default '{}',   -- reserved for a future Shows port
  disliked_shows   text[] not null default '{}',   -- reserved for a future Shows port
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.list_items (
  id uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  media_type text not null default 'book' check (media_type in ('book','show')),
  title      text not null,
  creator    text,                -- author, for books
  genre      text,
  status     text not null default 'want' check (status in ('want','in_progress','done')),
  rating     text check (rating in ('loved','liked','disliked')),
  meta       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Plain-column unique index (not lower()-normalized) so it can be used
-- directly as a Postgres ON CONFLICT target via Supabase's upsert(...,
-- { onConflict: 'user_id,media_type,title,creator', ignoreDuplicates: true
-- }) — this is what makes the AI-suggestion insert, the onboarding
-- auto-seed, and Juz's one-time 70-book seed all safely re-runnable.
create unique index if not exists list_items_user_unique_title
  on public.list_items (user_id, media_type, title, creator);

create index if not exists list_items_user_media_idx
  on public.list_items (user_id, media_type);

alter table public.user_profile enable row level security;
alter table public.list_items   enable row level security;

drop policy if exists "own profile" on public.user_profile;
create policy "own profile" on public.user_profile
  for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "own list items" on public.list_items;
create policy "own list items" on public.list_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
