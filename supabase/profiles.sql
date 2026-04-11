-- Tabela profili użytkowników
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nick text,
  name text,
  height_cm integer check (height_cm > 0 and height_cm < 300),
  weight_kg numeric(5, 2) check (weight_kg > 0 and weight_kg < 500),
  updated_at timestamptz not null default now()
);

-- Row Level Security
alter table public.profiles enable row level security;

-- Każdy zalogowany użytkownik może czytać wszystkie profile
-- (żeby widzieć nicki w rankingu)
drop policy if exists "Zalogowani czytają profile" on public.profiles;
create policy "Zalogowani czytają profile"
  on public.profiles for select
  to authenticated
  using (true);

-- Użytkownik może dodać tylko swój profil
drop policy if exists "Użytkownik dodaje swój profil" on public.profiles;
create policy "Użytkownik dodaje swój profil"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Użytkownik może edytować tylko swój profil
drop policy if exists "Użytkownik edytuje swój profil" on public.profiles;
create policy "Użytkownik edytuje swój profil"
  on public.profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Realtime (opcjonalnie, żeby nicki aktualizowały się na żywo w rankingu)
alter publication supabase_realtime add table public.profiles;
