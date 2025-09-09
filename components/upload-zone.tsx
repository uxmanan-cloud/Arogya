"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Upload, FileText, ImageIcon, X, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAnalysisStore } from "@/lib/analysis-store"
import { ENV } from "@/lib/safe-env"

interface UploadZoneProps {
  onFileUpload?: (files: File[]) => void
  maxFiles?: number
  acceptedTypes?: string[]
}

function generateStoragePath(originalName: string): string {
  const ext = originalName.split(".").pop()?.toLowerCase() || "pdf"
  return `uploads/${Date.now()}-${originalName}`
}

export function UploadZone({
  onFileUpload,
  maxFiles = 5,
  acceptedTypes = [".pdf", ".jpg", ".jpeg", ".png"],
}: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const setFileUrl = useAnalysisStore((state) => state.setFileUrl)

  const supabaseConfigured = !!(ENV.NEXT_PUBLIC_SUPABASE_URL && ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFiles(files)
  }, [])

  const handleFiles = useCallback(
    async (files: File[]) => {
      const validFiles = files
        .filter((file) => {
          const extension = `.${file.name.split(".").pop()?.toLowerCase()}`
          return acceptedTypes.includes(extension)
        })
        .slice(0, maxFiles)

      if (validFiles.length > 0) {
        setIsUploading(true)

        try {
          const file = validFiles[0] // Upload first file

          if (ENV.NEXT_PUBLIC_MOCK_MODE === "true" || !supabaseConfigured) {
            console.log("[v0] Using mock upload (mock mode or missing Supabase config)")
            const mockUrl = `https://example.com/mock-uploads/${file.name}`
            setFileUrl(mockUrl)
            setUploadedFiles((prev) => [...prev, ...validFiles].slice(0, maxFiles))
            onFileUpload?.(validFiles)
            return
          }

          console.log("[v0] Starting signed upload flow for:", file.name)

          const path = generateStoragePath(file.name)
          console.log("[v0] Generated storage path:", path)

          const uploadResponse = await fetch("/api/create-signed-upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path }),
          })

          if (!uploadResponse.ok) {
            const uploadError = await uploadResponse.json()
            throw new Error(uploadError.error || "Failed to get signed upload URL")
          }

          const { signedUrl, token } = await uploadResponse.json()
          console.log("[v0] Got signed upload URL")

          const fileUploadResponse = await fetch(signedUrl, {
            method: "PUT",
            body: file,
            headers: {
              "Content-Type": file.type,
              ...(token && { "x-upsert": "true" }),
            },
          })

          if (!fileUploadResponse.ok) {
            throw new Error(`Upload failed with status: ${fileUploadResponse.status}`)
          }

          console.log("[v0] File uploaded successfully to storage")

          const signResponse = await fetch("/api/sign-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              key: path,
              expiresInSeconds: 600, // 10 minutes
            }),
          })

          if (!signResponse.ok) {
            const signError = await signResponse.json()
            throw new Error(signError.error || "Failed to get signed read URL")
          }

          const { signedUrl: readUrl } = await signResponse.json()
          console.log("[v0] Got signed read URL")

          setFileUrl(readUrl)
          setUploadedFiles((prev) => [...prev, ...validFiles].slice(0, maxFiles))
          onFileUpload?.(validFiles)
        } catch (error) {
          console.error("[v0] Upload error:", error)
          alert(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`)
        } finally {
          setIsUploading(false)
        }
      }
    },
    [acceptedTypes, maxFiles, onFileUpload, setFileUrl, supabaseConfigured],
  )

  const removeFile = useCallback(
    (index: number) => {
      setUploadedFiles((prev) => {
        const newFiles = prev.filter((_, i) => i !== index)
        if (newFiles.length === 0) {
          setFileUrl(null)
        }
        return newFiles
      })
    },
    [setFileUrl],
  )

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase()
    return extension === "pdf" ? FileText : ImageIcon
  }

  return (
    <div className="space-y-4">
      {!supabaseConfigured && (
        <div className="bg-amber-900/40 border border-amber-700/50 rounded-lg p-3">
          <p className="text-amber-100 text-sm">
            <strong className="text-amber-50">Mock Mode:</strong> Supabase not configured. Add NEXT_PUBLIC_SUPABASE_URL
            and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable real uploads.
          </p>
        </div>
      )}

      <div
        className={cn(
          "relative bg-surface/80 backdrop-blur-md border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 scan-line",
          isDragOver ? "border-primary bg-primary/5 glow-primary" : "border-white/20 hover:border-white/30",
          isUploading && "border-accent bg-accent/5",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        aria-label="Upload health reports by dragging and dropping or clicking to browse"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            document.getElementById("file-input")?.click()
          }
        }}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
          aria-describedby="upload-description"
        />

        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            {isUploading ? (
              <div
                className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"
                role="status"
                aria-label="Uploading files"
              />
            ) : (
              <Upload className="w-8 h-8 text-primary" aria-hidden="true" />
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              {isUploading ? "Processing your reports..." : "Upload your health reports"}
            </h3>
            <p id="upload-description" className="text-foreground/70">
              Drag and drop your files here, or click to browse
            </p>
            <p className="text-sm text-foreground/60">Supports PDF, JPG, JPEG, PNG • Max {maxFiles} files</p>
          </div>

          {!isUploading && (
            <Button
              variant="outline"
              className="border-white/20 hover:bg-white/10 bg-background/50 text-foreground focus-ring touch-target"
            >
              Choose files
            </Button>
          )}
        </div>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-foreground">Uploaded files ({uploadedFiles.length})</h4>
          <div className="space-y-2" role="list" aria-label="Uploaded files">
            {uploadedFiles.map((file, index) => {
              const Icon = getFileIcon(file.name)
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-surface/60 backdrop-blur-md rounded-lg border border-white/10"
                  role="listitem"
                >
                  <Icon className="w-5 h-5 text-accent flex-shrink-0" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">{file.name}</p>
                    <p className="text-xs text-foreground/60">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-status-green flex-shrink-0" aria-label="Upload successful" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-foreground/60 hover:text-foreground p-1 focus-ring touch-target"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
