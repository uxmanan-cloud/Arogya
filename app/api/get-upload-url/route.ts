import { NextResponse } from "next/server"
import { ENV } from "@/lib/safe-env"
import { supabaseService } from "@/lib/supabase"

export const runtime = "nodejs"

export async function GET() {
  if (ENV.MOCK_MODE) {
    return NextResponse.json({
      ok: true,
      uploadUrl: `${ENV.SUPABASE_URL}/storage/v1/object/reports/mock-${Date.now()}.pdf`,
      maxBytes: 25 * 1024 * 1024,
      allowed: [".pdf", ".png", ".jpg", ".jpeg"],
      mock: true,
    })
  }

  if (ENV.SUPABASE_URL && ENV.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = supabaseService()
      const fileName = `report-${Date.now()}-${Math.random().toString(36).substring(7)}`

      const { data, error } = await supabase.storage.from("reports").createSignedUploadUrl(fileName)

      if (error) {
        console.error("[v0] Supabase signed URL error:", error)
        return NextResponse.json({
          ok: false,
          error: "Failed to generate upload URL",
          mock: false,
        })
      }

      return NextResponse.json({
        ok: true,
        uploadUrl: data.signedUrl,
        maxBytes: 25 * 1024 * 1024,
        allowed: [".pdf", ".png", ".jpg", ".jpeg"],
        mock: false,
      })
    } catch (error) {
      console.error("[v0] Upload URL generation error:", error)
      return NextResponse.json({
        ok: false,
        error: "Storage service unavailable",
        mock: false,
      })
    }
  }

  // Fallback if Supabase not configured
  return NextResponse.json({
    ok: false,
    error: "No storage provider configured",
    mock: false,
  })
}
