import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, supabase } = await requireAuth(request)
    const reportId = params.id

    // Fetch specific report for the user
    const { data: report, error } = await supabase
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .eq("user_id", user.id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Report not found" }, { status: 404 })
      }
      console.error("[v0] Error fetching report:", error)
      return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 })
    }

    return NextResponse.json({ report })
  } catch (error) {
    console.error("[v0] Report detail API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, supabase } = await requireAuth(request)
    const reportId = params.id
    const body = await request.json()

    // Update report (only allow certain fields)
    const allowedFields = ["title", "status", "analysis_result", "extracted_text"]
    const updateData: any = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const { data: report, error } = await supabase
      .from("reports")
      .update(updateData)
      .eq("id", reportId)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating report:", error)
      return NextResponse.json({ error: "Failed to update report" }, { status: 500 })
    }

    return NextResponse.json({ report })
  } catch (error) {
    console.error("[v0] Update report API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, supabase } = await requireAuth(request)
    const reportId = params.id

    // Delete report
    const { error } = await supabase.from("reports").delete().eq("id", reportId).eq("user_id", user.id)

    if (error) {
      console.error("[v0] Error deleting report:", error)
      return NextResponse.json({ error: "Failed to delete report" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete report API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
