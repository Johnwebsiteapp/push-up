-- Tabela treningów pompek
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null,
  count integer not null check (count > 0),
  performed_at date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists workouts_user_id_idx on public.workouts(user_id);
create index if not exists workouts_performed_at_idx on public.workouts(performed_at desc);

-- Row Level Security
alter table public.workouts enable row level security;

-- Każdy zalogowany użytkownik widzi WSZYSTKIE treningi (swoje i drugiej osoby)
drop policy if exists "Zalogowani widzą wszystkie treningi" on public.workouts;
create policy "Zalogowani widzą wszystkie treningi"
  on public.workouts for select
  to authenticated
  using (true);

-- Użytkownik może dodać tylko swój własny trening
drop policy if exists "Użytkownik dodaje swój trening" on public.workouts;
create policy "Użytkownik dodaje swój trening"
  on public.workouts for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Użytkownik może usuwać tylko swoje treningi
drop policy if exists "Użytkownik usuwa swój trening" on public.workouts;
create policy "Użytkownik usuwa swój trening"
  on public.workouts for delete
  to authenticated
  using (auth.uid() = user_id);

-- Włącz Realtime
alter publication supabase_realtime add table public.workouts;
