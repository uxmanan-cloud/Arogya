import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET() {
  let hasPdfParse = false
  try {
    await import("pdf-parse")
    hasPdfParse = true
  } catch {
    hasPdfParse = false
  }

  return NextResponse.json({
    route: "/api/ocr-explain",
    runtime: "nodejs",
    hasPdfParse,
    guards: { blocksLocalPaths: true },
    now: new Date().toISOString(),
  })
}
