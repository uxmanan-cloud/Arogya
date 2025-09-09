import { NextResponse } from "next/server"
import { ENV } from "@/lib/safe-env"
import { requireAuth } from "@/lib/supabase"
export const runtime = "nodejs"

export async function POST(req: Request) {
  const requestId = crypto.randomUUID()
  if (ENV.MOCK_MODE) {
    return NextResponse.json({
      ok: true,
      mock: true,
      ids: { reportId: "mock-report", explanationId: "mock-exp" },
      requestId,
    })
  }
  const auth = await requireAuth(req)
  return NextResponse.json({ ok: true, mock: false, user: auth, requestId })
}
