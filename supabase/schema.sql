-- HomeStays — optional Supabase PostgreSQL schema.
-- Run this in the Supabase SQL editor, then set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
-- in Vercel to switch the API from demo storage to PostgreSQL.
-- Column names are snake_case versions of the API entity fields (see server/repositories/supabaseRepository.js).

create extension if not exists btree_gist;

create table if not exists users (
  id text primary key,
  name text not null,
  email text not null unique,
  role text not null check (role in ('guest', 'owner', 'admin')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  phone text,
  avatar text,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists properties (
  id text primary key,
  owner_id text not null references users(id) on delete cascade,
  title text not null,
  type text not null,
  description text not null,
  city text not null,
  country text not null,
  address text not null,
  price_per_night numeric(10,2) not null check (price_per_night > 0),
  weekend_price numeric(10,2),
  cleaning_fee numeric(10,2) not null default 0,
  max_guests int not null check (max_guests > 0),
  bedrooms int not null default 1,
  beds int not null default 1,
  bathrooms numeric(4,1) not null default 1,
  amenities text[] not null default '{}',
  images text[] not null default '{}',
  blocked_dates jsonb not null default '[]',
  instant_book boolean not null default true,
  status text not null default 'active' check (status in ('active', 'inactive', 'suspended')),
  rating numeric(3,2) not null default 0,
  review_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists bookings (
  id text primary key,
  property_id text not null references properties(id) on delete cascade,
  guest_id text not null references users(id) on delete cascade,
  owner_id text not null references users(id) on delete cascade,
  check_in date not null,
  check_out date not null,
  guests int not null check (guests > 0),
  status text not null check (status in ('pending', 'confirmed', 'cancelled', 'completed', 'rejected')),
  price jsonb not null,
  payment jsonb,
  contact jsonb,
  special_requests text,
  cancelled_at timestamptz,
  cancelled_by text,
  refund_amount numeric(10,2),
  status_changed_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  check (check_out > check_in),
  -- Database-level guarantee: no two confirmed bookings for the same property may overlap.
  constraint no_overlapping_confirmed exclude using gist (
    property_id with =,
    daterange(check_in, check_out, '[)') with &&
  ) where (status = 'confirmed')
);

create index if not exists bookings_property_idx on bookings(property_id);
create index if not exists bookings_guest_idx on bookings(guest_id);
create index if not exists properties_owner_idx on properties(owner_id);

-- The API uses the service-role key (server-side only). Enable RLS so the anon key cannot read data directly.
alter table users enable row level security;
alter table properties enable row level security;
alter table bookings enable row level security;
