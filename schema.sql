-- motivation. — your own quotes, synced across devices.
-- Run once in the Supabase SQL editor of the project motivation. points at.

create table if not exists public.motivation_quotes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  text        text not null check (char_length(trim(text)) between 1 and 2000),
  author      text not null default '' check (char_length(author) <= 120),
  created_at  timestamptz not null default now()
);

create index if not exists motivation_quotes_user_created
  on public.motivation_quotes (user_id, created_at desc);

-- Row level security: every row belongs to the account that made it, and
-- only that account can see or change it. The anon key alone grants nothing.
alter table public.motivation_quotes enable row level security;

drop policy if exists "own quotes: read"   on public.motivation_quotes;
drop policy if exists "own quotes: insert" on public.motivation_quotes;
drop policy if exists "own quotes: update" on public.motivation_quotes;
drop policy if exists "own quotes: delete" on public.motivation_quotes;

create policy "own quotes: read"   on public.motivation_quotes
  for select using (auth.uid() = user_id);
create policy "own quotes: insert" on public.motivation_quotes
  for insert with check (auth.uid() = user_id);
create policy "own quotes: update" on public.motivation_quotes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own quotes: delete" on public.motivation_quotes
  for delete using (auth.uid() = user_id);
