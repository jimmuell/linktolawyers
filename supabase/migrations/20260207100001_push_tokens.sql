-- Push notification tokens for Expo push notifications
-- Users can have multiple tokens (one per device)

create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('ios', 'android', 'web')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- One token per user per device (token is unique per device)
  unique (user_id, token)
);

create index idx_push_tokens_user_id on public.push_tokens (user_id);

create trigger push_tokens_updated_at
  before update on public.push_tokens
  for each row
  execute function public.handle_updated_at();
