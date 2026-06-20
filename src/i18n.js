// ============================================================
// Translations — PL (Polish) and EN (English)
// ============================================================

// Achievement texts (motivational) — per language
export const ZERO_ACHIEVEMENT_BY_LANG = {
  pl: { title: 'Podłoga czeka.', sub: 'Nie każ jej czekać.' },
  en: { title: 'The floor is waiting.', sub: "Don't keep it waiting." },
}

export const ACHIEVEMENTS_BY_LANG = {
  pl: [
    { title: 'Kanapa płacze.', sub: 'Ale Ty się śmiejesz.' },
    { title: 'Każda pompka.', sub: 'Zostaje na zawsze.' },
    { title: 'Mięśnie bolą.', sub: 'To znaczy że działasz.' },
    { title: 'Ból mija.', sub: 'Forma zostaje.' },
    { title: 'Nie ma skrótów.', sub: 'Tylko powtórzenia.' },
    { title: 'Koszulka się kurczy.', sub: 'A może to Ty rośniesz.' },
    { title: 'Zero wymówek.', sub: 'Tylko wyniki.' },
    { title: 'Dzisiaj bolało.', sub: 'Jutro podziękujesz.' },
    { title: 'Jedna więcej niż wczoraj.', sub: 'To jest postęp.' },
    { title: 'Zrobiłeś.', sub: 'I to się liczy.' },
    { title: 'Twoje ciało Ci dziękuje.', sub: 'Nawet jak narzeka.' },
    { title: 'Inni scrollują.', sub: 'Ty robisz pompki.' },
    { title: 'Nikt nie widział.', sub: 'Ale licznik wie.' },
    { title: 'Nie musisz być najlepszy.', sub: 'Tylko regularny.' },
    { title: 'Jeszcze jedna seria.', sub: 'Powiedziałeś to 3 serie temu.' },
    { title: 'Grawitacja przegrywa.', sub: 'Znowu.' },
    { title: 'Ramiona > wymówki.', sub: 'Proste.' },
    { title: 'Zmęczony?', sub: 'Dobrze.' },
    { title: 'Robiłeś pompki.', sub: 'I to wystarczy.' },
    { title: 'Podłoga mówi dziękuję.', sub: 'Za regularne odwiedziny.' },
  ],
  en: [
    { title: 'The couch weeps.', sub: 'But you laugh.' },
    { title: 'Every rep.', sub: 'Stays forever.' },
    { title: 'Muscles ache.', sub: "That means it's working." },
    { title: 'Pain fades.', sub: 'Strength stays.' },
    { title: 'No shortcuts.', sub: 'Only reps.' },
    { title: 'The shirt shrank.', sub: 'Or maybe you grew.' },
    { title: 'Zero excuses.', sub: 'Just results.' },
    { title: 'Today it hurt.', sub: "Tomorrow you'll thank yourself." },
    { title: 'One more than yesterday.', sub: "That's progress." },
    { title: 'You did it.', sub: 'That counts.' },
    { title: 'Your body thanks you.', sub: 'Even when it complains.' },
    { title: 'Others scroll.', sub: 'You train.' },
    { title: 'Nobody saw.', sub: 'But the counter knows.' },
    { title: "You don't have to be the best.", sub: 'Just consistent.' },
    { title: 'One more set.', sub: 'You said that 3 sets ago.' },
    { title: 'Gravity loses.', sub: 'Again.' },
    { title: 'Arms > excuses.', sub: 'Simple.' },
    { title: 'Tired?', sub: 'Good.' },
    { title: 'You did push-ups.', sub: "That's enough." },
    { title: 'The floor says thank you.', sub: 'For the regular visits.' },
  ],
}


