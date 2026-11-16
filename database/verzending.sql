-- Makers 3D Labs — vervoerder en track & trace bij bestellingen.
alter table public.customer_orders add column if not exists carrier text check (carrier in ('PostNL','DHL'));
alter table public.customer_orders add column if not exists tracking_code text check (char_length(tracking_code) <= 60);
alter table public.customer_orders add column if not exists ship_postcode text check (char_length(ship_postcode) <= 12);
