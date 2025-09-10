import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, supabase } = await requireAuth(request)
    const reportId = params.id

    // First, get the report to ensure it belongs to the user
    const { data: report, error: fetchError } = await supabase
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .eq("user_id", user.id)
      .single()

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json({ error: "Report not found" }, { status: 404 })
      }
      console.error("[v0] Error fetching report for reprocessing:", fetchError)
      return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 })
    }

    if (!report.file_url) {
      return NextResponse.json({ error: "Report has no file URL to reprocess" }, { status: 400 })
    }

    // Update status to processing
    const { error: updateError } = await supabase
      .from("reports")
      .update({
        status: "processing",
        analysis_result: null,
        extracted_text: null,
      })
      .eq("id", reportId)

    if (updateError) {
      console.error("[v0] Error updating report status:", updateError)
      return NextResponse.json({ error: "Failed to update report status" }, { status: 500 })
    }

    // Call the OCR explain API to reprocess the file
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000"

    const ocrResponse = await fetch(`${baseUrl}/api/ocr-explain`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: request.headers.get("Authorization") || "",
        Cookie: request.headers.get("Cookie") || "",
      },
      body: JSON.stringify({
        fileUrl: report.file_url,
        language: "en",
        prefs: {},
      }),
    })

    const ocrResult = await ocrResponse.json()

    if (!ocrResponse.ok || !ocrResult.ok) {
      // Update status to failed
      await supabase
        .from("reports")
        .update({
          status: "failed",
          analysis_result: { error: ocrResult.error || "OCR processing failed" },
        })
        .eq("id", reportId)

      return NextResponse.json({ error: "Failed to reprocess report", details: ocrResult.error }, { status: 500 })
    }

    // Update report with new results
    const { data: updatedReport, error: finalUpdateError } = await supabase
      .from("reports")
      .update({
        status: "completed",
        extracted_text: ocrResult.extractedText || "",
        analysis_result: ocrResult.findings || ocrResult,
      })
      .eq("id", reportId)
      .select()
      .single()

    if (finalUpdateError) {
      console.error("[v0] Error saving reprocessed results:", finalUpdateError)
      return NextResponse.json({ error: "Failed to save reprocessed results" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      report: updatedReport,
      ocrResult,
    })
  } catch (error) {
    console.error("[v0] Reprocess report API error:", error)

    // Try to update status to failed
    try {
      const { supabase } = await requireAuth(request)
      await supabase.from("reports").update({ status: "failed" }).eq("id", params.id)
    } catch (updateError) {
      console.error("[v0] Failed to update status to failed:", updateError)
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
