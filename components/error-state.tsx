"use client"

import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorStateProps {
  title?: string
  description?: string
  actions?: {
    primary?: {
      label: string
      onClick: () => void
    }
    secondary?: {
      label: string
      onClick: () => void
    }
  }
}

export function ErrorState({
  title = "Something went wrong",
  description = "We encountered an error while processing your request. Please try again or contact support if the problem persists.",
  actions,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mb-6">{description}</p>

      {actions && (
        <div className="flex flex-col sm:flex-row gap-3">
          {actions.primary && (
            <Button onClick={actions.primary.onClick} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              {actions.primary.label}
            </Button>
          )}
          {actions.secondary && (
            <Button
              onClick={actions.secondary.onClick}
              variant="outline"
              className="gap-2 border-white/20 hover:bg-white/10 bg-transparent"
            >
              <Home className="w-4 h-4" />
              {actions.secondary.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
