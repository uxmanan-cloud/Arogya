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
    const { path } = await req.json()

    if (!path || typeof path !== "string") {
      return NextResponse.json({ error: "path is required" }, { status: 400 })
    }

    console.log("[v0] Creating signed upload URL for path:", path)

    const supabase = createServiceRoleClient()

    // Generate signed upload URL using service role for the reports bucket
    const { data, error } = await supabase.storage.from("reports").createSignedUploadUrl(path, 600) // 10 minutes

    if (error) {
      console.error("[v0] Signed upload URL error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Signed upload URL created successfully")
    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path,
    })
  } catch (error) {
    console.error("[v0] Create signed upload route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
