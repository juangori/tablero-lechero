import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_KEY, DB_SCHEMA } from './config'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  db: { schema: DB_SCHEMA },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: 'tablero-lechero-auth',
  },
})
