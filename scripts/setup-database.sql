-- Arogya Health App Database Schema
-- Run this SQL in your Supabase SQL Editor

-- 1) Profiles table (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

-- 2) Reports table (per-user documents)
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_url text not null,
  file_name text,
  file_size bigint,
  content_type text,
  extracted_text text,
  explained_data jsonb,
  status text default 'uploaded' check (status in ('uploaded', 'processing', 'completed', 'failed')),
  uploaded_at timestamp with time zone default now(),
  processed_at timestamp with time zone
);

-- Enable RLS on both tables
alter table public.profiles enable row level security;
alter table public.reports enable row level security;

-- RLS Policies for profiles table
create policy "Profiles are viewable by owner" on public.profiles
  for select using (auth.uid() = id);

create policy "Profiles are insertable by owner" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Profiles are updatable by owner" on public.profiles
  for update using (auth.uid() = id);

-- RLS Policies for reports table
create policy "Reports are viewable by owner" on public.reports
  for select using (auth.uid() = user_id);

create policy "Reports are insertable by owner" on public.reports
  for insert with check (auth.uid() = user_id);

create policy "Reports are updatable by owner" on public.reports
  for update using (auth.uid() = user_id);

create policy "Reports are deletable by owner" on public.reports
  for delete using (auth.uid() = user_id);

-- Create indexes for better performance
create index if not exists idx_reports_user_id on public.reports(user_id);
create index if not exists idx_reports_uploaded_at on public.reports(uploaded_at desc);
create index if not exists idx_reports_status on public.reports(status);

-- Create a function to handle user profile creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger to automatically create profile on user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
