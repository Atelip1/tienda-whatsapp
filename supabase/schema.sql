-- =====================================================================
-- Catálogo digital con contacto por WhatsApp: esquema de base de datos
-- Ejecuta este archivo completo en Supabase > SQL Editor > New query.
-- Se puede volver a ejecutar sin perder datos.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Administradoras (SP-04: la propietaria es la única usuaria del panel)
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------
-- Categorías (RF-14)
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 60),
  visible boolean not null default true,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);
create unique index if not exists categories_name_unique on public.categories (lower(trim(name)));

-- ---------------------------------------------------------------------
-- Productos (RF-15 a RF-19, RN-05)
-- ---------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9-]{2,20}$'),
  name text not null check (char_length(trim(name)) between 2 and 120),
  description text not null check (char_length(trim(description)) between 1 and 2000),
  category_id uuid not null references public.categories (id) on delete restrict,
  price numeric(10, 2) not null check (price > 0),
  promo_price numeric(10, 2) check (promo_price is null or (promo_price > 0 and promo_price < price)),
  stock integer not null default 0 check (stock >= 0),
  status text not null default 'disponible' check (status in ('disponible', 'agotado', 'oculto')),
  video_path text,
  video_name text,
  video_size bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_category_idx on public.products (category_id);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  path text not null,
  position integer not null default 0
);
create index if not exists product_images_product_idx on public.product_images (product_id, position);

-- RF-19: stock 0 => Agotado. RN-05: código en mayúsculas.
create or replace function public.products_before_save()
returns trigger
language plpgsql
as $$
begin
  new.code := upper(trim(new.code));
  if new.stock = 0 and new.status = 'disponible' then
    new.status := 'agotado';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists products_before_save on public.products;
create trigger products_before_save
before insert or update on public.products
for each row execute function public.products_before_save();

-- ---------------------------------------------------------------------
-- Configuración: número de WhatsApp (RF-20, RN-09)
-- ---------------------------------------------------------------------
create table if not exists public.settings (
  id integer primary key default 1 check (id = 1),
  whatsapp text not null check (whatsapp ~ '^519[0-9]{8}$'),
  updated_at timestamptz not null default now()
);
insert into public.settings (id, whatsapp) values (1, '51987654321') on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Promociones (ventana flotante)
-- ---------------------------------------------------------------------
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 60),
  description text not null check (char_length(trim(description)) between 1 and 160),
  start_date date not null,
  end_date date not null,
  product_id uuid references public.products (id) on delete set null,
  cta text not null default 'Ver promoción' check (char_length(trim(cta)) between 1 and 24),
  image_path text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint promotions_dates check (end_date >= start_date)
);

-- Fecha de hoy en hora de Lima
create or replace function public.hoy_lima()
returns date
language sql
stable
as $$ select (now() at time zone 'America/Lima')::date; $$;

-- ---------------------------------------------------------------------
-- Seguridad a nivel de filas (RLS)
-- Público: solo lo publicado. Propietaria: todo.
-- ---------------------------------------------------------------------
alter table public.admins enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.settings enable row level security;
alter table public.promotions enable row level security;

drop policy if exists "admins: ver la propia fila" on public.admins;
create policy "admins: ver la propia fila" on public.admins
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "categorias: público ve las visibles" on public.categories;
create policy "categorias: público ve las visibles" on public.categories
  for select using (visible or public.is_admin());
drop policy if exists "categorias: propietaria gestiona" on public.categories;
create policy "categorias: propietaria gestiona" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- RF-01 / RF-17: los productos ocultos o de categorías ocultas no se ven.
drop policy if exists "productos: público ve los publicados" on public.products;
create policy "productos: público ve los publicados" on public.products
  for select using (
    public.is_admin()
    or (
      status <> 'oculto'
      and exists (select 1 from public.categories c where c.id = category_id and c.visible)
    )
  );
drop policy if exists "productos: propietaria gestiona" on public.products;
create policy "productos: propietaria gestiona" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "imagenes: público ve las de productos publicados" on public.product_images;
create policy "imagenes: público ve las de productos publicados" on public.product_images
  for select using (exists (select 1 from public.products p where p.id = product_id));
drop policy if exists "imagenes: propietaria gestiona" on public.product_images;
create policy "imagenes: propietaria gestiona" on public.product_images
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "config: lectura pública" on public.settings;
create policy "config: lectura pública" on public.settings for select using (true);
drop policy if exists "config: propietaria actualiza" on public.settings;
create policy "config: propietaria actualiza" on public.settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "promociones: público ve las vigentes" on public.promotions;
create policy "promociones: público ve las vigentes" on public.promotions
  for select using (
    public.is_admin()
    or (active and public.hoy_lima() between start_date and end_date)
  );
drop policy if exists "promociones: propietaria gestiona" on public.promotions;
create policy "promociones: propietaria gestiona" on public.promotions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- Archivos: imágenes y videos (Supabase Storage)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('productos', 'productos', true, 52428800,
    array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']),
  ('promociones', 'promociones', true, 5242880,
    array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "archivos: lectura pública" on storage.objects;
create policy "archivos: lectura pública" on storage.objects
  for select using (bucket_id in ('productos', 'promociones'));
drop policy if exists "archivos: propietaria sube" on storage.objects;
create policy "archivos: propietaria sube" on storage.objects
  for insert to authenticated with check (bucket_id in ('productos', 'promociones') and public.is_admin());
drop policy if exists "archivos: propietaria actualiza" on storage.objects;
create policy "archivos: propietaria actualiza" on storage.objects
  for update to authenticated using (bucket_id in ('productos', 'promociones') and public.is_admin());
drop policy if exists "archivos: propietaria elimina" on storage.objects;
create policy "archivos: propietaria elimina" on storage.objects
  for delete to authenticated using (bucket_id in ('productos', 'promociones') and public.is_admin());

-- ---------------------------------------------------------------------
-- Categorías iniciales (puedes cambiarlas desde el panel)
-- ---------------------------------------------------------------------
insert into public.categories (name, sort)
select v.name, v.sort
from (values ('Ropita', 1), ('Accesorios', 2), ('Juguetes y peluches', 3)) as v (name, sort)
where not exists (select 1 from public.categories);
