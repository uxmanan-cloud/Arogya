import { createBrowserClient } from "@supabase/ssr"
import { ENV } from "../safe-env"

export function getBrowserSupabase() {
  return createBrowserClient(ENV.NEXT_PUBLIC_SUPABASE_URL, ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}
