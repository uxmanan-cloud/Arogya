import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { ENV } from "@/lib/safe-env"

export const runtime = "nodejs"

function createServiceRoleClient() {
  if (!ENV.SUPABASE_URL || !ENV.SUPABASE_SERVICE_ROLE) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE environment variables")
  }

  return createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function POST(req: Request) {
  try {
    const { key, expiresInSeconds = 600 } = await req.json()

    if (!key || typeof key !== "string") {
      return NextResponse.json({ error: "key is required" }, { status: 400 })
    }

    console.log("[v0] Creating signed URL for key:", key, "expires in:", expiresInSeconds)

    const supabase = createServiceRoleClient()

    // Generate signed URL using service role for the configured bucket
    const { data, error } = await supabase.storage.from(ENV.SUPABASE_BUCKET).createSignedUrl(key, expiresInSeconds)

    if (error) {
      console.error("[v0] Signed URL error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Signed URL created successfully")
    return NextResponse.json({ signedUrl: data.signedUrl })
  } catch (error) {
    console.error("[v0] Sign URL route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
