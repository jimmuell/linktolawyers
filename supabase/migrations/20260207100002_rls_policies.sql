-- ============================================================
-- Row Level Security policies for Phase 1 tables
-- ============================================================

-- ----------------------
-- profiles
-- ----------------------
alter table public.profiles enable row level security;

-- Anyone authenticated can read any profile (needed for attorney browsing)
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

-- Users can only update their own profile
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Users can insert their own profile (for signup flow)
create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- ----------------------
-- attorney_profiles
-- ----------------------
alter table public.attorney_profiles enable row level security;

-- Anyone authenticated can view attorney profiles (needed for client browsing)
create policy "Attorney profiles are viewable by authenticated users"
  on public.attorney_profiles for select
  to authenticated
  using (true);

-- Attorneys can update their own attorney profile
create policy "Attorneys can update their own attorney profile"
  on public.attorney_profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Attorneys can insert their own attorney profile
create policy "Attorneys can insert their own attorney profile"
  on public.attorney_profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- ----------------------
-- push_tokens
-- ----------------------
alter table public.push_tokens enable row level security;

-- Users can only see their own push tokens
create policy "Users can view their own push tokens"
  on public.push_tokens for select
  to authenticated
  using (auth.uid() = user_id);

-- Users can insert their own push tokens
create policy "Users can insert their own push tokens"
  on public.push_tokens for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can update their own push tokens
create policy "Users can update their own push tokens"
  on public.push_tokens for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own push tokens (e.g., on logout)
create policy "Users can delete their own push tokens"
  on public.push_tokens for delete
  to authenticated
  using (auth.uid() = user_id);
