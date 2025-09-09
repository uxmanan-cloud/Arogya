"use client"
import { useState } from "react"

export default function DevExplainPage() {
  const [fileUrl, setFileUrl] = useState("https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf")
  const [language, setLanguage] = useState("en")
  const [veg, setVeg] = useState(true)
  const [region, setRegion] = useState("india")
  const [loading, setLoading] = useState(false)
  const [resp, setResp] = useState<any>(null)
  const [error, setError] = useState<string>("")

  async function handleExplain() {
    setLoading(true)
    setError("")
    setResp(null)
    try {
      const r = await fetch("/api/ocr-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl,
          language,
          prefs: { region, veg },
        }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || "Request failed")
      setResp(j)
    } catch (e: any) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Dev: Explain My Report</h1>

      <label className="block">
        <div className="text-sm font-medium mb-1">fileUrl (PDF/Image)</div>
        <input
          className="w-full border rounded px-3 py-2"
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
          placeholder="https://.../report.pdf"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <div className="text-sm font-medium mb-1">language</div>
          <input
            className="w-full border rounded px-3 py-2"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder="en"
          />
        </label>
        <label className="block">
          <div className="text-sm font-medium mb-1">region</div>
          <input
            className="w-full border rounded px-3 py-2"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="india"
          />
        </label>
      </div>

      <label className="inline-flex items-center gap-2">
        <input type="checkbox" checked={veg} onChange={(e) => setVeg(e.target.checked)} />
        <span>veg preference</span>
      </label>

      <div>
        <button
          onClick={handleExplain}
          disabled={loading}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {loading ? "Explaining..." : "Explain my report"}
        </button>
      </div>

      {error && <div className="text-red-600 text-sm">Error: {error}</div>}

      {resp && (
        <pre className="whitespace-pre-wrap text-sm border rounded p-3 bg-gray-50 overflow-auto">
          {JSON.stringify(resp, null, 2)}
        </pre>
      )}
    </div>
  )
}
