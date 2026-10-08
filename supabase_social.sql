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
-- Asignatura estudiada y resultado del modo foco (estilo Forest): 'ok' = planta crecida, 'withered' = marchita
alter table shared_sessions add column if not exists subject text;
alter table shared_sessions add column if not exists focus text;
alter table shared_sessions drop constraint if exists shared_sessions_focus_check;
alter table shared_sessions add constraint shared_sessions_focus_check check (focus is null or focus in ('ok','withered'));
alter table shared_sessions enable row level security;
drop policy if exists "shared_sessions select all" on shared_sessions;
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

-- ===== PRIVACIDAD: solo tú y tus amigos aceptados veis tu presencia, eventos y sesiones =====
-- Antes estas tablas eran legibles por cualquiera con la clave pública (select using (true)).
-- Las funciones son "security definer" para poder consultar friendships/presence sin recursión de RLS.
create or replace function public.are_friends(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from friendships f where f.status = 'accepted'
    and ((f.requester_id = a and f.addressee_id = b) or (f.requester_id = b and f.addressee_id = a)));
$$;
create or replace function public.my_room_code() returns text
language sql stable security definer set search_path = public as $$
  select room_code from presence where user_id = auth.uid();
$$;

drop policy if exists "presence select all" on presence;
drop policy if exists "presence select own friends room" on presence;
-- Tu fila; la de un amigo solo si comparte ubicación; la de quien está en tu misma sala de estudio.
create policy "presence select own friends room" on presence for select using (
  auth.uid() = user_id
  or (sharing and public.are_friends(auth.uid(), user_id))
  or (room_code is not null and room_code = public.my_room_code())
);

drop policy if exists "shared_events select all" on shared_events;
drop policy if exists "shared_events select own friends" on shared_events;
create policy "shared_events select own friends" on shared_events for select using (
  auth.uid() = owner_id or public.are_friends(auth.uid(), owner_id)
);

drop policy if exists "shared_sessions select all" on shared_sessions;
drop policy if exists "shared_sessions select own friends" on shared_sessions;
create policy "shared_sessions select own friends" on shared_sessions for select using (
  auth.uid() = owner_id or public.are_friends(auth.uid(), owner_id)
);

-- ===== CORREOS PRIVADOS: nadie puede leer el email de otros usuarios desde la app =====
-- La app ya no guarda el email en profiles (está en auth.users). Se borran los que había y se
-- limita la lectura a las columnas públicas.
update profiles set email = null where email is not null;
revoke select on profiles from anon, authenticated;
grant select (id, name, friend_code, created_at) on profiles to anon, authenticated;

-- ===== ELIMINAR CUENTA (lo exige Google Play) =====
-- Borra el usuario de auth.users; todas las tablas cuelgan de profiles con "on delete cascade".
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'no autenticado'; end if;
  delete from auth.users where id = auth.uid();
end;
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ===== KUDOS Y SALAS: solo quien participa =====
drop policy if exists "kudos select all" on kudos;
drop policy if exists "kudos select involved" on kudos;
-- Los ves si los diste, si son de tu sesión o si la sesión es de un amigo tuyo.
create policy "kudos select involved" on kudos for select using (
  auth.uid() = giver_id or auth.uid() = session_owner_id or public.are_friends(auth.uid(), session_owner_id)
);

drop policy if exists "study_rooms select all" on study_rooms;
drop policy if exists "study_rooms select own or member" on study_rooms;
create policy "study_rooms select own or member" on study_rooms for select using (
  auth.uid() = owner_id or code = public.my_room_code()
);
-- Unirse con código: devuelve la sala solo a quien conoce el código exacto (no se pueden listar todas).
create or replace function public.join_study_room(p_code text) returns table(code text, name text)
language sql stable security definer set search_path = public as $$
  select r.code, r.name from study_rooms r where r.code = upper(trim(p_code)) limit 1;
$$;
revoke all on function public.join_study_room(text) from public, anon;
grant execute on function public.join_study_room(text) to authenticated;
