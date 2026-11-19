-- Mini Marketplace: complete Supabase schema.
-- Run once in Supabase → SQL Editor on a fresh project.

-- ============ LISTINGS ============
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 100),
  description text not null default '' check (char_length(description) <= 2000),
  price numeric(10, 2) not null check (price >= 0 and price <= 99999999),
  category text not null check (category in (
    'vehicles', 'property-rentals', 'apparel', 'classifieds', 'electronics',
    'entertainment', 'family', 'free-stuff', 'garden-outdoor', 'hobbies',
    'home-goods', 'home-improvement', 'home-sales', 'musical-instruments',
    'office-supplies', 'pet-supplies', 'sporting-goods', 'toys-games'
  )),
  location text not null check (char_length(trim(location)) between 1 and 100),
  seller_name text not null check (char_length(trim(seller_name)) between 1 and 60),
  seller_email text not null check (
    char_length(seller_email) <= 254 and seller_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ),
  image_url text,
  created_at timestamptz not null default now()
);

create index listings_created_at_idx on public.listings (created_at desc);
create index listings_category_idx on public.listings (category, created_at desc);

-- Fast "contains" search on titles and descriptions
create extension if not exists pg_trgm;
create index listings_title_trgm_idx on public.listings using gin (title gin_trgm_ops);
create index listings_description_trgm_idx on public.listings using gin (description gin_trgm_ops);

-- ============ MESSAGES ============
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  buyer_email text not null check (
    char_length(buyer_email) <= 254 and buyer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ),
  seller_email text not null,
  message text not null check (char_length(trim(message)) between 1 and 1000),
  email_status text not null default 'pending'
    check (email_status in ('pending', 'sent', 'skipped', 'failed')),
  created_at timestamptz not null default now()
);

create index messages_seller_idx on public.messages (lower(seller_email), created_at desc);
create index messages_listing_idx on public.messages (listing_id, created_at desc);

-- ============ SECURITY ============
alter table public.listings enable row level security;
alter table public.messages enable row level security;

-- Start locked down for the public roles
revoke all on public.listings from anon, authenticated;
revoke all on public.messages from anon, authenticated;

-- Public can read listings, but NOT the seller_email column
create policy "Public can read listings"
  on public.listings for select
  to anon, authenticated
  using (true);

grant select (id, title, description, price, category, location, seller_name, image_url, created_at)
  on public.listings to anon, authenticated;

-- Messages: no public access at all (the API routes use the server-only service role key)

-- The server-side service role needs full access
grant all on public.listings to service_role;
grant all on public.messages to service_role;

-- ============ STORAGE ============
-- Public photo bucket. Uploads only happen through /api/upload (service role),
-- so there is no public upload policy.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-images', 'listing-images', true, 4194304,
  array['image/jpeg', 'image/png', 'image/webp']
);

-- =====================================================================
-- STRIPE CONNECT (Test 4). Run after the schema above.
-- =====================================================================

-- One Stripe connected account per seller email (no logins, as the brief allows).
create table public.seller_accounts (
  email text primary key check (
    char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ),
  stripe_account_id text not null unique,
  details_submitted boolean not null default false,
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.listings
  add column status text not null default 'available'
    check (status in ('available', 'pending', 'sold')),
  add column buy_now_enabled boolean not null default false,
  add column reserved_until timestamptz,
  add column checkout_session_id text,
  add column sold_at timestamptz;

create index listings_seller_email_idx on public.listings (seller_email);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings (id) on delete set null,
  stripe_session_id text not null unique,
  stripe_payment_intent_id text,
  stripe_account_id text not null,
  seller_email text not null,
  buyer_email text,
  listing_title text not null,
  amount_total integer not null check (amount_total >= 0),
  application_fee_amount integer not null default 0 check (application_fee_amount >= 0),
  currency text not null default 'usd',
  status text not null default 'paid' check (status in ('paid', 'refunded')),
  created_at timestamptz not null default now()
);

create index orders_seller_idx on public.orders (seller_email, created_at desc);
create index orders_listing_idx on public.orders (listing_id);

alter table public.seller_accounts enable row level security;
alter table public.orders enable row level security;
revoke all on public.seller_accounts from anon, authenticated;
revoke all on public.orders from anon, authenticated;
grant all on public.seller_accounts to service_role;
grant all on public.orders to service_role;

grant select (status, buy_now_enabled, reserved_until, sold_at)
  on public.listings to anon, authenticated;
