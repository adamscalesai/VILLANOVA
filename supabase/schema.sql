-- ─────────────────────────────────────────────────────────
-- Villa Nova listings · Supabase project "villanova". Villa Nova is agency 1;
-- the agency column lets more agencies share the project later. Run once in the SQL editor.
-- Who can do what (row-level security):
--   anyone              reads PUBLISHED properties and agency names
--   agency members      read all their agency's properties, write them,
--                       upload/delete photos under <agency slug>/
--   nobody else         writes anything
-- ─────────────────────────────────────────────────────────

create table if not exists public.agencies (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  name       text not null,
  phone      text,
  created_at timestamptz not null default now()
);

create table if not exists public.agency_members (
  agency_id uuid not null references public.agencies(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  primary key (agency_id, user_id)
);

create table if not exists public.properties (
  id           uuid primary key default gen_random_uuid(),
  agency_id    uuid not null references public.agencies(id) on delete cascade,
  ref          text not null,
  published    boolean not null default true,
  status       text not null default 'disponible' check (status in ('disponible', 'reserve', 'vendu')),
  featured     boolean not null default false,
  transaction  text not null check (transaction in ('vente', 'location')),
  type         text not null,
  title        text not null,
  tagline      text,
  price        bigint check (price is null or price >= 0),
  city         text,
  area         text,
  surface      integer,
  land_surface integer,
  rooms        integer not null default 0,
  bathrooms    integer not null default 0,
  floor        integer,
  year_built   integer,
  features     text[] not null default '{}',
  description  text,
  photos       jsonb not null default '[]',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (agency_id, ref)
);
create index if not exists properties_agency_published on public.properties (agency_id, published);

-- membership check used by every write policy (security definer so it can read agency_members)
create or replace function public.is_agency_member(a uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.agency_members m where m.agency_id = a and m.user_id = auth.uid());
$$;

-- details added 2026-11-10: public columns on properties, private agency data in its own table
alter table public.properties add column if not exists title_deed text;
alter table public.properties add column if not exists available_from date;
alter table public.properties add column if not exists deposit_months integer check (deposit_months is null or deposit_months between 0 and 24);
alter table public.properties add column if not exists charges integer check (charges is null or charges >= 0);
alter table public.properties add column if not exists video_url text check (video_url is null or video_url ~ '^https://');

create table if not exists public.property_private (
  property_id uuid primary key references public.properties(id) on delete cascade,
  agency_id   uuid not null references public.agencies(id) on delete cascade,
  owner_name  text,
  owner_phone text,
  address     text,
  notes       text,
  updated_at  timestamptz not null default now()
);

-- exact API rights (Supabase defaults also hand out TRUNCATE/TRIGGER/REFERENCES; they are removed), RLS below narrows per row.
-- Verified 2026-11-10: anon = SELECT on agencies, properties only; nothing on agency_members or property_private.
revoke all on public.agencies, public.agency_members, public.properties, public.property_private from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.agencies to anon, authenticated;
grant select on public.properties to anon, authenticated;
grant insert, update, delete on public.properties to authenticated;
grant select on public.agency_members to authenticated;
grant select, insert, update, delete on public.property_private to authenticated;
grant execute on function public.is_agency_member(uuid) to anon, authenticated;

alter table public.property_private enable row level security;
drop policy if exists "members manage private" on public.property_private;
create policy "members manage private" on public.property_private for all to authenticated
  using (public.is_agency_member(property_private.agency_id))
  with check (public.is_agency_member(property_private.agency_id)
    and exists (select 1 from public.properties p where p.id = property_private.property_id and p.agency_id = property_private.agency_id));

alter table public.agencies       enable row level security;
alter table public.agency_members enable row level security;
alter table public.properties     enable row level security;

drop policy if exists "agencies are public" on public.agencies;
create policy "agencies are public" on public.agencies for select using (true);

drop policy if exists "members see their own membership" on public.agency_members;
create policy "members see their own membership" on public.agency_members for select to authenticated using (user_id = auth.uid());

drop policy if exists "public reads published" on public.properties;
create policy "public reads published" on public.properties for select using (published = true);
drop policy if exists "members read all" on public.properties;
create policy "members read all" on public.properties for select to authenticated using (public.is_agency_member(agency_id));
drop policy if exists "members insert" on public.properties;
create policy "members insert" on public.properties for insert to authenticated with check (public.is_agency_member(agency_id));
drop policy if exists "members update" on public.properties;
create policy "members update" on public.properties for update to authenticated using (public.is_agency_member(agency_id)) with check (public.is_agency_member(agency_id));
drop policy if exists "members delete" on public.properties;
create policy "members delete" on public.properties for delete to authenticated using (public.is_agency_member(agency_id));

-- photos: public bucket (anyone can view a photo by its URL), writes only by members, only in their agency's folder
insert into storage.buckets (id, name, public) values ('listings', 'listings', true) on conflict (id) do nothing;

-- CAREFUL: write objects.name, never bare `name`. Inside the subquery a bare `name` resolves to agencies.name
-- ("Villa Nova Holdings"), no folder ever matches, and every member upload is refused. Found and fixed 2026-11-10.
-- Storage also checks SELECT on the new row when it saves, so members need read + update, not only insert + delete.
drop policy if exists "members upload photos" on storage.objects;
drop policy if exists "members read photos" on storage.objects;
drop policy if exists "members update photos" on storage.objects;
drop policy if exists "members delete photos" on storage.objects;
create policy "members upload photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'listings' and public.is_agency_member((select a.id from public.agencies a where a.slug = (storage.foldername(objects.name))[1])));
create policy "members read photos" on storage.objects for select to authenticated
  using (bucket_id = 'listings' and public.is_agency_member((select a.id from public.agencies a where a.slug = (storage.foldername(objects.name))[1])));
create policy "members update photos" on storage.objects for update to authenticated
  using (bucket_id = 'listings' and public.is_agency_member((select a.id from public.agencies a where a.slug = (storage.foldername(objects.name))[1])))
  with check (bucket_id = 'listings' and public.is_agency_member((select a.id from public.agencies a where a.slug = (storage.foldername(objects.name))[1])));
create policy "members delete photos" on storage.objects for delete to authenticated
  using (bucket_id = 'listings' and public.is_agency_member((select a.id from public.agencies a where a.slug = (storage.foldername(objects.name))[1])));

-- agency 1
insert into public.agencies (slug, name, phone) values ('villanova', 'Villa Nova Holdings', '21699002757') on conflict (slug) do nothing;

-- After creating the agency's login in Authentication > Users, give it access:
--   insert into public.agency_members (agency_id, user_id)
--   select a.id, u.id from public.agencies a, auth.users u
--   where a.slug = 'villanova' and u.email = '<the login email>';
