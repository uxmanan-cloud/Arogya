import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request)

    // Fetch user's reports from the database
    const { data: reports, error } = await supabase
      .from("reports")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching reports:", error)
      return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
    }

    return NextResponse.json({ reports })
  } catch (error) {
    console.error("[v0] Reports API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request)
    const body = await request.json()

    const { title, file_url, status = "processing" } = body

    if (!title || !file_url) {
      return NextResponse.json({ error: "Title and file_url are required" }, { status: 400 })
    }

    // Create new report
    const { data: report, error } = await supabase
      .from("reports")
      .insert({
        user_id: user.id,
        title,
        file_url,
        status,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating report:", error)
      return NextResponse.json({ error: "Failed to create report" }, { status: 500 })
    }

    return NextResponse.json({ report }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create report API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
