# 💪 Aplikacja Pompki

Webowa aplikacja do śledzenia postępów w robieniu pompek. Każdy zalogowany użytkownik widzi swoje treningi oraz treningi innych osób (idealne dla dwóch osób trenujących razem). Aktualizacje na żywo dzięki Supabase Realtime.

## Stack
- React 18 + Vite
- Supabase (Auth + Postgres + Realtime)

## Funkcje
- Rejestracja i logowanie e-mail/hasło (Supabase Auth)
- Ręczne dodawanie treningów: liczba pompek + data + opcjonalna notatka
- Licznik w prawym górnym rogu pokazujący łączną liczbę Twoich pompek
- Podsumowanie punktów każdego użytkownika
- Lista wszystkich treningów (swoje + drugiej osoby), sortowana od najnowszych
- Aktualizacje na żywo – gdy druga osoba doda pompki, od razu pojawiają się u Ciebie
- Możliwość usuwania tylko swoich wpisów

## Uruchomienie

### 1. Zainstaluj Node.js
Potrzebujesz Node 18+ (https://nodejs.org).

### 2. Zainstaluj zależności
```bash
npm install
```

### 3. Skonfiguruj Supabase
1. Utwórz darmowy projekt na https://supabase.com
2. W Supabase Dashboard → **SQL Editor** → wklej i uruchom zawartość pliku [`supabase/schema.sql`](supabase/schema.sql). Utworzy to tabelę `workouts`, polityki RLS i włączy Realtime.
3. W **Project Settings → API** skopiuj:
   - `Project URL`
   - `anon public` klucz
4. Skopiuj `.env.example` do `.env` i wklej wartości:
   ```bash
   cp .env.example .env
   ```
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
5. (Opcjonalnie) W **Authentication → Providers → Email** wyłącz *Confirm email* podczas testów, żeby nie trzeba było klikać w link w mailu.

### 4. Uruchom aplikację
```bash
npm run dev
```
Otwórz http://localhost:5173

## Struktura projektu
```
src/
  main.jsx              # entry point
  App.jsx               # routing auth / dashboard
  supabaseClient.js     # klient Supabase
  components/
    Auth.jsx            # logowanie / rejestracja
    Dashboard.jsx       # ekran główny + Realtime
    AddWorkout.jsx      # formularz dodawania
    WorkoutList.jsx     # lista treningów
  index.css             # style bazowe
  App.css               # style komponentów
supabase/
  schema.sql            # schemat bazy + RLS + Realtime
```

## Model danych (tabela `workouts`)
| kolumna        | typ        | opis                                 |
| -------------- | ---------- | ------------------------------------ |
| `id`           | uuid       | PK                                   |
| `user_id`      | uuid       | FK → `auth.users.id`                 |
| `user_email`   | text       | e-mail do wyświetlania               |
| `count`        | integer    | liczba pompek (> 0)                  |
| `performed_at` | date       | data treningu                        |
| `note`         | text       | notatka (opcjonalnie)                |
| `created_at`   | timestamptz| czas zapisu                          |

## Bezpieczeństwo (RLS)
- Każdy zalogowany użytkownik może **czytać wszystkie** treningi
- Użytkownik może **dodawać** tylko własne treningi (`auth.uid() = user_id`)
- Użytkownik może **usuwać** tylko własne treningi
