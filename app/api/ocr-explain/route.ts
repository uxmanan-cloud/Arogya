import { NextResponse } from "next/server"
import { ENV } from "@/lib/safe-env"
import { requireAuth } from "@/lib/supabase/server"

// Node runtime
export const runtime = "nodejs"

// Lazy imports for server-only libs
async function readPdfText(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = (await import("pdf-parse")).default as any

    // Ensure we're passing a proper Buffer with options to prevent internal file operations
    const options = {
      // Disable internal file operations
      normalizeWhitespace: false,
      disableCombineTextItems: false,
    }

    const result = await pdfParse(buffer, options)
    return String(result?.text || "")
  } catch (error) {
    console.log("[v0] pdf-parse error:", error)
    throw error
  }
}

async function ocrWithVision(buffer: Buffer): Promise<string> {
  if (!ENV.GOOGLE_SERVICE_ACCOUNT_JSON || !ENV.GOOGLE_PROJECT_ID) {
    throw new Error("Google Cloud Vision credentials not configured")
  }

  const { ImageAnnotatorClient } = await import("@google-cloud/vision")
  const credentials = JSON.parse(ENV.GOOGLE_SERVICE_ACCOUNT_JSON)
  const client = new ImageAnnotatorClient({
    credentials,
    projectId: ENV.GOOGLE_PROJECT_ID,
  })

  const [result] = await client.documentTextDetection({
    image: { content: buffer },
  })

  return result.fullTextAnnotation?.text || ""
}

