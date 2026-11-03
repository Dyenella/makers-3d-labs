-- Makers 3D Labs: alleen uitvoeren in het eigen, bevestigde project.
begin;
create table if not exists public.customer_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null default '' check(length(full_name)<=120),
 company text not null default '' check(length(company)<=150),
 phone text not null default '' check(length(phone)<=40),
 street text not null default '' check(length(street)<=150),
 house_number text not null default '' check(length(house_number)<=30),
 postal_code text not null default '' check(length(postal_code)<=20),
 city text not null default '' check(length(city)<=100),
 country text not null default 'Nederland' check(length(country)<=100),
 billing_street text not null default '' check(length(billing_street)<=150),
 billing_house_number text not null default '' check(length(billing_house_number)<=30),
 billing_postal_code text not null default '' check(length(billing_postal_code)<=20),
 billing_city text not null default '' check(length(billing_city)<=100),
 billing_country text not null default 'Nederland' check(length(billing_country)<=100)
);
create table if not exists public.customer_orders (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),
 number text unique not null,title text not null,status text not null default 'received',
 payment_status text not null default 'open',total_cents bigint not null check(total_cents>=0),
 items jsonb not null default '[]' check(jsonb_typeof(items)='array'),created_at timestamptz not null default now()
);
create table if not exists public.customer_quotes (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),
 number text unique not null,title text not null,status text not null default 'sent',
 total_cents bigint not null check(total_cents>=0),file_path text,
 created_at timestamptz not null default now(),
 constraint quote_owner_path check(file_path is null or (file_path like user_id::text||'/%' and lower(right(file_path,4))='.pdf' and position('..' in file_path)=0))
);
create table if not exists public.customer_invoices (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),
 number text unique not null,title text not null,status text not null default 'issued',
 total_cents bigint not null check(total_cents>=0),file_path text,order_number text,
 created_at timestamptz not null default now(),
 constraint invoice_owner_path check(file_path is null or (file_path like user_id::text||'/%' and lower(right(file_path,4))='.pdf' and position('..' in file_path)=0))
);
create index if not exists customer_orders_owner_date on public.customer_orders(user_id,created_at desc);
create index if not exists customer_quotes_owner_date on public.customer_quotes(user_id,created_at desc);
create index if not exists customer_invoices_owner_date on public.customer_invoices(user_id,created_at desc);
alter table public.customer_profiles enable row level security;
alter table public.customer_orders enable row level security;
alter table public.customer_quotes enable row level security;
alter table public.customer_invoices enable row level security;
revoke all on public.customer_profiles,public.customer_orders,public.customer_quotes,public.customer_invoices from anon,authenticated;
grant select,insert,update on public.customer_profiles to authenticated;
grant select on public.customer_orders,public.customer_quotes,public.customer_invoices to authenticated;
drop policy if exists "customer profile select" on public.customer_profiles;
create policy "customer profile select" on public.customer_profiles for select to authenticated using((select auth.uid())=user_id);
drop policy if exists "customer profile insert" on public.customer_profiles;
create policy "customer profile insert" on public.customer_profiles for insert to authenticated with check((select auth.uid())=user_id);
drop policy if exists "customer profile update" on public.customer_profiles;
create policy "customer profile update" on public.customer_profiles for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
drop policy if exists "customer orders select" on public.customer_orders;
create policy "customer orders select" on public.customer_orders for select to authenticated using((select auth.uid())=user_id);
drop policy if exists "customer quotes select" on public.customer_quotes;
create policy "customer quotes select" on public.customer_quotes for select to authenticated using((select auth.uid())=user_id);
drop policy if exists "customer invoices select" on public.customer_invoices;
create policy "customer invoices select" on public.customer_invoices for select to authenticated using((select auth.uid())=user_id);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('customer-documents','customer-documents',false,10485760,array['application/pdf'])
 on conflict(id) do update set public=false,file_size_limit=10485760,allowed_mime_types=array['application/pdf'];
drop policy if exists "customer document download" on storage.objects;
create policy "customer document download" on storage.objects for select to authenticated using(
 bucket_id='customer-documents' and (storage.foldername(name))[1]=(select auth.uid())::text
 and (exists(select 1 from public.customer_invoices i where i.file_path=name and i.user_id=(select auth.uid()))
 or exists(select 1 from public.customer_quotes q where q.file_path=name and q.user_id=(select auth.uid())))
);
commit;
