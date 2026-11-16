-- Makers 3D Labs — automatische facturen na betaling.
-- Instellingen (bedrijfsgegevens, btw-nummer) en doorlopende factuurnummers FAC-JJJJ-0001.
begin;

create table if not exists public.makers_settings (
 key text primary key,
 value text not null default '',
 updated_at timestamptz not null default now()
);
alter table public.makers_settings enable row level security;
revoke all on public.makers_settings from anon, authenticated;
drop policy if exists "makers settings admin" on public.makers_settings;
create policy "makers settings admin" on public.makers_settings for all to authenticated
  using (public.is_makers_admin()) with check (public.is_makers_admin());
grant select, insert, update on public.makers_settings to authenticated;

insert into public.makers_settings(key, value) values
 ('bedrijfsnaam', 'Bruwin Solutions'),
 ('handelsnaam', 'Makers 3D Labs'),
 ('adres', 'Houtzaagmolen 102'),
 ('postcode_plaats', '2986 GE Ridderkerk'),
 ('land', 'Nederland'),
 ('kvk', '42219037'),
 ('btw_id', ''),               -- invullen zodra het btw-nummer binnen is
 ('email', 'info@makers3dlabs.nl'),
 ('website', 'www.makers3dlabs.nl'),
 ('iban', '')                  -- optioneel, alleen ter informatie op de factuur
on conflict (key) do nothing;

create table if not exists public.makers_invoice_counters (
 year int primary key,
 last_number int not null default 0
);
alter table public.makers_invoice_counters enable row level security;
revoke all on public.makers_invoice_counters from anon, authenticated;

-- Geeft het volgende factuurnummer, zonder gaten en zonder dubbele nummers.
create or replace function public.makers_next_invoice_number() returns text
language plpgsql security definer set search_path = public as $$
declare y int := extract(year from (now() at time zone 'Europe/Amsterdam'))::int; n int;
begin
  insert into public.makers_invoice_counters(year, last_number) values (y, 1)
  on conflict (year) do update set last_number = makers_invoice_counters.last_number + 1
  returning last_number into n;
  return 'FAC-' || y || '-' || lpad(n::text, 4, '0');
end $$;
revoke all on function public.makers_next_invoice_number() from public, anon, authenticated;
grant execute on function public.makers_next_invoice_number() to service_role;

alter table public.checkout_requests add column if not exists invoice_number text;

commit;