async function ocrWithTesseract(buffer: Buffer): Promise<string> {
  const { recognize } = await import("tesseract.js")

  console.log("[v0] Running Tesseract OCR on PDF buffer")

  try {
    const { data } = (await Promise.race([
      recognize(buffer, "eng", {
        tessedit_pageseg_mode: 1, // Automatic page segmentation with OSD
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Tesseract timeout")), 20000)),
    ])) as any

    return data.text || ""
  } catch (error) {
    console.error("[v0] Tesseract failed:", error)
    return ""
  }
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
  flag: "Concern" | "Everything looks good" | "Borderline" | "High" | "Low" | null
  rawLine: string
}

type PatientInfo = {
  name?: string
  ageYears?: number
  gender?: string
  bookingId?: string
  sampleDate?: string
}

type ExtractionMeta = {
  contentType: string | null
  size: number
  status: number
  used: "pdf-parse" | "vision-ocr" | "tesseract"
  parsedCount: number
  enginesSkipped?: string[]
}

type SuccessResponse = {
  ok: true
  meta: ExtractionMeta
  patient: PatientInfo
  data: {
    findings: TermValueItem[]
    previewText: string
  }
}

type ErrorResponse = {
  ok: false
  error: string
  details?: any
  meta?: Partial<ExtractionMeta>
}

function normalizeTermName(rawTerm: string): string {
  const term = rawTerm
    .trim()
    .replace(/[:\-–—]+$/, "")
    .trim()

  const normalizations: Record<string, string> = {
    "Hemoglobin Hb": "Hemoglobin",
    "Haemoglobin (HB)": "Hemoglobin",
    "Thyroid Stimulating Hormone (TSH)-Ultrasensitive": "TSH",
    "TSH-Ultrasensitive": "TSH",
    "Serum Creatinine": "Creatinine",
    "Total Cholesterol": "Total Cholesterol",
    "Cholesterol-Total, Serum": "Total Cholesterol",
    "Cholesterol Total": "Total Cholesterol",
    "Serum Triglycerides": "Triglycerides",
    "Vitamin D Total-25 Hydroxy": "Vitamin D 25-OH",
    "Vitamin D (25-OH)": "Vitamin D 25-OH",
    "VITAMIN B12": "Vitamin B12",
    "Vitamin B-12": "Vitamin B12",
  }

  return normalizations[term] || term
}

function normalizeUnits(rawUnits: string | null): string | null {
  if (!rawUnits) return null

  const units = rawUnits.trim()
  const standardUnits: Record<string, string> = {
    "mg/dl": "mg/dl",
    "mg/dL": "mg/dl",
    "g/dL": "g/dL",
    "g/dl": "g/dL",
    "µIU/ml": "µIU/ml",
    "uIU/ml": "µIU/ml",
    "ng/ml": "ng/ml",
    "ng/mL": "ng/ml",
    "U/L": "U/L",
    "mmol/L": "mmol/L",
    "10^3/µl": "10^3/µl",
    fL: "fL",
    pg: "pg",
    "%": "%",
  }

  return standardUnits[units] || units
}

function detectFlag(line: string, nextLine?: string): TermValueItem["flag"] {
  const flagPattern = /(Everything looks good|Concern|Borderline|High|Low)/i

  const match = line.match(flagPattern) || nextLine?.match(flagPattern)
  if (match) {
    const flag = match[1].toLowerCase()
    switch (flag) {
      case "everything looks good":
        return "Everything looks good"
      case "concern":
        return "Concern"
      case "borderline":
        return "Borderline"
      case "high":
        return "High"
      case "low":
        return "Low"
      default:
        return null
    }
  }
  return null
}

function extractMedicalTerms(text: string): TermValueItem[] {
  const findings: TermValueItem[] = []
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  const seenTerms = new Set<string>()

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const nextLine = lines[i + 1]

    // Skip headers and non-medical content
    if (
      line.match(
        /^(Dr\.|Doctor|Address|Phone|Date|Invoice|Patient ID|DOB|Test Name|Value|Unit|Bio\. Ref Interval|Method:|Page \d+)/i,
      )
    )
      continue
    if (line.length < 5 || line.length > 300) continue

    let match: RegExpMatchArray | null = null
    let term = ""
    let value: number | string = ""
    let units: string | null = null
    let refRange: string | null = null

    // Pattern 1: Table row format (most specific)
    // e.g. "Serum Creatinine ... 1.06 mg/dl 0.2-1.2"
    const tablePattern =
      /^([A-Za-z0-9 /()\-.,+%]+?)\s+([+-]?\d+(?:\.\d+)?)\s+([A-Za-zµ/%^0-9\-·]+)\s+((?:[<>=]?\s*\d+(?:\.\d+)?\s*(?:–|-|to)\s*\d+(?:\.\d+)?|[<>=]\s*\d+(?:\.\d+)?|[A-Za-z0-9 ./%^µ\-–<>=]+))$/
    match = line.match(tablePattern)
    if (match) {
      ;[, term, value, units, refRange] = match
    }

    // Pattern 2: Card/colon format
    // e.g. "Haemoglobin (HB) : 14.6 g/dL" or "Cholesterol-Total, Serum 249 mg/dl   Concern"
    if (!match) {
      const cardPattern = /^([A-Za-z0-9 ()/\-.,]+?)\s*[:-]\s*([+-]?\d+(?:\.\d+)?)(?:\s*([A-Za-zµ/%^0-9\-·]+))?/
      match = line.match(cardPattern)
      if (match) {
        ;[, term, value, units] = match
      }
    }

    // Pattern 3: Summary card format
    // e.g. "Vitamin D 11.94 ng/ml  Concern"
    if (!match) {
      const summaryPattern =
        /^([A-Za-z0-9 ()/\-.,]+?)\s+([+-]?\d+(?:\.\d+)?)\s*([A-Za-zµ/%^0-9\-·]+)?\s*(Concern|Everything looks good|Borderline|High|Low)?/
      match = line.match(summaryPattern)
      if (match) {
        ;[, term, value, units] = match
      }
    }

    // Pattern 4: Stacked format (term on one line, value on next)
    if (!match && nextLine) {
      const termPattern = /^([A-Za-z][A-Za-z0-9 ()/\-.,]+)$/
      const valuePattern = /^([+-]?\d+(?:\.\d+)?)(?:\s*([A-Za-zµ/%^0-9\-·]+))?/

      const termMatch = line.match(termPattern)
      const valueMatch = nextLine.match(valuePattern)

      if (termMatch && valueMatch) {
        term = termMatch[1]
        value = valueMatch[1]
        units = valueMatch[2] || null
        i++ // Skip next line since we processed it
      }
    }

    if (term && value) {
      // Normalize term for deduplication
      const normalizedKey = term.toLowerCase().replace(/[^a-z0-9]/g, "")
      if (seenTerms.has(normalizedKey)) continue

      // Parse numeric value
      const numValue = Number.parseFloat(String(value))
      const finalValue = isNaN(numValue) ? value : numValue

      // Handle percentage and ratio units
      if (!units && (String(value).includes("%") || term.toLowerCase().includes("ratio"))) {
        units = String(value).includes("%") ? "%" : "Ratio"
      }

      // Detect flags
      const flag = detectFlag(line, nextLine)

      // Extract reference range from parentheses if not already found
      if (!refRange) {
        const refMatch = line.match(/$$([^)]+(?:–|-|to)[^)]+)$$/) || line.match(/Ref:?\s*([0-9\-–—<>=\s.]+)/)
        if (refMatch) {
          refRange = refMatch[1].trim()
        }
      }

      findings.push({
        term: normalizeTermName(term),
        value: finalValue,
        units: normalizeUnits(units),
        refRange: refRange?.trim() || null,
        flag,
        rawLine: line,
      })

      seenTerms.add(normalizedKey)
    }
  }

  return findings
}

