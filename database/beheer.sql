-- Makers 3D Labs: beheerrechten voor de eigenaar(s) van de webshop.
begin;

create table if not exists public.makers_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.makers_admins enable row level security;
revoke all on public.makers_admins from anon, authenticated;

create or replace function public.is_makers_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.makers_admins a where a.user_id = (select auth.uid()));
$$;
revoke all on function public.is_makers_admin() from public, anon;
grant execute on function public.is_makers_admin() to authenticated;

-- Beheerders mogen alles lezen en offertes, facturen en bestellingen aanmaken en wijzigen.
grant select on public.customer_profiles to authenticated;
grant insert, update, delete on public.customer_orders, public.customer_quotes, public.customer_invoices to authenticated;

drop policy if exists "admin profiles" on public.customer_profiles;
create policy "admin profiles" on public.customer_profiles for select to authenticated using (public.is_makers_admin());

drop policy if exists "admin orders" on public.customer_orders;
create policy "admin orders" on public.customer_orders for all to authenticated using (public.is_makers_admin()) with check (public.is_makers_admin());
drop policy if exists "admin quotes" on public.customer_quotes;
create policy "admin quotes" on public.customer_quotes for all to authenticated using (public.is_makers_admin()) with check (public.is_makers_admin());
drop policy if exists "admin invoices" on public.customer_invoices;
create policy "admin invoices" on public.customer_invoices for all to authenticated using (public.is_makers_admin()) with check (public.is_makers_admin());

drop policy if exists "admin documents read" on storage.objects;
create policy "admin documents read" on storage.objects for select to authenticated
  using (bucket_id = 'customer-documents' and public.is_makers_admin());
drop policy if exists "admin documents upload" on storage.objects;
create policy "admin documents upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'customer-documents' and public.is_makers_admin() and lower(right(name, 4)) = '.pdf');
drop policy if exists "admin documents delete" on storage.objects;
create policy "admin documents delete" on storage.objects for delete to authenticated
  using (bucket_id = 'customer-documents' and public.is_makers_admin());

-- Klantenlijst voor het beheer (met e-mailadres uit auth.users).
create or replace function public.makers_admin_customers()
returns table (user_id uuid, email text, full_name text, company text, phone text, created_at timestamptz)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_makers_admin() then
    raise exception 'Geen toegang' using errcode = '42501';
  end if;
  return query
    select u.id, u.email::text, coalesce(p.full_name, ''), coalesce(p.company, ''), coalesce(p.phone, ''), u.created_at
    from auth.users u left join public.customer_profiles p on p.user_id = u.id
    where u.deleted_at is null
    order by u.created_at desc;
end $$;
revoke all on function public.makers_admin_customers() from public, anon;
grant execute on function public.makers_admin_customers() to authenticated;

-- Eerste beheerder.
insert into public.makers_admins(user_id)
  select id from auth.users where email = 'alejandrobrunasanchez@gmail.com'
  on conflict do nothing;

commit;
select count(*) as beheerders from public.makers_admins;
