-- Makers 3D Labs: online afrekenen via Stripe.
begin;

create table if not exists public.checkout_requests (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('product', 'invoice', 'quote')),
  payload jsonb not null default '{}',
  uploads text[] not null default '{}',
  user_id uuid references auth.users(id) on delete set null,
  document_id uuid,
  amount_cents bigint,
  stripe_session text unique,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  order_id uuid,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
alter table public.checkout_requests enable row level security;
revoke all on public.checkout_requests from anon, authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
  values ('order-uploads', 'order-uploads', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
  on conflict (id) do update set public = false;

drop policy if exists "admin order uploads read" on storage.objects;
create policy "admin order uploads read" on storage.objects for select to authenticated
  using (bucket_id = 'order-uploads' and public.is_makers_admin());

-- Zoek een klant-id op e-mailadres (alleen voor de server).
create or replace function public.makers_user_id_by_email(p_email text) returns uuid
language sql stable security definer set search_path = public, auth as $$
  select id from auth.users where lower(email) = lower(p_email) and deleted_at is null limit 1;
$$;
revoke all on function public.makers_user_id_by_email(text) from public, anon, authenticated;

commit;