function extractPatientInfo(text: string): PatientInfo {
  const patient: PatientInfo = {}
  const lines = text.split("\n").slice(0, 20) // Check first 20 lines

  for (const line of lines) {
    // Name extraction (common patterns)
    if (!patient.name) {
      const nameMatch =
        line.match(/(?:Name|Patient)[:\s]+([A-Za-z\s]+)/) || line.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)$/)
      if (nameMatch && nameMatch[1].length < 50) {
        patient.name = nameMatch[1].trim()
      }
    }

    // Booking ID
    if (!patient.bookingId) {
      const bookingMatch = line.match(/(?:Booking|ID|Reference)[:\s#]+([A-Z0-9]+)/)
      if (bookingMatch) {
        patient.bookingId = bookingMatch[1]
      }
    }

    // Sample date
    if (!patient.sampleDate) {
      const dateMatch = line.match(/(?:Sample|Collection|Date)[:\s]+(\d{1,2}\/\w{3}\/\d{4}|\d{1,2}-\d{1,2}-\d{4})/)
      if (dateMatch) {
        patient.sampleDate = dateMatch[1]
      }
    }

    // Age and gender
    if (!patient.ageYears || !patient.gender) {
      const ageGenderMatch = line.match(/(\d{1,3})\s*(?:years?|yrs?|Y)\s*(?:old)?\s*[,\s]*([MF]ale|[MF])/i)
      if (ageGenderMatch) {
        patient.ageYears = Number.parseInt(ageGenderMatch[1])
        patient.gender = ageGenderMatch[2].toLowerCase().startsWith("m") ? "Male" : "Female"
      }
    }
  }

  return patient
}

type Payload = {
  fileUrl: string
  pages?: number
  language?: string
  prefs?: Record<string, any>
  mode?: "live" | "mock"
}

function bad(status: number, body: any): NextResponse<ErrorResponse> {
  return NextResponse.json({ ok: false, ...body }, { status })
}

function isServerlessEnvironment(): boolean {
  // Check for Vercel environment variables or other serverless indicators
  return !!(
    process.env.VERCEL ||
    process.env.VERCEL_ENV ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.NETLIFY ||
    process.env.CF_PAGES
  )
}

