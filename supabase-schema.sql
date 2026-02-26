-- text2scratch cloud storage schema for Supabase
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  email text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_username_idx on public.profiles(username);
create index if not exists profiles_email_idx on public.profiles(email);

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_profiles_updated_at();

create or replace function public.ensure_profile_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  raw_username text;
  base_username text;
  candidate_username text;
  suffix int := 0;
begin
  raw_username := lower(coalesce(new.raw_user_meta_data ->> 'username', ''));
  base_username := regexp_replace(raw_username, '[^a-z0-9_]', '', 'g');

  if length(base_username) < 3 then
    base_username := 'user_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  base_username := substr(base_username, 1, 28);
  candidate_username := base_username;

  while exists (
    select 1
    from public.profiles p
    where p.username = candidate_username
      and p.id <> new.id
  ) loop
    suffix := suffix + 1;
    candidate_username := substr(base_username, 1, greatest(1, 28 - length(suffix::text))) || suffix::text;
  end loop;

  insert into public.profiles (id, username, email)
  values (new.id, candidate_username, lower(coalesce(new.email, '')))
  on conflict (id) do update
    set username = excluded.username,
        email = excluded.email,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row
execute function public.ensure_profile_from_auth_user();

drop trigger if exists on_auth_user_updated_profile on auth.users;
create trigger on_auth_user_updated_profile
after update of email, raw_user_meta_data on auth.users
for each row
execute function public.ensure_profile_from_auth_user();

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  owner_username text,
  title text not null,
  source_text text not null,
  is_public boolean not null default false,
  share_slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects add column if not exists owner_username text;

create index if not exists projects_owner_id_idx on public.projects(owner_id);
create index if not exists projects_share_slug_idx on public.projects(share_slug);
create index if not exists projects_updated_at_idx on public.projects(updated_at desc);
create index if not exists projects_owner_username_idx on public.projects(owner_username);

create or replace function public.prepare_project_row()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  resolved_username text;
begin
  select p.username
    into resolved_username
  from public.profiles p
  where p.id = new.owner_id;

  if new.owner_username is null or btrim(new.owner_username) = '' then
    new.owner_username := coalesce(resolved_username, 'unknown');
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists projects_prepare_row on public.projects;
create trigger projects_prepare_row
before insert or update on public.projects
for each row
execute function public.prepare_project_row();

alter table public.profiles enable row level security;
alter table public.projects enable row level security;

drop policy if exists "read own profiles" on public.profiles;
create policy "read own profiles"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "update own profiles" on public.profiles;
create policy "update own profiles"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

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

create or replace function public.resolve_login_email(login_identifier text)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  normalized text;
  resolved_email text;
begin
  normalized := lower(coalesce(login_identifier, ''));

  if normalized = '' then
    return null;
  end if;

  if position('@' in normalized) > 0 then
    return normalized;
  end if;

  select p.email
    into resolved_email
  from public.profiles p
  where p.username = normalized
  limit 1;

  return resolved_email;
end;
$$;

grant execute on function public.resolve_login_email(text) to anon, authenticated;

create or replace function public.is_username_available(candidate_username text)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  normalized text;
begin
  normalized := lower(regexp_replace(coalesce(candidate_username, ''), '[^a-z0-9_]', '', 'g'));

  if length(normalized) < 3 or length(normalized) > 32 then
    return false;
  end if;

  return not exists (
    select 1
    from public.profiles p
    where p.username = normalized
  );
end;
$$;

grant execute on function public.is_username_available(text) to anon, authenticated;

create or replace function public.delete_current_account()
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid;
begin
  current_user_id := auth.uid();
  if current_user_id is null then
    return false;
  end if;

  delete from auth.users where id = current_user_id;
  return true;
end;
$$;

grant execute on function public.delete_current_account() to authenticated;
