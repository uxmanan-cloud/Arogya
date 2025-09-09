"use client"

import { Button } from "@/components/ui/button"
import { FileText, Upload } from "lucide-react"

interface ActionBarProps {
  onExplainReport?: () => void
  onSeeSample?: () => void
  isReportUploaded?: boolean
}

export function ActionBar({ onExplainReport, onSeeSample, isReportUploaded = false }: ActionBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
      <div className="bg-background/95 backdrop-blur-md border-t border-white/10 p-4 pb-safe">
        <div className="flex gap-3" role="group" aria-label="Report actions">
          <Button
            onClick={onExplainReport}
            disabled={!isReportUploaded}
            className="flex-1 gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed focus-ring touch-target"
            aria-describedby={!isReportUploaded ? "explain-disabled-reason" : undefined}
          >
            <FileText className="w-4 h-4" aria-hidden="true" />
            Explain my report
          </Button>
          {!isReportUploaded && (
            <span id="explain-disabled-reason" className="sr-only">
              Upload a report first to enable explanation
            </span>
          )}
          <Button
            onClick={onSeeSample}
            variant="outline"
            className="gap-2 border-white/20 hover:bg-white/10 bg-background/50 text-foreground focus-ring touch-target"
          >
            <Upload className="w-4 h-4" aria-hidden="true" />
            See sample
          </Button>
        </div>
      </div>
    </div>
  )
}
