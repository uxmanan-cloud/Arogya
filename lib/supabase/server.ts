import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { ENV } from "../safe-env"

export function getServerSupabase() {
  const cookieStore = cookies()

  return createServerClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

export function getServerSupabaseFromRequest(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  return { supabase, response }
}

// Service role client for admin operations
export function getServiceSupabase() {
  return createServerClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY, {
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
  })
}

// Helper to get authenticated user from server components
export async function getUser() {
  const supabase = getServerSupabase()
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  } catch (error) {
    console.error("Error:", error)
    return null
  }
}

// Helper to require authentication in API routes
export async function requireAuth(request: NextRequest) {
  const { supabase } = getServerSupabaseFromRequest(request)

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    // Check for mock mode fallback
    if (ENV.MOCK_MODE) {
      return { userId: "mock-user", email: "mock-user@localhost" }
    }
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  return { userId: user.id, email: user.email ?? undefined }
}
