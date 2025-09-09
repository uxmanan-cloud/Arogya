import { NextResponse } from "next/server"
import { ENV } from "@/lib/safe-env"
import { assertAbsoluteHttps } from "@/lib/url-utils"

// Node runtime
export const runtime = "nodejs"

// Lazy imports for server-only libs
async function readPdfText(buf: ArrayBuffer) {
  const pdfParse = (await import("pdf-parse")).default as any
  const nodeBuf = Buffer.from(buf)
  const res = await pdfParse(nodeBuf)
  return String(res?.text || "")
}

async function ocrImageWithVision(base64Content: string): Promise<string> {
  const key = ENV.GOOGLE_CLOUD_VISION_KEY
  const url = `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(key)}`
  const payload = {
    requests: [
      {
        image: { content: base64Content },
        features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
      },
    ],
  }
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  const j = await r.json()
  const text = j?.responses?.[0]?.fullTextAnnotation?.text || j?.responses?.[0]?.textAnnotations?.[0]?.description || ""
  return text
}

async function maybeTranslate(text: string, target: string): Promise<string> {
  if (!text) return text
  if (!target || target.toLowerCase() === "en") return text
  const key = ENV.GOOGLE_TRANSLATE_KEY
  const url = `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(key)}`
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: text, target }),
  })
  const j = await r.json()
  return j?.data?.translations?.[0]?.translatedText || text
}

async function enrichWithOpenAI(payload: {
  rawText: string
  labs: { name: string; value: number; unit?: string }[]
  ecgFlags: string[]
  language: string
  prefs: any
}) {
  const { OpenAI } = await import("openai")
  const client = new OpenAI({ apiKey: ENV.OPENAI_API_KEY })

  const system = `
You are an assistant that returns STRICT JSON ONLY. No prose.
Return shape:
{
  "summary": string,
  "risks": string[],
  "labs": { "name": string, "value": number, "unit": string }[],
  "ecgFlags": string[],
  "diet": string[],
  "workout": string[]
}
Use the provided labs array as the source of truth; fill in reasonable diet/workout suggestions.
If unsure, use nulls or empty arrays. Do not include extra keys.`

  const user = JSON.stringify({
    language: payload.language || "en",
    prefs: payload.prefs || {},
    rawText: payload.rawText.slice(0, 30_000), // guard size
    labs: payload.labs,
    ecgFlags: payload.ecgFlags,
  })

  // Use the JSON response format
  const resp = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  })

  const text = resp.choices?.[0]?.message?.content || "{}"
  try {
    return JSON.parse(text)
  } catch {
    return {
      summary: "Unable to parse AI response",
      risks: [],
      labs: payload.labs,
      ecgFlags: payload.ecgFlags,
      diet: [],
      workout: [],
    }
  }
}

type TermValueItem = {
  term: string
  value: number | string
  units: string | null
  refRange: string | null
  rawLine: string
}

type ExtractionMeta = {
  contentType: string | null
  textLength: number
  parsedCount: number
  used: "pdf-parse" | "ocr"
}

type SuccessResponse = {
  ok: true
  meta: ExtractionMeta
  data: {
    findings: TermValueItem[]
    previewText: string
  }
}

type ErrorResponse = {
  ok: false
  error: string
  details?: string
}

function extractMedicalTerms(text: string): TermValueItem[] {
  const findings: TermValueItem[] = []
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  // Common medical term patterns
  const patterns = [
    // "Hemoglobin: 13.5 g/dL" or "Hb 13.5 g/dL (Ref: 12–16)"
    /^([A-Za-z][A-Za-z0-9\s\-$$$$]+?)[\s:]+([0-9]+\.?[0-9]*)\s*([a-zA-Z/]+)?\s*(?:$$(?:Ref:?\s*)?([0-9\-–—]+(?:\s*[a-zA-Z/]*)?)$$)?/,

    // "Fasting Glucose - 98 mg/dL (70–100)"
    /^([A-Za-z][A-Za-z0-9\s\-$$$$]+?)\s*[-–—]\s*([0-9]+\.?[0-9]*)\s*([a-zA-Z/]+)?\s*(?:$$([0-9\-–—]+(?:\s*[a-zA-Z/]*)?)$$)?/,

    // "Vitamin D (25-OH) 22 ng/mL, Range 30–100"
    /^([A-Za-z][A-Za-z0-9\s\-$$$$]+?)\s+([0-9]+\.?[0-9]*)\s*([a-zA-Z/]+)?\s*(?:,?\s*Range\s*([0-9\-–—]+(?:\s*[a-zA-Z/]*)?)?)?/,
  ]

  const seenTerms = new Set<string>()

  for (const line of lines) {
    // Skip obvious non-medical content
    if (line.match(/^(Dr\.|Doctor|Address|Phone|Date|Invoice|Patient ID|DOB)/i)) continue
    if (line.length < 5 || line.length > 200) continue

    for (const pattern of patterns) {
      const match = line.match(pattern)
      if (match) {
        const [, termRaw, valueRaw, unitsRaw, refRangeRaw] = match

        // Clean up term name
        const term = termRaw
          .trim()
          .replace(/[:\-–—]+$/, "")
          .trim()
        if (term.length < 2) continue

        // Normalize term for deduplication
        const normalizedTerm = term.toLowerCase().replace(/[^a-z0-9]/g, "")
        if (seenTerms.has(normalizedTerm)) continue

        // Parse value
        const numValue = Number.parseFloat(valueRaw)
        const value = isNaN(numValue) ? valueRaw : numValue

        // Clean units and reference range
        const units = unitsRaw?.trim() || null
        const refRange = refRangeRaw?.trim() || null

        findings.push({
          term,
          value,
          units,
          refRange,
          rawLine: line,
        })

        seenTerms.add(normalizedTerm)
        break // Only match first pattern per line
      }
    }
  }

  return findings
}

