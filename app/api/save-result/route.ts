import { NextResponse } from "next/server"
import { ENV } from "@/lib/safe-env"
import { requireAuth } from "@/lib/supabase/server"
import { getServiceSupabase } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req as any)
    const requestId = crypto.randomUUID()

    if (ENV.MOCK_MODE) {
      return NextResponse.json({
        ok: true,
        mock: true,
        ids: { reportId: "mock-report", explanationId: "mock-exp" },
        requestId,
        userId: auth.userId,
      })
    }

    const { fileUrl, fileName, extractedText, explainedData } = await req.json()

    if (!fileUrl) {
      return NextResponse.json({ error: "fileUrl is required" }, { status: 400 })
    }

    const supabase = getServiceSupabase()

    const { data, error } = await supabase
      .from("reports")
      .insert({
        user_id: auth.userId,
        file_url: fileUrl,
        file_name: fileName,
        extracted_text: extractedText,
        explained_data: explainedData,
        status: "completed",
        processed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Database save error:", error)
      return NextResponse.json({ error: "Failed to save report" }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      mock: false,
      reportId: data.id,
      userId: auth.userId,
      requestId,
    })
  } catch (error) {
    console.error("[v0] Save result error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