export async function POST(req: Request): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  try {
    const auth = await requireAuth(req as any)

    const body = (await req.json()) as Payload

    if (!body?.fileUrl || typeof body.fileUrl !== "string") {
      return bad(400, { error: "fileUrl is required" })
    }

    if (
      body.fileUrl.startsWith("./") ||
      body.fileUrl.startsWith("/") ||
      body.fileUrl.includes("test/data") ||
      body.fileUrl.includes("file://") ||
      body.fileUrl.includes("localhost") ||
      !body.fileUrl.startsWith("http")
    ) {
      return bad(400, { error: "Local file paths are not allowed. Use http(s) URLs only." })
    }

    console.log("[v0] Processing medical PDF with OCR fallback:", {
      userId: auth.userId,
      mode: body.mode || "live",
      hasFileUrl: !!body.fileUrl,
      isServerless: isServerlessEnvironment(),
    })

    if (body.mode === "mock") {
      const mockFindings: TermValueItem[] = [
        {
          term: "Total Cholesterol",
          value: 249,
          units: "mg/dl",
          refRange: "Desirable <200 / 200-239 Borderline / ≥240 High",
          flag: "Concern",
          rawLine: "Cholesterol-Total, Serum 249 mg/dl   Concern",
        },
        {
          term: "Triglycerides",
          value: 273,
          units: "mg/dl",
          refRange: null,
          flag: "High",
          rawLine: "Triglycerides 273 mg/dl High",
        },
        {
          term: "Vitamin D 25-OH",
          value: 11.94,
          units: "ng/ml",
          refRange: "30 - 100",
          flag: "Concern",
          rawLine: "Vitamin D 11.94 ng/ml  Concern",
        },
        {
          term: "Hemoglobin",
          value: 14.6,
          units: "g/dL",
          refRange: null,
          flag: "Everything looks good",
          rawLine: "Hemoglobin Hb 14.6 g/dL  Everything looks good",
        },
      ]

      return NextResponse.json({
        ok: true,
        meta: {
          contentType: "application/pdf",
          size: 1024000,
          status: 200,
          used: "pdf-parse",
          parsedCount: 4,
        },
        patient: {
          name: "Manan",
          bookingId: "9302606388",
          sampleDate: "04/Nov/2023",
        },
        data: {
          findings: mockFindings,
          previewText:
            "Healthians Lab Report - Patient: Manan, Booking ID: 9302606388, Sample Date: 04/Nov/2023. Multiple lab values extracted including cholesterol, triglycerides, vitamin levels, and blood parameters.",
        },
      })
    }

    let fRes: Response
    try {
      fRes = await fetch(body.fileUrl, {
        redirect: "follow",
        cache: "no-store",
      })
    } catch (fetchError) {
      return bad(502, {
        error: "Could not fetch file",
        details: fetchError instanceof Error ? fetchError.message : "Network error",
      })
    }

    if (!fRes.ok) {
      return bad(502, {
        error: "Could not fetch file",
        details: `${fRes.status} ${fRes.statusText}`,
        meta: {
          contentType: fRes.headers.get("content-type"),
          status: fRes.status,
          size: 0,
          used: "pdf-parse",
          parsedCount: 0,
        },
      })
    }

    const contentType = fRes.headers.get("content-type") || ""
    const arrayBuffer = await fRes.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const bytes = buffer.length

    if (bytes < 5) {
      return bad(400, {
        error: "File too small to be a valid PDF",
        meta: { contentType, status: fRes.status, size: bytes, used: "pdf-parse", parsedCount: 0 },
      })
    }

    const pdfHeader = buffer.subarray(0, 5).toString("ascii")
    if (pdfHeader !== "%PDF-") {
      return bad(400, {
        error: "Not a PDF or URL expired",
        details: { expectedHeader: "%PDF-", actualHeader: pdfHeader },
        meta: { contentType, status: fRes.status, size: bytes, used: "pdf-parse", parsedCount: 0 },
      })
    }

    let rawText = ""
    let extractorUsed: "pdf-parse" | "vision-ocr" | "tesseract" = "pdf-parse"
    const enginesSkipped: string[] = []

    // Stage 1: Try pdf-parse first (only in non-serverless environments)
    const skipPdfParse = isServerlessEnvironment()

    if (skipPdfParse) {
      console.log("[v0] Skipping pdf-parse in serverless environment, proceeding directly to OCR")
      enginesSkipped.push("pdf-parse")
    } else {
      try {
        rawText = await readPdfText(buffer)

        console.log("[v0] pdf-parse completed:", {
          textLength: rawText.length,
          hasSignificantText: rawText.trim().length >= 50,
        })

        // If pdf-parse succeeds with sufficient text, we're done
        if (rawText.trim().length >= 50) {
          const patient = extractPatientInfo(rawText)
          const findings = extractMedicalTerms(rawText)

          return NextResponse.json({
            ok: true,
            meta: {
              contentType,
              size: bytes,
              status: fRes.status,
              used: extractorUsed,
              parsedCount: findings.length,
            },
            patient,
            data: {
              findings,
              previewText: rawText.slice(0, 300),
            },
          })
        }
      } catch (pdfError) {
        console.log("[v0] pdf-parse failed, proceeding to OCR fallback:", pdfError)
      }
    }

    // Stage 2: Try Vision OCR directly on PDF buffer
    console.log("[v0] pdf-parse insufficient or skipped, trying Vision OCR")

    if (ENV.GOOGLE_SERVICE_ACCOUNT_JSON && ENV.GOOGLE_PROJECT_ID) {
      try {
        console.log("[v0] Attempting Vision OCR")
        rawText = await ocrWithVision(buffer)

        if (rawText.trim().length >= 50) {
          extractorUsed = "vision-ocr"
          console.log("[v0] Vision OCR successful:", { textLength: rawText.length })

          const patient = extractPatientInfo(rawText)
          const findings = extractMedicalTerms(rawText)

          return NextResponse.json({
            ok: true,
            meta: {
              contentType,
              size: bytes,
              status: fRes.status,
              used: extractorUsed,
              parsedCount: findings.length,
              enginesSkipped,
            },
            patient,
            data: {
              findings,
              previewText: rawText.slice(0, 300),
            },
          })
        }
      } catch (visionError) {
        console.error("[v0] Vision OCR failed:", visionError)
      }
    } else {
      enginesSkipped.push("vision")
      console.log("[v0] Vision OCR skipped - credentials not configured")
    }

    // Stage 3: Try Tesseract as last fallback
    try {
      console.log("[v0] Attempting Tesseract OCR as last fallback")
      rawText = await ocrWithTesseract(buffer)

      if (rawText.trim().length >= 50) {
        extractorUsed = "tesseract"
        console.log("[v0] Tesseract OCR successful:", { textLength: rawText.length })

        const patient = extractPatientInfo(rawText)
        const findings = extractMedicalTerms(rawText)

        return NextResponse.json({
          ok: true,
          meta: {
            contentType,
            size: bytes,
            status: fRes.status,
            used: extractorUsed,
            parsedCount: findings.length,
            enginesSkipped,
          },
          patient,
          data: {
            findings,
            previewText: rawText.slice(0, 300),
          },
        })
      }
    } catch (tesseractError) {
      console.error("[v0] Tesseract OCR failed:", tesseractError)
    }

    // All OCR methods failed
    return bad(500, {
      error: "Both PDF parsing and OCR failed",
      details: { enginesTried: ["vision", "tesseract"] },
      meta: {
        contentType,
        status: fRes.status,
        size: bytes,
        used: "tesseract",
        parsedCount: 0,
        enginesSkipped,
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
