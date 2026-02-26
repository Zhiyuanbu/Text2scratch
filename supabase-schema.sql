-- text2scratch cloud storage schema for Supabase
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  source_text text not null,
  is_public boolean not null default false,
  share_slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_owner_id_idx on public.projects(owner_id);
create index if not exists projects_share_slug_idx on public.projects(share_slug);
create index if not exists projects_updated_at_idx on public.projects(updated_at desc);

create or replace function public.set_projects_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row
execute function public.set_projects_updated_at();

alter table public.projects enable row level security;

drop policy if exists "read own projects" on public.projects;
create policy "read own projects"
on public.projects
for select
to authenticated
using (auth.uid() = owner_id);

drop policy if exists "insert own projects" on public.projects;
create policy "insert own projects"
on public.projects
for insert
to authenticated
with check (auth.uid() = owner_id);

drop policy if exists "update own projects" on public.projects;
create policy "update own projects"
on public.projects
for update
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "delete own projects" on public.projects;
create policy "delete own projects"
on public.projects
for delete
to authenticated
using (auth.uid() = owner_id);

drop policy if exists "read shared projects" on public.projects;
create policy "read shared projects"
on public.projects
for select
to anon, authenticated
using (is_public = true and share_slug is not null);
