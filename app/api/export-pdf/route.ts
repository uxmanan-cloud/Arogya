import { NextResponse } from "next/server"
import { renderPdf } from "@/lib/pdf"
export const runtime = "nodejs"

export async function POST(req: Request) {
  const payload = await req.json().catch(() => ({}))
  const { url, expiresAt } = await renderPdf(payload)
  return NextResponse.json({ ok: true, url, expiresAt })
}