// ============================================================
// UI Strings
// ============================================================
const pl = {
  // App
  loading: 'Ładowanie…',

  // Level titles
  level_novice: 'Nowicjusz',
  level_beginner: 'Początkujący',
  level_regular: 'Regularny',
  level_advanced: 'Zaawansowany',
  level_veteran: 'Weteran',
  level_legend: 'Legenda',

  // Day names — full (index 0 = Sunday)
  day_0: 'Niedziela',
  day_1: 'Poniedziałek',
  day_2: 'Wtorek',
  day_3: 'Środa',
  day_4: 'Czwartek',
  day_5: 'Piątek',
  day_6: 'Sobota',

  // Day names — short (index 0 = Sunday)
  dshort_0: 'Nd',
  dshort_1: 'Pn',
  dshort_2: 'Wt',
  dshort_3: 'Śr',
  dshort_4: 'Cz',
  dshort_5: 'Pt',
  dshort_6: 'Sb',

  // Auth
  auth_welcome: 'Witaj.',
  auth_tagline: 'Śledź swoje pompki i rywalizuj z innymi.',
  auth_have_account: 'Mam już konto',
  auth_first_time: 'Jestem tu pierwszy raz',
  auth_back: '← Wstecz',
  auth_sign_in_title: 'Zaloguj się',
  auth_sign_up_title: 'Załóż konto',
  auth_sign_in_sub: 'Witaj ponownie. Wpisz swoje dane.',
  auth_sign_up_sub: 'Wybierz nick i podaj dane logowania.',
  auth_nick: 'Nick',
  auth_nick_placeholder: 'Jak masz się nazywać',
  auth_email: 'E-mail',
  auth_password: 'Hasło',
  auth_password_placeholder: 'min. 6 znaków',
  auth_wait: 'Czekaj…',
  auth_sign_in_btn: 'Zaloguj się',
  auth_sign_up_btn: 'Zarejestruj się',
  auth_show_password: 'Pokaż hasło',
  auth_hide_password: 'Ukryj hasło',

  // Exercise buttons
  btn_pushups: '💪 Pompki',
  btn_pullup: '🏋️ Podciąganie',

  // Topbar
  topbar_pompek: 'pompek',
  topbar_pullup: 'podciągnięć',

  // Hero section
  hero_pushups_today: 'Pompki dzisiaj',
  hero_pullup_today: 'Podciągania dzisiaj',
  hero_streak: 'Seria',
  hero_week: 'Tydzień',
  hero_day_singular: 'dzień',
  hero_days_plural: 'dni',
  hero_pushups_unit: 'pompek',
  goal_daily: 'Cel dzienny',
  goal_weekly: 'Cel tygodniowy',

  // Nav
  nav_ranking: 'Ranking',
  nav_home: 'Główna',
  nav_profile: 'Profil',

  // Ranking
  ranking_title: 'Ranking',
  ranking_empty: 'Brak wpisów. Bądź pierwszy!',
  ranking_pompek_unit: 'pompek',
  ranking_me: ' (Ty)',
  ranking_weekly_chart: 'Wykres tygodniowy',
  ranking_last7: 'Ostatnie 7 dni',
  ranking_records: 'Rekordy osobiste',
  ranking_your_best: 'Twoje najlepsze',

  // History
  history_title: 'Moja historia',
  history_loading: 'Ładowanie…',

  // Workout list
  wl_empty: 'Jeszcze nic tu nie ma. Dodaj pierwszy trening powyżej.',
  wl_me: ' (Ty)',
  wl_user: 'Użytkownik',
  wl_plank_unit: 'plank',
  wl_pushup_unit: 'pompek',
  wl_pullup_unit: 'podciągnięć',
  wl_delete_label: 'Usuń',

  // Stats modal — chart
  chart_total: 'Razem:',
  chart_plank_unit: 'plank',
  chart_pushup_unit: 'pompek',

  // Stats modal — records
  records_max_session: 'Max sesja',
  records_max_day: 'Max dzień',
  records_max_week: 'Max 7 dni',
  records_longest_streak: 'Najdłuższa seria',
  records_day_singular: 'dzień',
  records_days_plural: 'dni',

  // Ranking detail modal
  rd_pompek_today: 'pompek dzisiaj',
  rd_total: 'Razem',
  rd_streak: 'Seria dni',
  rd_max_session: 'Max sesja',
  rd_active_days: 'Dni aktywne',
  rd_sessions_total: 'sesji łącznie',

  // Level popup
  level_label: 'Poziom',
  to_lvl: 'Do LVL',
  sign_out: 'Wyloguj',

  // Pull-up stats
  pullup_record: 'Rekord sesji',
  pullup_improvement: 'Poprawa od dnia 1',
  pullup_no_data: 'Dodaj pierwszą sesję aby zobaczyć progres',
  pullup_week: 'Tydzień',

  // Total stats popup
  stats_pushups_total: 'Pompki ogółem',
  stats_pullup_total: 'Podciągania ogółem',
  stats_plank_total: 'Plank ogółem',
  stats_no_data: 'brak danych',
  stats_since: 'od',
  stats_ago_singular: 'dzień temu',
  stats_ago_plural: 'dni temu',
  stats_pushups_unit: 'pompek',
  stats_total_unit: 'łącznie',
  stats_sessions: 'sesji',
  stats_active_days: 'aktywnych dni',
  stats_avg_active: 'śr. / aktywny dzień',
  stats_avg_calendar: 'śr. / dzień kalend.',
  stats_session_record: 'rekord sesji',
  stats_day_record: 'rekord dnia',
  stats_avg_session_len: 'śr. długość sesji',
  stats_current_streak: 'obecna seria',

  // Badge popup
  badge_unlocked: 'Odblokowane!',
  badges_title: 'Odznaki',

  // Nick prompt
  nick_prompt_title: 'Wybierz swój nick',
  nick_prompt_text: 'Pod tym nickiem będziesz widoczny w rankingu i historii. Możesz go później zmienić w zakładce Profil.',
  nick_prompt_placeholder: 'Twój nick',
  nick_prompt_save: 'Zapisz i kontynuuj',
  nick_prompt_saving: 'Zapisywanie…',
  nick_min_length: 'Nick musi mieć co najmniej 2 znaki.',
  nick_save_error: 'Błąd zapisu: ',

  // Delete modal
  delete_title: 'Usunąć trening?',
  delete_pushups_unit: 'pompek',
  delete_from: 'z dnia',
  delete_irreversible: 'Tej akcji nie można cofnąć.',
  delete_cancel: 'Anuluj',
  delete_confirm: 'Usuń',
  delete_doing: 'Usuwanie…',
  delete_error: 'Błąd usuwania: ',

  // Celebrations
  celebration_daily: 'Cel dzienny osiągnięty!',
  celebration_weekly: 'Cel tygodniowy osiągnięty!',
  celebration_milestone: 'Milestone odblokowany!',

  // AddWorkout
  add_date_label: 'Data treningu',
  add_count_sub: 'Liczba pompek',
  add_pullup_count_sub: 'Liczba podciągnięć',
  add_save: 'Zapisz trening',
  add_saving: 'Zapisywanie…',
  add_error_count: 'Podaj liczbę pompek większą od zera.',
  add_error_pullup_count: 'Podaj liczbę podciągnięć większą od zera.',
  add_clear: 'Wyczyść licznik',

  // Profile
  profile_loading: 'Ładowanie profilu…',
  profile_notifications: 'Powiadomienia',
  profile_push_on: 'Będziesz dostawać przypomnienia o pompkach',
  profile_push_off: 'Codzienne przypomnienia o celu (nawet gdy apka zamknięta)',
  profile_personal_data: 'Dane osobiste',
  profile_nick: 'Nick',
  profile_nick_placeholder: 'Jak Cię zwać',
  profile_initials: 'Inicjały',
  profile_initials_placeholder: 'auto',
  profile_name: 'Imię',
  profile_name_placeholder: 'Twoje imię',
  profile_email: 'E-mail',
  profile_height: 'Wzrost (cm)',
  profile_height_placeholder: 'np. 180',
  profile_weight: 'Waga (kg)',
  profile_weight_placeholder: 'np. 75.5',
  profile_goals_section: 'Cele',
  profile_daily_pushups: 'Cel dzienny pompek',
  profile_weekly_pushups: 'Cel tygodniowy pompek',
  profile_save: 'Zapisz zmiany',
  profile_saving: 'Zapisywanie…',
  profile_saved: 'Profil zapisany.',
  profile_load_error: 'Nie można wczytać profilu: ',
  profile_save_error: 'Błąd zapisu: ',
  profile_theme_section: 'Motyw',
  profile_lang_section: 'Język',
  profile_badges_section: 'Odznaki',

  // BMI
  bmi_under: 'Niedowaga',
  bmi_normal: 'Norma',
  bmi_over: 'Nadwaga',
  bmi_obese: 'Otyłość',

  // Visibility reminder
  reminder_title: 'POMPKI ⚡',
  reminder_start: 'Nie zapomnij dziś o pompkach! Cel:',
  reminder_remaining: 'Zostało Ci',
  reminder_to_goal: 'pompek do celu dziennego!',
  reminder_pompek: 'pompek.',

  // Nav — gym
  nav_gym: 'Siłownia',

  // Gym page
  gym_title: 'Siłownia',
  gym_date_label: 'Data',
  gym_no_exercises: 'Brak ćwiczeń tego dnia.',
  gym_add_exercise: '+ Dodaj ćwiczenie',
  gym_add_set: '+ Seria',
  gym_set_label: 'Seria',
  gym_set_placeholder_weight: 'kg',
  gym_set_placeholder_reps: 'pow.',
  gym_save_set: 'Zapisz',
  gym_saving: 'Zapis…',
  gym_delete_set: 'Usuń',
  gym_edit_set: 'Edytuj serię',
  gym_edit_name: 'Edytuj nazwę',
  gym_delete_exercise: 'Usuń ćwiczenie',
  gym_confirm_delete: 'Usunąć?',
  gym_confirm_delete_full: 'Usunąć ćwiczenie',
  gym_confirm_yes: 'Tak',
  gym_confirm_no: 'Nie',
  gym_history_prev: 'Poprzednio',
  gym_history_none: 'Brak wcześniejszego treningu',
  gym_add_hint: 'Ćwiczenie pojawi się na każdy dzień. Serie możesz wpisać teraz lub później.',
  gym_reorder: 'Edytuj',
  gym_reorder_done: 'Gotowe',
  gym_reorder_hint: 'Przeciągnij ☰ aby zmienić kolejność',
  gym_drag: 'Przeciągnij',
  gym_modal_title: 'Wybierz ćwiczenie',
  gym_modal_new: 'Nowe ćwiczenie',
  gym_modal_name: 'Nazwa',
  gym_modal_name_placeholder: 'np. Wyciskanie ławka płaska',
  gym_modal_category: 'Kategoria',
  gym_modal_save: 'Dodaj',
  gym_modal_cancel: 'Anuluj',
  gym_cat_chest: 'Klatka',
  gym_cat_back: 'Plecy',
  gym_cat_shoulders: 'Barki',
  gym_cat_legs: 'Nogi',
  gym_cat_biceps: 'Biceps',
  gym_cat_triceps: 'Triceps',
  gym_cat_other: 'Inne',
  gym_error_name: 'Wpisz nazwę ćwiczenia.',
  gym_error_reps: 'Wpisz liczbę powtórzeń.',
}

