"use client"

import { FileX, Upload, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  type?: "upload" | "results" | "error"
}

export function EmptyState({
  title = "No reports uploaded yet",
  description = "Upload your health reports to get personalized AI-powered insights and recommendations.",
  action,
  type = "upload",
}: EmptyStateProps) {
  const getIcon = () => {
    switch (type) {
      case "upload":
        return Upload
      case "results":
        return Sparkles
      case "error":
        return FileX
      default:
        return Upload
    }
  }

  const Icon = getIcon()

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mb-6">{description}</p>
      {action && (
        <Button onClick={action.onClick} className="gap-2">
          <Upload className="w-4 h-4" />
          {action.label}
        </Button>
      )}
    </div>
  )
}
