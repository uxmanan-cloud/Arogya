"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FileText, Upload, Calendar, MoreVertical, Eye, Trash2, Download, AlertCircle, Plus } from "lucide-react"
import { getBrowserSupabase } from "@/lib/supabase/browser"
import { formatDistanceToNow } from "date-fns"

interface Report {
  id: string
  file_name: string
  file_size: number
  content_type: string
  status: "uploaded" | "processing" | "completed" | "failed"
  uploaded_at: string
  processed_at: string | null
}

export default function DashboardPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const supabase = getBrowserSupabase()

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase.from("reports").select("*").order("uploaded_at", { ascending: false })

      if (error) {
        setError(error.message)
      } else {
        setReports(data || [])
      }
    } catch (err) {
      setError("Failed to fetch reports")
    } finally {
      setLoading(false)
    }
  }

  const deleteReport = async (id: string) => {
    try {
      const { error } = await supabase.from("reports").delete().eq("id", id)

      if (error) {
        setError(error.message)
      } else {
        setReports(reports.filter((report) => report.id !== id))
      }
    } catch (err) {
      setError("Failed to delete report")
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "processing":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "failed":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="glass-card border-white/20">
              <CardHeader>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-inter-tight)]">My Reports</h1>
          <p className="text-muted-foreground">Manage and view your health report analyses</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/app/upload">
            <Plus className="w-4 h-4" />
            Upload Report
          </Link>
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Reports Grid */}
      {reports.length === 0 ? (
        <Card className="glass-card border-white/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No reports yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Upload your first health report to get started with AI-powered analysis and insights.
            </p>
            <Button asChild className="gap-2">
              <Link href="/app/upload">
                <Upload className="w-4 h-4" />
                Upload Your First Report
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Card key={report.id} className="glass-card border-white/20 hover:border-white/30 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{report.file_name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Calendar className="w-3 h-3" />
                      {formatDistanceToNow(new Date(report.uploaded_at), { addSuffix: true })}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-background border-white/20">
                      <DropdownMenuItem asChild>
                        <Link href={`/app/reports/${report.id}`} className="cursor-pointer">
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="mr-2 h-4 w-4" />
                        Export PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => deleteReport(report.id)}
                        className="text-red-400 focus:text-red-400"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="secondary" className={getStatusColor(report.status)}>
                    {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Size</span>
                  <span>{formatFileSize(report.file_size)}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span className="uppercase text-xs font-mono">{report.content_type?.split("/")[1] || "PDF"}</span>
                </div>

                {report.status === "completed" && (
                  <Button asChild variant="outline" className="w-full mt-4 border-white/20 bg-transparent">
                    <Link href={`/app/reports/${report.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Analysis
                    </Link>
                  </Button>
                )}

                {report.status === "failed" && (
                  <Button variant="outline" className="w-full mt-4 border-red-500/30 text-red-400 bg-transparent">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Processing Failed
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
