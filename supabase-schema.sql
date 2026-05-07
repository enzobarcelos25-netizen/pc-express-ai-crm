create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  site_lead_id text unique,
  nome text not null,
  telefone text,
  telefone_normalizado text,
  problema text,
  recomendacao text,
  explicacao text,
  status text not null default 'novo',
  score int not null default 50,
  consent boolean not null default false,
  source text,
  page_url text,
  user_agent text,
  answers jsonb,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_status_idx on public.leads(status);
create index if not exists leads_created_at_idx on public.leads(created_at desc);
create index if not exists leads_telefone_normalizado_idx on public.leads(telefone_normalizado);
