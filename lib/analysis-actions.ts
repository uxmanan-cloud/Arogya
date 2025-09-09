"use client"

export async function explainReport(params: { fileUrl: string; language: string; region: string; veg: boolean }) {
  const res = await fetch("/api/ocr-explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileUrl: params.fileUrl,
      language: params.language,
      prefs: { region: params.region, veg: params.veg },
    }),
  })
  const json = await res.json().catch(() => ({}))
  return { status: res.status, json }
}
