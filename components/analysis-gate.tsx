"use client"
import { useAnalysisStore } from "@/lib/analysis-store"
import type React from "react"

export function AnalysisGate({ children }: { children: React.ReactNode }) {
  const { result } = useAnalysisStore()
  if (!result || result.ok !== true) return null // keep page clean until explained
  return <>{children}</>
}
