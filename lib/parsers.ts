export type LabItem = { name: string; value: number; unit?: string }

const aliases: Record<string, string> = {
  ldl: "LDL Cholesterol",
  "ldl-c": "LDL Cholesterol",
  hdl: "HDL Cholesterol",
  hba1c: "HbA1c",
  hemoglobin: "Hemoglobin",
  "25-oh vitamin d": "25-OH Vitamin D",
  "vitamin d": "25-OH Vitamin D",
  creatinine: "Creatinine",
  bp: "Blood Pressure",
}

export function normalizeName(raw: string): string {
  const key = raw.trim().toLowerCase().replace(/\s+/g, " ")
  return aliases[key] ?? raw
}

export function parseLabs(text: string): LabItem[] {
  const lines = text.split(/\r?\n/)
  const out: LabItem[] = []
  for (const line of lines) {
    const m = line.match(/^\s*([A-Za-z0-9\- %/]+?)\s*[:-]?\s*([\d.]+)\s*([A-Za-z%/]+)?\s*$/)
    if (m) {
      const name = normalizeName(m[1])
      const value = Number(m[2])
      const unit = m[3]
      if (!Number.isNaN(value)) out.push({ name, value, unit })
    }
  }
  return out
}

export function parseEcgFlags(text: string): string[] {
  const flags: string[] = []
  const lowered = text.toLowerCase()
  if (/\b(st\s*elevation|stemi)\b/.test(lowered)) flags.push("ST-elevation")
  if (/\barrhythmia\b/.test(lowered)) flags.push("Arrhythmia")
  if (/\btachycardia\b/.test(lowered)) flags.push("Tachycardia")
  return flags
}
