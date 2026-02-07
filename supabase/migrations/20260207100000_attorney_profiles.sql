-- Attorney profiles: extended info for users with role = 'attorney'
-- Links 1:1 to auth.users via id (same as profiles table)

create table public.attorney_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  bar_number text not null,
  bar_state text not null,
  practice_areas text[] not null default '{}',
  years_of_experience integer,
  bio text,
  hourly_rate numeric(10, 2),
  is_verified boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for browsing attorneys by practice area
create index idx_attorney_profiles_practice_areas on public.attorney_profiles using gin (practice_areas);

-- Index for filtering by state
create index idx_attorney_profiles_bar_state on public.attorney_profiles (bar_state);

-- Index for verified attorneys
create index idx_attorney_profiles_verified on public.attorney_profiles (is_verified) where is_verified = true;

-- Auto-update updated_at on row change
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger attorney_profiles_updated_at
  before update on public.attorney_profiles
  for each row
  execute function public.handle_updated_at();
