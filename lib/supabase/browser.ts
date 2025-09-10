import { createClient } from "@supabase/supabase-js"
import { ENV } from "../safe-env"

export function getBrowserSupabase() {
  const url = ENV.NEXT_PUBLIC_SUPABASE_URL
  const key = ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  })
}
