import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

export function createClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return new Proxy({} as SupabaseClient, {
      get() {
        throw new Error(
          'Supabase non configuré : ajoutez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY dans les variables d’environnement du projet Vercel.',
        )
      },
    })
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}