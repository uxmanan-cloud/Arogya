import { NextResponse } from "next/server"
import { ENV } from "@/lib/safe-env"

// Node runtime
export const runtime = "nodejs"

// Lazy imports for server-only libs
async function readPdfText(buf: ArrayBuffer) {
  const pdfParse = (await import("pdf-parse")).default as any
  const nodeBuf = Buffer.from(buf)
  const res = await pdfParse(nodeBuf)
  return String(res?.text || "")
}

async function ocrPdfWithVision(buffer: Buffer, maxPages = 3): Promise<string> {
  if (!ENV.GOOGLE_SERVICE_ACCOUNT_JSON || !ENV.GOOGLE_PROJECT_ID) {
    throw new Error("Google Cloud Vision credentials not configured")
  }

  try {
    // Import required modules
    const pdfjs = await import("pdfjs-dist")
    const { createCanvas } = await import("@napi-rs/canvas")
    const { ImageAnnotatorClient } = await import("@google-cloud/vision")

    // Parse service account JSON
    const credentials = JSON.parse(ENV.GOOGLE_SERVICE_ACCOUNT_JSON)
    const client = new ImageAnnotatorClient({
      credentials,
      projectId: ENV.GOOGLE_PROJECT_ID,
    })

    // Load PDF
    const loadingTask = pdfjs.getDocument({ data: buffer })
    const pdf = await loadingTask.promise

    const numPages = Math.min(pdf.numPages, maxPages)
    let fullText = ""

    // Process each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const viewport = page.getViewport({ scale: 2.0 }) // High resolution

      // Create canvas
      const canvas = createCanvas(viewport.width, viewport.height)
      const context = canvas.getContext("2d")

      // Render page to canvas
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise

      // Convert to PNG buffer
      const pngBuffer = canvas.toBuffer("image/png")

      // OCR the page
      const [result] = await client.documentTextDetection({
        image: { content: pngBuffer },
      })

      const pageText = result.fullTextAnnotation?.text || ""
      fullText += pageText + "\n"
    }

    return fullText.trim()
  } catch (error) {
    console.error("[v0] Vision OCR error:", error)
    throw error
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
  used: "pdf-parse" | "vision-ocr"
  parsedCount: number
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

export async function POST(req: Request): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  try {
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

    console.log("[v0] Processing Healthians-style medical PDF:", {
      mode: body.mode || "live",
      maxPages: body.pages || 3,
      hasFileUrl: !!body.fileUrl,
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
    let extractorUsed: "pdf-parse" | "vision-ocr" = "pdf-parse"

    try {
      const pdfParse = (await import("pdf-parse")).default as any
      const res = await pdfParse(buffer)
      rawText = String(res?.text || "")

      console.log("[v0] pdf-parse completed:", {
        textLength: rawText.length,
        hasSignificantText: rawText.trim().length >= 50,
      })

      // If pdf-parse returns insufficient text, try Vision OCR
      if (rawText.trim().length < 50) {
        console.log("[v0] pdf-parse returned insufficient text, trying Vision OCR")

        try {
          const ocrText = await ocrPdfWithVision(buffer, body.pages || 3)
          if (ocrText.trim().length >= 50) {
            rawText = ocrText
            extractorUsed = "vision-ocr"
            console.log("[v0] Vision OCR successful:", { textLength: rawText.length })
          }
        } catch (ocrError) {
          console.error("[v0] Vision OCR failed:", ocrError)
          if (rawText.trim().length === 0) {
            return bad(500, {
              error: "OCR returned no text",
              details: "Both pdf-parse and Vision OCR failed to extract text",
              meta: { contentType, status: fRes.status, size: bytes, used: "vision-ocr", parsedCount: 0 },
            })
          }
        }
      }
    } catch (pdfError) {
      console.log("[v0] pdf-parse failed, trying Vision OCR fallback")

      try {
        rawText = await ocrPdfWithVision(buffer, body.pages || 3)
        extractorUsed = "vision-ocr"

        if (rawText.trim().length < 50) {
          return bad(400, {
            error: "OCR returned no text",
            meta: { contentType, status: fRes.status, size: bytes, used: "vision-ocr", parsedCount: 0 },
          })
        }
      } catch (ocrError) {
        return bad(500, {
          error: "Both PDF parsing and OCR failed",
          details: "Unable to extract text from document",
          meta: { contentType, status: fRes.status, size: bytes, used: "vision-ocr", parsedCount: 0 },
        })
      }
    }

    const patient = extractPatientInfo(rawText)
    const findings = extractMedicalTerms(rawText)

    console.log("[v0] Medical extraction completed:", {
      findingsCount: findings.length,
      patientFields: Object.keys(patient).length,
      extractorUsed,
    })

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
  } catch (e: any) {
    console.error("[v0] OCR API error:", e)
    return bad(500, {
      error: "Internal server error",
      details: "Processing failed",
    })
  }
}