const en = {
  // App
  loading: 'Loading…',

  // Level titles
  level_novice: 'Novice',
  level_beginner: 'Beginner',
  level_regular: 'Regular',
  level_advanced: 'Advanced',
  level_veteran: 'Veteran',
  level_legend: 'Legend',

  // Day names — full (index 0 = Sunday)
  day_0: 'Sunday',
  day_1: 'Monday',
  day_2: 'Tuesday',
  day_3: 'Wednesday',
  day_4: 'Thursday',
  day_5: 'Friday',
  day_6: 'Saturday',

  // Day names — short (index 0 = Sunday)
  dshort_0: 'Su',
  dshort_1: 'Mo',
  dshort_2: 'Tu',
  dshort_3: 'We',
  dshort_4: 'Th',
  dshort_5: 'Fr',
  dshort_6: 'Sa',

  // Auth
  auth_welcome: 'Welcome.',
  auth_tagline: 'Track your push-ups and compete with others.',
  auth_have_account: 'I have an account',
  auth_first_time: 'First time here',
  auth_back: '← Back',
  auth_sign_in_title: 'Sign in',
  auth_sign_up_title: 'Create account',
  auth_sign_in_sub: 'Welcome back. Enter your credentials.',
  auth_sign_up_sub: 'Choose a nickname and set your login details.',
  auth_nick: 'Nickname',
  auth_nick_placeholder: 'What to call you',
  auth_email: 'E-mail',
  auth_password: 'Password',
  auth_password_placeholder: 'min. 6 characters',
  auth_wait: 'Please wait…',
  auth_sign_in_btn: 'Sign in',
  auth_sign_up_btn: 'Register',
  auth_show_password: 'Show password',
  auth_hide_password: 'Hide password',

  // Exercise buttons
  btn_pushups: '💪 Push-ups',
  btn_pullup: '🏋️ Pull-ups',

  // Topbar
  topbar_pompek: 'push-ups',
  topbar_pullup: 'pull-ups',

  // Hero section
  hero_pushups_today: 'Push-ups today',
  hero_pullup_today: 'Pull-ups today',
  hero_streak: 'Streak',
  hero_week: 'Week',
  hero_day_singular: 'day',
  hero_days_plural: 'days',
  hero_pushups_unit: 'push-ups',
  goal_daily: 'Daily goal',
  goal_weekly: 'Weekly goal',

  // Nav
  nav_ranking: 'Ranking',
  nav_home: 'Home',
  nav_profile: 'Profile',

  // Ranking
  ranking_title: 'Ranking',
  ranking_empty: 'No entries yet. Be the first!',
  ranking_pompek_unit: 'push-ups',
  ranking_me: ' (You)',
  ranking_weekly_chart: 'Weekly chart',
  ranking_last7: 'Last 7 days',
  ranking_records: 'Personal records',
  ranking_your_best: 'Your best',

  // History
  history_title: 'My history',
  history_loading: 'Loading…',

  // Workout list
  wl_empty: 'Nothing here yet. Add your first workout above.',
  wl_me: ' (You)',
  wl_user: 'User',
  wl_plank_unit: 'plank',
  wl_pushup_unit: 'push-ups',
  wl_pullup_unit: 'pull-ups',
  wl_delete_label: 'Delete',

  // Stats modal — chart
  chart_total: 'Total:',
  chart_plank_unit: 'plank',
  chart_pushup_unit: 'push-ups',

  // Stats modal — records
  records_max_session: 'Max session',
  records_max_day: 'Max day',
  records_max_week: 'Max 7 days',
  records_longest_streak: 'Longest streak',
  records_day_singular: 'day',
  records_days_plural: 'days',

  // Ranking detail modal
  rd_pompek_today: 'push-ups today',
  rd_total: 'Total',
  rd_streak: 'Streak',
  rd_max_session: 'Max session',
  rd_active_days: 'Active days',
  rd_sessions_total: 'sessions total',

  // Level popup
  level_label: 'Level',
  to_lvl: 'To LVL',
  sign_out: 'Sign out',

  // Pull-up stats
  pullup_record: 'Session record',
  pullup_improvement: 'Improvement since day 1',
  pullup_no_data: 'Add your first session to see progress',
  pullup_week: 'Week',

  // Total stats popup
  stats_pushups_total: 'Push-ups total',
  stats_pullup_total: 'Pull-ups total',
  stats_plank_total: 'Plank total',
  stats_no_data: 'no data',
  stats_since: 'since',
  stats_ago_singular: 'day ago',
  stats_ago_plural: 'days ago',
  stats_pushups_unit: 'push-ups',
  stats_total_unit: 'total',
  stats_sessions: 'sessions',
  stats_active_days: 'active days',
  stats_avg_active: 'avg / active day',
  stats_avg_calendar: 'avg / calendar day',
  stats_session_record: 'session record',
  stats_day_record: 'day record',
  stats_avg_session_len: 'avg session length',
  stats_current_streak: 'current streak',

  // Badge popup
  badge_unlocked: 'Unlocked!',
  badges_title: 'Badges',

  // Nick prompt
  nick_prompt_title: 'Choose your nickname',
  nick_prompt_text: 'This nickname will be visible in the ranking and history. You can change it later in the Profile tab.',
  nick_prompt_placeholder: 'Your nickname',
  nick_prompt_save: 'Save and continue',
  nick_prompt_saving: 'Saving…',
  nick_min_length: 'Nickname must be at least 2 characters.',
  nick_save_error: 'Save error: ',

  // Delete modal
  delete_title: 'Delete workout?',
  delete_pushups_unit: 'push-ups',
  delete_from: 'from',
  delete_irreversible: 'This action cannot be undone.',
  delete_cancel: 'Cancel',
  delete_confirm: 'Delete',
  delete_doing: 'Deleting…',
  delete_error: 'Delete error: ',

  // Celebrations
  celebration_daily: 'Daily goal reached!',
  celebration_weekly: 'Weekly goal reached!',
  celebration_milestone: 'Milestone unlocked!',

  // AddWorkout
  add_date_label: 'Workout date',
  add_count_sub: 'Number of push-ups',
  add_pullup_count_sub: 'Number of pull-ups',
  add_save: 'Save workout',
  add_saving: 'Saving…',
  add_error_count: 'Enter a number of push-ups greater than zero.',
  add_error_pullup_count: 'Enter a number of pull-ups greater than zero.',
  add_clear: 'Clear counter',

  // Profile
  profile_loading: 'Loading profile…',
  profile_notifications: 'Notifications',
  profile_push_on: 'You will receive push-up reminders',
  profile_push_off: 'Daily goal reminders (even when the app is closed)',
  profile_personal_data: 'Personal data',
  profile_nick: 'Nickname',
  profile_nick_placeholder: 'What to call you',
  profile_initials: 'Initials',
  profile_initials_placeholder: 'auto',
  profile_name: 'Name',
  profile_name_placeholder: 'Your name',
  profile_email: 'E-mail',
  profile_height: 'Height (cm)',
  profile_height_placeholder: 'e.g. 180',
  profile_weight: 'Weight (kg)',
  profile_weight_placeholder: 'e.g. 75.5',
  profile_goals_section: 'Goals',
  profile_daily_pushups: 'Daily push-up goal',
  profile_weekly_pushups: 'Weekly push-up goal',
  profile_save: 'Save changes',
  profile_saving: 'Saving…',
  profile_saved: 'Profile saved.',
  profile_load_error: 'Could not load profile: ',
  profile_save_error: 'Save error: ',
  profile_theme_section: 'Theme',
  profile_lang_section: 'Language',
  profile_badges_section: 'Badges',

  // BMI
  bmi_under: 'Underweight',
  bmi_normal: 'Normal',
  bmi_over: 'Overweight',
  bmi_obese: 'Obese',

  // Visibility reminder
  reminder_title: 'PUSH-UPS ⚡',
  reminder_start: "Don't forget your push-ups today! Goal:",
  reminder_remaining: 'You have',
  reminder_to_goal: 'push-ups left to reach your daily goal!',
  reminder_pompek: 'push-ups.',

  // Nav — gym
  nav_gym: 'Gym',

  // Gym page
  gym_title: 'Gym',
  gym_date_label: 'Date',
  gym_no_exercises: 'No exercises on this day.',
  gym_add_exercise: '+ Add exercise',
  gym_add_set: '+ Set',
  gym_set_label: 'Set',
  gym_set_placeholder_weight: 'kg',
  gym_set_placeholder_reps: 'reps',
  gym_save_set: 'Save',
  gym_saving: 'Saving…',
  gym_delete_set: 'Delete',
  gym_edit_set: 'Edit set',
  gym_edit_name: 'Edit name',
  gym_delete_exercise: 'Remove exercise',
  gym_confirm_delete: 'Delete?',
  gym_confirm_delete_full: 'Delete exercise',
  gym_confirm_yes: 'Yes',
  gym_confirm_no: 'No',
  gym_history_prev: 'Previously',
  gym_history_none: 'No previous workout',
  gym_add_hint: 'The exercise shows up every day. Log sets now or later.',
  gym_reorder: 'Edit',
  gym_reorder_done: 'Done',
  gym_reorder_hint: 'Drag ☰ to reorder',
  gym_drag: 'Drag',
  gym_modal_title: 'Choose exercise',
  gym_modal_new: 'New exercise',
  gym_modal_name: 'Name',
  gym_modal_name_placeholder: 'e.g. Bench press',
  gym_modal_category: 'Category',
  gym_modal_save: 'Add',
  gym_modal_cancel: 'Cancel',
  gym_cat_chest: 'Chest',
  gym_cat_back: 'Back',
  gym_cat_shoulders: 'Shoulders',
  gym_cat_legs: 'Legs',
  gym_cat_biceps: 'Biceps',
  gym_cat_triceps: 'Triceps',
  gym_cat_other: 'Other',
  gym_error_name: 'Enter exercise name.',
  gym_error_reps: 'Enter number of reps.',
}

export const STRINGS = { pl, en }

/**
 * Returns a translation function for the given language.
 * Falls back to Polish, then returns the key if not found.
 */
export function getT(lang) {
  const strings = STRINGS[lang] || STRINGS.pl
  return (key) => {
    if (key in strings) return strings[key]
    if (key in STRINGS.pl) return STRINGS.pl[key]
    return key
  }
}
