"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { getBrowserSupabase } from "@/lib/supabase/browser"

interface UploadState {
  status: "idle" | "uploading" | "processing" | "completed" | "error"
  progress: number
  message: string
  reportId?: string
}

export default function UploadPage() {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: "idle",
    progress: 0,
    message: "",
  })
  const [dragActive, setDragActive] = useState(false)
  const router = useRouter()
  const supabase = getBrowserSupabase()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file: File) => {
    if (!file.type.includes("pdf") && !file.type.includes("image")) {
      setUploadState({
        status: "error",
        progress: 0,
        message: "Please upload a PDF or image file",
      })
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      setUploadState({
        status: "error",
        progress: 0,
        message: "File size must be less than 20MB",
      })
      return
    }

    try {
      setUploadState({
        status: "uploading",
        progress: 10,
        message: "Preparing upload...",
      })

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Not authenticated")
      }

      // Generate unique filename
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `reports/${user.id}/${fileName}`

      setUploadState({
        status: "uploading",
        progress: 30,
        message: "Uploading file...",
      })

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage.from("reports").upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      setUploadState({
        status: "uploading",
        progress: 60,
        message: "Saving report details...",
      })

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("reports").getPublicUrl(filePath)

      // Save report to database
      const { data: reportData, error: dbError } = await supabase
        .from("reports")
        .insert({
          user_id: user.id,
          file_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          content_type: file.type,
          status: "uploaded",
        })
        .select()
        .single()

      if (dbError) {
        throw dbError
      }

      setUploadState({
        status: "processing",
        progress: 80,
        message: "Processing report...",
      })

      // Call OCR API
      const response = await fetch("/api/ocr-explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileUrl: publicUrl,
          language: "en",
          prefs: {
            region: "IN",
            vegetarian: false,
          },
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Processing failed")
      }

      // Update report with results
      await supabase
        .from("reports")
        .update({
          extracted_text: result.extractedText || "",
          explained_data: result.findings || [],
          status: "completed",
          processed_at: new Date().toISOString(),
        })
        .eq("id", reportData.id)

      setUploadState({
        status: "completed",
        progress: 100,
        message: "Report processed successfully!",
        reportId: reportData.id,
      })
    } catch (error) {
      console.error("Upload error:", error)
      setUploadState({
        status: "error",
        progress: 0,
        message: error instanceof Error ? error.message : "Upload failed",
      })
    }
  }

  const resetUpload = () => {
    setUploadState({
      status: "idle",
      progress: 0,
      message: "",
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/app">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reports
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-inter-tight)]">Upload Report</h1>
          <p className="text-muted-foreground">Upload a health report for AI-powered analysis</p>
        </div>
      </div>

      {/* Upload Card */}
      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle>Select Your Report</CardTitle>
          <CardDescription>
            Upload a PDF or image file of your health report. Maximum file size is 20MB.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {uploadState.status === "idle" && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? "border-primary bg-primary/5" : "border-white/20 hover:border-white/30 hover:bg-white/5"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Drop your file here</h3>
              <p className="text-muted-foreground mb-4">or click to browse</p>
              <input type="file" accept=".pdf,image/*" onChange={handleFileInput} className="hidden" id="file-upload" />
              <Button asChild variant="outline" className="border-white/20 bg-transparent">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <FileText className="w-4 h-4 mr-2" />
                  Choose File
                </label>
              </Button>
            </div>
          )}

          {(uploadState.status === "uploading" || uploadState.status === "processing") && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="font-medium">{uploadState.message}</span>
              </div>
              <Progress value={uploadState.progress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                Please don't close this page while your report is being processed.
              </p>
            </div>
          )}

          {uploadState.status === "completed" && (
            <div className="text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-2">Upload Successful!</h3>
                <p className="text-muted-foreground">{uploadState.message}</p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button asChild>
                  <Link href={`/app/reports/${uploadState.reportId}`}>View Analysis</Link>
                </Button>
                <Button variant="outline" onClick={resetUpload} className="border-white/20 bg-transparent">
                  Upload Another
                </Button>
              </div>
            </div>
          )}

          {uploadState.status === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{uploadState.message}</span>
                <Button variant="outline" size="sm" onClick={resetUpload} className="ml-4 bg-transparent">
                  Try Again
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="text-lg">What happens next?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold mt-0.5">
              1
            </div>
            <div>
              <p className="font-medium">File Upload</p>
              <p className="text-sm text-muted-foreground">Your report is securely uploaded to our servers</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold mt-0.5">
              2
            </div>
            <div>
              <p className="font-medium">AI Analysis</p>
              <p className="text-sm text-muted-foreground">
                Our AI extracts and analyzes key health metrics from your report
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold mt-0.5">
              3
            </div>
            <div>
              <p className="font-medium">Insights & Recommendations</p>
              <p className="text-sm text-muted-foreground">
                Get personalized insights and actionable health recommendations
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
