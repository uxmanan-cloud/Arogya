import { Calendar, User, FileText, Globe, Lock, Unlock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ReportHeaderProps {
  patientName: string
  reportDate: string
  reportType: string
  generatedAt: string
  isPublic?: boolean
  language?: string
}

export function ReportHeader({
  patientName,
  reportDate,
  reportType,
  generatedAt,
  isPublic = false,
  language = "en",
}: ReportHeaderProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="bg-gradient-to-r from-primary/10 via-transparent to-accent/10 border-b border-white/10">
      <div className="container mx-auto px-4 py-8">
        <div className="glass-card p-6 rounded-xl border border-white/10 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-inter-tight)]">
                Health Report Analysis
              </h1>
              <p className="text-muted-foreground">AI-powered insights and recommendations</p>
            </div>

            <div className="flex items-center gap-2">
              {isPublic ? (
                <Badge
                  variant="secondary"
                  className="gap-1 bg-status-green/20 text-status-green border-status-green/30"
                >
                  <Unlock className="w-3 h-3" />
                  Public
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1 bg-muted/20 text-muted-foreground border-white/20">
                  <Lock className="w-3 h-3" />
                  Private
                </Badge>
              )}
            </div>
          </div>

          {/* Report Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
              <User className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Patient</p>
                <p className="font-medium truncate">{patientName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
              <Calendar className="w-5 h-5 text-accent flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Report Date</p>
                <p className="font-medium">{formatDate(reportDate)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
              <FileText className="w-5 h-5 text-secondary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Report Type</p>
                <p className="font-medium text-sm">{reportType}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
              <Globe className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Generated</p>
                <p className="font-medium text-sm">{formatDateTime(generatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
