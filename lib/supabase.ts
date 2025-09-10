import { createClient } from "@supabase/supabase-js"
import { ENV } from "./safe-env"

// Legacy exports for backward compatibility
export const supabaseBrowser = () => createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY)
export const supabaseService = () => createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY)

export type Authed = { userId: string; email?: string }

// Legacy auth function - kept for existing API routes
export async function requireAuth(request: Request): Promise<Authed> {
  const auth = request.headers.get("authorization") || ""
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : ""
  if (!token) {
    if (ENV.MOCK_MODE) return { userId: "mock-user", email: "mock-user@localhost" }
    throw new Response("Unauthorized", { status: 401 })
  }
  const supa = supabaseService()
  const { data, error } = await supa.auth.getUser(token)
  if (error || !data.user) throw new Response("Unauthorized", { status: 401 })
  return { userId: data.user.id, email: data.user.email ?? undefined }
}

// Re-export new client helpers
export { getBrowserSupabase } from "./supabase/browser"
export { getServerSupabase, getUser, requireAuth as requireAuthNew } from "./supabase/server"
