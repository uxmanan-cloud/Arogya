-- Added comprehensive RLS policies for reports table
create extension if not exists pgcrypto;

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_url text not null,
  file_name text,
  file_size integer,
  content_type text,
  extracted_text text,
  explained_data jsonb,
  status text default 'uploaded' check (status in ('uploaded', 'processing', 'completed', 'failed')),
  uploaded_at timestamp with time zone default now(),
  processed_at timestamp with time zone
);

alter table public.reports enable row level security;

drop policy if exists "Reports are viewable by owner" on public.reports;
create policy "Reports are viewable by owner" on public.reports
  for select using (auth.uid() = user_id);

drop policy if exists "Reports are insertable by owner" on public.reports;
create policy "Reports are insertable by owner" on public.reports
  for insert with check (auth.uid() = user_id);

drop policy if exists "Reports are updatable by owner" on public.reports;
create policy "Reports are updatable by owner" on public.reports
  for update using (auth.uid() = user_id);

drop policy if exists "Reports are deletable by owner" on public.reports;
create policy "Reports are deletable by owner" on public.reports
  for delete using (auth.uid() = user_id);
