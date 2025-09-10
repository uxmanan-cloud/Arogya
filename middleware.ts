import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { ENV } from "@/lib/safe-env"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const hasSupabaseConfig =
    ENV.SUPABASE_URL && ENV.SUPABASE_ANON_KEY && ENV.SUPABASE_URL !== "" && ENV.SUPABASE_ANON_KEY !== ""

  // If Supabase isn't configured, allow all requests to pass through
  if (!hasSupabaseConfig) {
    if (request.nextUrl.pathname.startsWith("/app")) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    return response
  }

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

  try {
    // Refresh session if expired - required for Server Components
    await supabase.auth.getUser()

    // Protect /app routes
    if (request.nextUrl.pathname.startsWith("/app")) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.redirect(new URL("/auth/signin", request.url))
      }
    }

    // Redirect authenticated users away from auth pages
    if (request.nextUrl.pathname.startsWith("/auth/")) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        return NextResponse.redirect(new URL("/app", request.url))
      }
    }
  } catch (error) {
    console.error("[v0] Middleware auth check failed:", error)
    // Redirect protected routes to home on auth errors
    if (request.nextUrl.pathname.startsWith("/app")) {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
