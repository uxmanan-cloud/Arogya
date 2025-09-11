"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft,
  Download,
  RefreshCw,
  FileText,
  Calendar,
  User,
  AlertCircle,
  ExternalLink,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react"
import { getBrowserSupabase } from "@/lib/supabase/browser"
import { formatDistanceToNow } from "date-fns"

interface Report {
  id: string
  user_id: string
  file_url: string
  file_name: string
  file_size: number
  content_type: string
  extracted_text: string | null
  explained_data: any
  status: "uploaded" | "processing" | "completed" | "failed"
  uploaded_at: string
  processed_at: string | null
}

interface Finding {
  term: string
  value: number | string
  units: string | null
  refRange: string | null
  flag: "Concern" | "Everything looks good" | "Borderline" | "High" | "Low" | null
  rawLine: string
}

export default function ReportDetailPage({ params }: { params: { id: string } }) {
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [reprocessing, setReprocessing] = useState(false)
  const router = useRouter()
  const supabase = getBrowserSupabase()

  useEffect(() => {
    fetchReport()
  }, [params.id])

  const fetchReport = async () => {
    try {
      const { data, error } = await supabase.from("reports").select("*").eq("id", params.id).single()

      if (error) {
        if (error.code === "PGRST116") {
          setError("Report not found")
        } else {
          setError(error.message)
        }
      } else {
        setReport(data)
      }
    } catch (err) {
      setError("Failed to fetch report")
    } finally {
      setLoading(false)
    }
  }

  const handleReprocess = async () => {
    if (!report) return

    setReprocessing(true)
    try {
      // Update status to processing
      await supabase.from("reports").update({ status: "processing" }).eq("id", report.id)

      // Call OCR API to reprocess
      const response = await fetch("/api/ocr-explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileUrl: report.file_url,
          language: "en",
          prefs: {
            region: "IN",
            vegetarian: false,
          },
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Reprocessing failed")
      }

      // Update report with new results
      const { error: updateError } = await supabase
        .from("reports")
        .update({
          extracted_text: result.data?.previewText || "",
          explained_data: result.data?.findings || [],
          status: "completed",
          processed_at: new Date().toISOString(),
        })
        .eq("id", report.id)

      if (updateError) {
        throw updateError
      }

      // Refresh the report data
      await fetchReport()
    } catch (error) {
      console.error("Reprocessing error:", error)
      setError(error instanceof Error ? error.message : "Reprocessing failed")

      // Reset status back to completed if it was completed before
      if (report.status === "completed") {
        await supabase.from("reports").update({ status: "completed" }).eq("id", report.id)
      }
    } finally {
      setReprocessing(false)
    }
  }

  const handleExportPdf = async () => {
    if (!report) return

    try {
      const response = await fetch("/api/export-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportId: report.id,
          patientName: "Patient", // Could extract from report data
          findings: report.explained_data || [],
          extractedText: report.extracted_text,
        }),
      })

      const result = await response.json()

      if (result.ok && result.url) {
        window.open(result.url, "_blank")
      } else {
        throw new Error("Failed to generate PDF")
      }
    } catch (error) {
      console.error("Export error:", error)
      setError("Failed to export PDF")
    }
  }

  const getFlagColor = (flag: string | null) => {
    switch (flag) {
      case "Everything looks good":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "Concern":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "Borderline":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "High":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      case "Low":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getFlagIcon = (flag: string | null) => {
    switch (flag) {
      case "Everything looks good":
        return <Activity className="w-4 h-4" />
      case "High":
        return <TrendingUp className="w-4 h-4" />
      case "Low":
        return <TrendingDown className="w-4 h-4" />
      default:
        return <Minus className="w-4 h-4" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/app">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Reports
            </Link>
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Report not found"}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const findings = (report.explained_data as Finding[]) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/app">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Reports
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-[family-name:var(--font-inter-tight)]">Report Analysis</h1>
            <p className="text-muted-foreground">{report.file_name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleReprocess}
            disabled={reprocessing || report.status === "processing"}
            className="border-white/20 bg-transparent"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${reprocessing ? "animate-spin" : ""}`} />
            {reprocessing ? "Reprocessing..." : "Re-analyze"}
          </Button>
          <Button onClick={handleExportPdf} className="gap-2">
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Report Info */}
      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Report Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
            <User className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">File Name</p>
              <p className="font-medium truncate">{report.file_name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
            <Calendar className="w-5 h-5 text-accent flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Uploaded</p>
              <p className="font-medium">{formatDistanceToNow(new Date(report.uploaded_at), { addSuffix: true })}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
            <FileText className="w-5 h-5 text-secondary flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">File Size</p>
              <p className="font-medium">{formatFileSize(report.file_size)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Original File</p>
              <Button asChild variant="link" className="h-auto p-0 font-medium text-primary">
                <a href={report.file_url} target="_blank" rel="noopener noreferrer">
                  View Original <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {report.status === "completed" && findings.length > 0 ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold font-[family-name:var(--font-inter-tight)] mb-2">
              Health Analysis Results
            </h2>
            <p className="text-muted-foreground">
              {findings.length} health metrics extracted and analyzed from your report
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {findings.map((finding, index) => (
              <Card key={index} className="glass-card border-white/20">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{finding.term}</CardTitle>
                    {finding.flag && (
                      <Badge variant="secondary" className={`gap-1 ${getFlagColor(finding.flag)}`}>
                        {getFlagIcon(finding.flag)}
                        {finding.flag}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-2xl font-bold">
                    {finding.value}
                    {finding.units && <span className="text-lg text-muted-foreground ml-1">{finding.units}</span>}
                  </div>

                  {finding.refRange && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Reference: </span>
                      <span>{finding.refRange}</span>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground bg-white/5 p-2 rounded">{finding.rawLine}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : report.status === "processing" ? (
        <Card className="glass-card border-white/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="w-12 h-12 text-primary animate-spin mb-4" />
            <h3 className="text-lg font-semibold mb-2">Processing Report</h3>
            <p className="text-muted-foreground text-center">
              Your report is being analyzed. This may take a few minutes.
            </p>
          </CardContent>
        </Card>
      ) : report.status === "failed" ? (
        <Card className="glass-card border-white/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Processing Failed</h3>
            <p className="text-muted-foreground text-center mb-4">
              There was an error processing your report. Please try re-analyzing it.
            </p>
            <Button onClick={handleReprocess} disabled={reprocessing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${reprocessing ? "animate-spin" : ""}`} />
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-card border-white/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Analysis Available</h3>
            <p className="text-muted-foreground text-center mb-4">
              This report hasn't been analyzed yet. Click the button below to start the analysis.
            </p>
            <Button onClick={handleReprocess} disabled={reprocessing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${reprocessing ? "animate-spin" : ""}`} />
              Analyze Report
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Extracted Text */}
      {report.extracted_text && (
        <Card className="glass-card border-white/20">
          <CardHeader>
            <CardTitle>Extracted Text</CardTitle>
            <CardDescription>Raw text extracted from your report</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-white/5 p-4 rounded-lg max-h-64 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap text-muted-foreground">{report.extracted_text}</pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <Card className="glass-card border-white/10">
        <CardContent className="p-6 text-center space-y-4">
          <h3 className="font-semibold text-accent">Important Notice</h3>
          <div className="text-sm text-muted-foreground space-y-2 max-w-3xl mx-auto">
            <p>
              This AI-generated analysis is for informational purposes only and should not replace professional medical
              advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health
              provider with any questions you may have regarding a medical condition.
            </p>
            <p>
              The recommendations provided are based on general health guidelines and your reported test results.
              Individual health needs may vary, and personalized medical advice should always be obtained from qualified
              healthcare professionals.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
