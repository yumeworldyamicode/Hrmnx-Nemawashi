-- indesign Step 10: secure provider OAuth storage
-- Run after Step 8. OAuth state and encrypted tokens are server-only.
-- The browser must never receive refresh tokens or encryption keys.

create table if not exists public.indesign_oauth_states (
  id uuid primary key default gen_random_uuid(),
  state_hash text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('figma', 'adobe', 'canva')),
  pkce_verifier text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.indesign_oauth_states enable row level security;
revoke all on public.indesign_oauth_states from anon, authenticated;
grant all on public.indesign_oauth_states to service_role;

create index if not exists indesign_oauth_states_expiry_idx
  on public.indesign_oauth_states (expires_at);

create table if not exists public.indesign_integration_secrets (
  connection_id uuid primary key references public.indesign_integration_connections(id) on delete cascade,
  token_ciphertext text not null,
  token_iv text not null,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.indesign_integration_secrets enable row level security;
revoke all on public.indesign_integration_secrets from anon, authenticated;
grant all on public.indesign_integration_secrets to service_role;

-- Remove expired one-time OAuth states. This can also be called manually.
delete from public.indesign_oauth_states where expires_at < now();
