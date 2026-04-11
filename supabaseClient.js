import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Brak VITE_SUPABASE_URL lub VITE_SUPABASE_ANON_KEY w .env — utwórz plik .env na podstawie .env.example.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