type Payload = {
  fileUrl: string
  language?: string
  prefs?: Record<string, any>
  mode?: "live" | "mock"
}

function bad(status: number, body: any): NextResponse<ErrorResponse> {
  return NextResponse.json({ ok: false, ...body }, { status })
}

export async function POST(req: Request): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  try {
    const body = (await req.json()) as Payload

    if (!body?.fileUrl || typeof body.fileUrl !== "string") {
      return bad(400, { error: "fileUrl is required" })
    }

    if (body.fileUrl.startsWith("./") || body.fileUrl.startsWith("/") || body.fileUrl.includes("test/data")) {
      return bad(400, { error: "Local file paths are not allowed" })
    }

    if (!body.fileUrl.startsWith("http://") && !body.fileUrl.startsWith("https://")) {
      return bad(400, { error: "fileUrl must be an http(s) URL" })
    }

    console.log("[v0] OCR route processing:", {
      mode: body.mode || "live",
      hasFileUrl: !!body.fileUrl,
      urlType: body.fileUrl.startsWith("https://") ? "https" : "http",
    })

    if (body.mode === "mock") {
      console.log("[v0] Using mock mode - no file processing")

      const mockFindings: TermValueItem[] = [
        {
          term: "Hemoglobin",
          value: 13.5,
          units: "g/dL",
          refRange: "12–16",
          rawLine: "Hemoglobin: 13.5 g/dL (Ref: 12–16)",
        },
        {
          term: "Fasting Glucose",
          value: 98,
          units: "mg/dL",
          refRange: "70–100",
          rawLine: "Fasting Glucose - 98 mg/dL (70–100)",
        },
        {
          term: "Cholesterol Total",
          value: 180,
          units: "mg/dL",
          refRange: "< 200",
          rawLine: "Cholesterol Total 180 mg/dL (< 200)",
        },
      ]

      return NextResponse.json({
        ok: true,
        meta: {
          contentType: "application/pdf",
          textLength: 500,
          parsedCount: 3,
          used: "pdf-parse",
        },
        data: {
          findings: mockFindings,
          previewText:
            "Mock lab report: Patient shows normal glucose levels, hemoglobin within range, and acceptable cholesterol levels. All major indicators are within healthy parameters.",
        },
      })
    }

    try {
      assertAbsoluteHttps(body.fileUrl)
    } catch (error) {
      return bad(400, { error: "fileUrl must be an http(s) URL" })
    }

    console.log("[v0] Fetching file from URL:", body.fileUrl)
    let fRes: Response
    try {
      fRes = await fetch(body.fileUrl, { redirect: "follow", cache: "no-store" })
    } catch (fetchError) {
      return bad(502, {
        error: "Could not fetch file",
        details: fetchError instanceof Error ? fetchError.message : "Network error",
      })
    }

    if (!fRes.ok) {
      return bad(502, { error: "Could not fetch file", details: `HTTP ${fRes.status}: ${fRes.statusText}` })
    }

    const contentType = fRes.headers.get("content-type") || ""
    const isPdf = contentType.includes("application/pdf")
    const isImage = contentType.startsWith("image/")
    const buf = await fRes.arrayBuffer()

    console.log("[v0] File fetched successfully:", {
      contentType,
      size: buf.byteLength,
      isPdf,
      isImage,
    })

    let rawText = ""
    let extractorUsed: "pdf-parse" | "ocr" = "pdf-parse"

    if (isPdf) {
      try {
        const pdfParse = (await import("pdf-parse")).default as any
        const nodeBuf = Buffer.from(buf)
        const res = await pdfParse(nodeBuf) // Only Buffer allowed here
        rawText = String(res?.text || "")
        extractorUsed = "pdf-parse"

        console.log("[v0] PDF processing completed:", {
          used: "pdf-parse",
          textLength: rawText.length,
          hasText: rawText.trim().length > 0,
        })

        // If PDF has no text layer, indicate OCR is needed
        if (rawText.trim().length < 10) {
          return bad(400, {
            error: "No text extracted; OCR not enabled",
            details:
              "This appears to be a scanned PDF without a text layer. OCR functionality is not currently enabled.",
          })
        }
      } catch (pdfError) {
        return bad(500, {
          error: "PDF parsing failed",
          details: "Unable to parse PDF content",
        })
      }
    } else if (isImage) {
      // OCR for images (feature-flagged for future implementation)
      return bad(400, {
        error: "No text extracted; OCR not enabled",
        details: "Image OCR is not currently enabled. Please upload a PDF with a text layer.",
      })
    } else {
      return bad(400, {
        error: "Unsupported file type",
        details: `Content-Type '${contentType}' is not supported. Please upload a PDF or image file.`,
      })
    }

    const findings = extractMedicalTerms(rawText)

    console.log("[v0] Medical term extraction completed:", {
      findingsCount: findings.length,
      textLength: rawText.length,
    })

    return NextResponse.json({
      ok: true,
      meta: {
        contentType,
        textLength: rawText.length,
        parsedCount: findings.length,
        used: extractorUsed,
      },
      data: {
        findings,
        previewText: rawText.slice(0, 500),
      },
    })
  } catch (e: any) {
    console.error("[v0] OCR API error:", e)
    return bad(500, {
      error: "Internal server error",
      details: "Processing failed",
    })
  }
}
