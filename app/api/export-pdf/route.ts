import { NextResponse } from "next/server"
import { renderPdf } from "@/lib/pdf"
import { requireAuth } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req as any)

    const payload = await req.json().catch(() => ({}))

    const { url, expiresAt } = await renderPdf({
      ...payload,
      userId: auth.userId,
    })

    return NextResponse.json({ ok: true, url, expiresAt })
  } catch (error) {
    console.error("[v0] Export PDF error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
