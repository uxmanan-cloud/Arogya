"use client"
import { create } from "zustand"

type Prefs = { language: string; region: string; veg: boolean }
type ExplainResult = null | {
  ok: boolean
  kind?: string
  text?: string
  explanation?: any
  requestId?: string
  error?: string
}

type AnalysisState = {
  fileUrl: string | null
  prefs: Prefs
  result: ExplainResult
  loading: boolean
  setFileUrl: (u: string | null) => void
  setPrefs: (p: Partial<Prefs>) => void
  setResult: (r: ExplainResult) => void
  setLoading: (v: boolean) => void
  reset: () => void
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  fileUrl: null,
  prefs: { language: "en", region: "North India", veg: true },
  result: null,
  loading: false,
  setFileUrl: (u) => set({ fileUrl: u, result: null }),
  setPrefs: (p) => set((s) => ({ prefs: { ...s.prefs, ...p } })),
  setResult: (r) => set({ result: r }),
  setLoading: (v) => set({ loading: v }),
  reset: () => set({ fileUrl: null, result: null }),
}))
