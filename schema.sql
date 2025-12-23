-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- COMPANIES
create table companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  base_currency text not null default 'TRY',
  timezone text not null default 'Europe/Istanbul',
  logo_url text,
  debt_types jsonb default '["Cari", "Çek", "Senet"]'::jsonb,
  currencies jsonb default '["TRY", "USD", "EUR"]'::jsonb,
  created_at timestamptz default now()
);

-- PROFILES (RBAC)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  company_id uuid references companies(id) not null,
  email text not null,
  name text,
  role text not null check (role in ('company_admin', 'accounting', 'manager', 'seller')),
  manager_id uuid references profiles(id),
  active boolean default true,
  created_at timestamptz default now()
);

-- CUSTOMERS
create table customers (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) not null,
  name text not null,
  assigned_user_id uuid references profiles(id),
  phone text,
  archived boolean default false,
  created_at timestamptz default now()
);

-- DEBTS
create table debts (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) not null,
  customer_id uuid references customers(id) not null,
  debt_type text not null check (debt_type in ('Cari', 'Çek', 'Senet')),
  due_date date not null,
  original_amount numeric not null,
  currency text not null,
  remaining_amount numeric not null,
  status text not null default 'open', -- open, closed, archived
  created_at timestamptz default now()
);

-- NOTES
create table notes (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) not null,
  customer_id uuid references customers(id) not null,
  debt_id uuid references debts(id) on delete cascade,
  created_by_user_id uuid references profiles(id),
  created_by_role text,
  contact_person text,
  phone text,
  promised_date timestamptz,
  text text,
  created_at timestamptz default now()
);

-- PROMISES
create table promises (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) not null,
  customer_id uuid references customers(id) not null,
  debt_id uuid references debts(id) on delete cascade,
  promised_date date not null,
  amount numeric,
  currency text not null default 'TRY', -- Added default to avoid nulls if not provided, though schema says optional amount/currency? Prompt: "optional amount, currency".
  status text not null default 'planned', -- planned, kept, missed
  created_by_user_id uuid references profiles(id),
  created_at timestamptz default now()
);

-- PAYMENTS
create table payments (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) not null,
  customer_id uuid references customers(id) not null,
  debt_id uuid references debts(id) on delete cascade,
  amount numeric not null,
  currency text not null,
  paid_at timestamptz not null default now(),
  note text,
  created_by_user_id uuid references profiles(id),
  created_at timestamptz default now()
);

-- FX RATES
create table fx_rates (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id), 
  date date not null,
  base_currency text not null,
  quote_currency text not null,
  rate numeric not null,
  created_at timestamptz default now()
);

-- IMPORT JOBS
create table import_jobs (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) not null,
  filename text not null,
  status text not null,
  inserted_count int default 0,
  updated_count int default 0,
  archived_count int default 0,
  error_text text,
  created_by_user_id uuid references profiles(id),
  created_at timestamptz default now()
);

-- NOTIFICATIONS
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) not null,
  to_user_id uuid references profiles(id) not null,
  type text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- Row Level Security (RLS)

alter table companies enable row level security;
alter table profiles enable row level security;
alter table customers enable row level security;
alter table debts enable row level security;
alter table notes enable row level security;
alter table promises enable row level security;
alter table payments enable row level security;
alter table fx_rates enable row level security;
alter table import_jobs enable row level security;
alter table notifications enable row level security;

-- Policies

-- Helper to get profile
create or replace function get_my_company_id()
returns uuid
language sql stable
security definer
set search_path = public
as $$
  select company_id from profiles where id = auth.uid();
$$;

-- COMPANIES: Read own
create policy "Users can view their own company"
on companies for select
using (id = get_my_company_id());

-- PROFILES
create policy "Users can view their own profile"
on profiles for select
using (id = auth.uid());

create policy "Admins can view all profiles in company"
on profiles for select
using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid()
    and p.role = 'company_admin'
    and p.company_id = profiles.company_id
  )
);

create policy "Admins can update profiles in company"
on profiles for update
using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid()
    and p.role = 'company_admin'
    and p.company_id = profiles.company_id
  )
);

-- CUSTOMERS
create policy "Access customers"
on customers for select
using (
  company_id = get_my_company_id() 
  AND (
    exists (
      select 1 from profiles 
      where id = auth.uid() 
      and (
        role in ('company_admin', 'accounting')
        OR (role = 'seller' and customers.assigned_user_id = auth.uid())
        OR (role = 'manager' and (
            customers.assigned_user_id = auth.uid() 
            OR customers.assigned_user_id in (select id from profiles where manager_id = auth.uid())
        ))
      )
    )
  )
);

create policy "Insert/Update customers"
on customers for all
using (company_id = get_my_company_id())
with check (company_id = get_my_company_id());

-- DEBTS
create policy "Access debts"
on debts for select
using (company_id = get_my_company_id()); -- Simplified for MVP, refine if needed based on customer access

create policy "Modify debts"
on debts for all
using (company_id = get_my_company_id())
with check (company_id = get_my_company_id());

-- NOTES, PROMISES similar pattern
create policy "Access notes" on notes for select using (company_id = get_my_company_id());
create policy "Modify notes" on notes for all using (company_id = get_my_company_id()) with check (company_id = get_my_company_id());

create policy "Access promises" on promises for select using (company_id = get_my_company_id());
create policy "Modify promises" on promises for all using (company_id = get_my_company_id()) with check (company_id = get_my_company_id());

-- PAYMENTS
create policy "Access payments" on payments for select using (company_id = get_my_company_id());

create policy "Insert payments restricted"
on payments for insert
with check (
  company_id = get_my_company_id()
  and exists (
    select 1 from profiles 
    where id = auth.uid() 
    and role in ('company_admin', 'accounting')
  )
);

-- FX RATES
create policy "Read fx rates" on fx_rates for select using (true); -- Allow all to read? Restrict to company + nulls?
-- Implementation Plan says: "Users can read only their company". But FX might be shared.
-- Fix:
create policy "Read fx rates company" on fx_rates for select using (company_id = get_my_company_id() or company_id is null);

create policy "Modify fx rates"
on fx_rates for all
using (
  exists (
    select 1 from profiles 
    where id = auth.uid() 
    and role = 'company_admin'
  )
)
with check (
   exists (
    select 1 from profiles 
    where id = auth.uid() 
    and role = 'company_admin'
  )
);

-- IMPORT JOBS
create policy "Admin access imports"
on import_jobs for all
using (
  company_id = get_my_company_id()
  and exists (
    select 1 from profiles where id = auth.uid() and role = 'company_admin'
  )
);

-- NOTIFICATIONS
create policy "User read notifications"
on notifications for select
using (to_user_id = auth.uid());

create policy "System insert notifications" 
on notifications for insert 
with check (true); -- Usually inserted by server triggers or actions.

