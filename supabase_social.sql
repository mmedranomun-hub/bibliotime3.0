-- =====================================================================
-- Bibliotime · esquema de Supabase para las funciones sociales
-- Ejecuta este script completo en: Supabase → tu proyecto → SQL Editor → New query → Run
-- =====================================================================

create extension if not exists pgcrypto;

-- ===== PERFILES =====
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  friend_code text unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
  created_at timestamptz default now()
);
alter table profiles enable row level security;
drop policy if exists "profiles select all" on profiles;
create policy "profiles select all" on profiles for select using (true);
drop policy if exists "profiles insert own" on profiles;
create policy "profiles insert own" on profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles update own" on profiles;
create policy "profiles update own" on profiles for update using (auth.uid() = id);

-- ===== AMISTADES =====
create table if not exists friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references profiles(id) on delete cascade,
  addressee_id uuid references profiles(id) on delete cascade,
  status text default 'pending',
  created_at timestamptz default now(),
  unique(requester_id, addressee_id)
);
alter table friendships enable row level security;
drop policy if exists "friendships select own" on friendships;
create policy "friendships select own" on friendships for select using (auth.uid() = requester_id or auth.uid() = addressee_id);
drop policy if exists "friendships insert own" on friendships;
create policy "friendships insert own" on friendships for insert with check (auth.uid() = requester_id);
drop policy if exists "friendships update participant" on friendships;
create policy "friendships update participant" on friendships for update using (auth.uid() = requester_id or auth.uid() = addressee_id);
drop policy if exists "friendships delete participant" on friendships;
create policy "friendships delete participant" on friendships for delete using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- ===== PRESENCIA (dónde está estudiando cada uno, si lo comparte) =====
create table if not exists presence (
  user_id uuid primary key references profiles(id) on delete cascade,
  sharing boolean default false,
  bib_index int,
  started_at timestamptz,
  updated_at timestamptz default now()
);
alter table presence enable row level security;
drop policy if exists "presence select all" on presence;
create policy "presence select all" on presence for select using (true);
drop policy if exists "presence insert own" on presence;
create policy "presence insert own" on presence for insert with check (auth.uid() = user_id);
drop policy if exists "presence update own" on presence;
create policy "presence update own" on presence for update using (auth.uid() = user_id);

-- ===== EVENTOS COMPARTIDOS (agenda académica + exámenes del calendario compartidos) =====
create table if not exists shared_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  local_id text not null,
  title text,
  type text,
  date date,
  time text,
  place text,
  url text,
  created_at timestamptz default now(),
  unique(owner_id, local_id)
);
alter table shared_events enable row level security;
drop policy if exists "shared_events select all" on shared_events;
create policy "shared_events select all" on shared_events for select using (true);
drop policy if exists "shared_events insert own" on shared_events;
create policy "shared_events insert own" on shared_events for insert with check (auth.uid() = owner_id);
drop policy if exists "shared_events update own" on shared_events;
create policy "shared_events update own" on shared_events for update using (auth.uid() = owner_id);
drop policy if exists "shared_events delete own" on shared_events;
create policy "shared_events delete own" on shared_events for delete using (auth.uid() = owner_id);

-- ===== REZOS POR EXÁMENES =====
create table if not exists prayers (
  id uuid primary key default gen_random_uuid(),
  event_owner_id uuid references profiles(id) on delete cascade,
  event_local_id text not null,
  event_title text,
  prayed_by_id uuid references profiles(id) on delete cascade,
  prayed_by_name text,
  created_at timestamptz default now(),
  unique(event_local_id, prayed_by_id)
);
alter table prayers enable row level security;
drop policy if exists "prayers select involved" on prayers;
create policy "prayers select involved" on prayers for select using (auth.uid() = event_owner_id or auth.uid() = prayed_by_id);
drop policy if exists "prayers insert own" on prayers;
create policy "prayers insert own" on prayers for insert with check (auth.uid() = prayed_by_id);

-- ===== SESIONES DE ESTUDIO EN GRUPO =====
alter table presence add column if not exists room_code text;

create table if not exists study_rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null default upper(substr(replace(gen_random_uuid()::text,'-',''),1,6)),
  name text,
  owner_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now()
);
alter table study_rooms enable row level security;
drop policy if exists "study_rooms select all" on study_rooms;
create policy "study_rooms select all" on study_rooms for select using (true);
drop policy if exists "study_rooms insert own" on study_rooms;
create policy "study_rooms insert own" on study_rooms for insert with check (auth.uid() = owner_id);
drop policy if exists "study_rooms delete own" on study_rooms;
create policy "study_rooms delete own" on study_rooms for delete using (auth.uid() = owner_id);

-- ===== BLOG DE LECTURAS (público para todos los usuarios de la app) =====
create table if not exists book_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  author_name text,
  book_title text,
  comment text,
  created_at timestamptz default now()
);
alter table book_posts enable row level security;
drop policy if exists "book_posts select all" on book_posts;
create policy "book_posts select all" on book_posts for select using (true);
drop policy if exists "book_posts insert own" on book_posts;
create policy "book_posts insert own" on book_posts for insert with check (auth.uid() = user_id);
drop policy if exists "book_posts delete own" on book_posts;
create policy "book_posts delete own" on book_posts for delete using (auth.uid() = user_id);

-- ===== SESIONES DE ESTUDIO COMPARTIDAS + KUDOS (estilo feed de actividad) =====
create table if not exists shared_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  local_id text not null,
  bib_name text,
  minutes int,
  date date,
  note text,
  offering text,
  verif boolean default false,
  prod int,
  created_at timestamptz default now(),
  unique(owner_id, local_id)
);
alter table shared_sessions add column if not exists prod int;
alter table shared_sessions enable row level security;
drop policy if exists "shared_sessions select all" on shared_sessions;
create policy "shared_sessions select all" on shared_sessions for select using (true);
drop policy if exists "shared_sessions insert own" on shared_sessions;
create policy "shared_sessions insert own" on shared_sessions for insert with check (auth.uid() = owner_id);
drop policy if exists "shared_sessions update own" on shared_sessions;
create policy "shared_sessions update own" on shared_sessions for update using (auth.uid() = owner_id);
drop policy if exists "shared_sessions delete own" on shared_sessions;
create policy "shared_sessions delete own" on shared_sessions for delete using (auth.uid() = owner_id);

create table if not exists kudos (
  id uuid primary key default gen_random_uuid(),
  session_local_id text not null,
  session_owner_id uuid references profiles(id) on delete cascade,
  giver_id uuid references profiles(id) on delete cascade,
  giver_name text,
  created_at timestamptz default now(),
  unique(session_local_id, giver_id)
);
alter table kudos enable row level security;
drop policy if exists "kudos select all" on kudos;
create policy "kudos select all" on kudos for select using (true);

-- ===== AFLUENCIA DE BIBLIOTECAS (compartida entre todos los usuarios) =====
create table if not exists occupancy_reports (
  id uuid primary key default gen_random_uuid(),
  bib_index int not null,
  level text not null,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now()
);
alter table occupancy_reports enable row level security;
drop policy if exists "occupancy_reports select all" on occupancy_reports;
create policy "occupancy_reports select all" on occupancy_reports for select using (true);
drop policy if exists "occupancy_reports insert own" on occupancy_reports;
create policy "occupancy_reports insert own" on occupancy_reports for insert with check (auth.uid() = user_id);
drop policy if exists "kudos insert own" on kudos;
create policy "kudos insert own" on kudos for insert with check (auth.uid() = giver_id);
