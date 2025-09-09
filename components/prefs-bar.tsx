"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { LanguageSwitcher } from "@/components/language-switcher"
import { MapPin, Leaf } from "lucide-react"
import { useAnalysisStore } from "@/lib/analysis-store"
import { explainReport } from "@/lib/analysis-actions"

interface PrefsBarProps {
  onLanguageChange?: (language: string) => void
  onRegionChange?: (region: string) => void
  onVegToggle?: (isVeg: boolean) => void
}

export function PrefsBar({ onLanguageChange, onRegionChange, onVegToggle }: PrefsBarProps) {
  const [selectedRegion, setSelectedRegion] = useState("north")
  const [isVegetarian, setIsVegetarian] = useState(false)

  const { fileUrl, prefs, loading, result, setPrefs, setLoading, setResult } = useAnalysisStore()
  const canExplain = !!fileUrl && !loading

  useEffect(() => {
    setSelectedRegion(
      prefs.region === "North India"
        ? "north"
        : prefs.region === "South India"
          ? "south"
          : prefs.region === "East India"
            ? "east"
            : "west",
    )
    setIsVegetarian(prefs.veg)
  }, [prefs])

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region)
    const regionName =
      region === "north"
        ? "North India"
        : region === "south"
          ? "South India"
          : region === "east"
            ? "East India"
            : "West India"
    onRegionChange?.(region)
    setPrefs({ region: regionName })
  }

  const handleVegToggle = (checked: boolean) => {
    setIsVegetarian(checked)
    onVegToggle?.(checked)
    setPrefs({ veg: checked })
  }

  const handleLanguageChange = (language: string) => {
    onLanguageChange?.(language)
    setPrefs({ language })
  }

  async function onExplain() {
    if (!fileUrl) return
    setLoading(true)
    try {
      const { status, json } = await explainReport({
        fileUrl,
        language: prefs.language,
        region: prefs.region,
        veg: prefs.veg,
      })
      if (status >= 200 && status < 300) {
        setResult(json)
      } else {
        setResult({ ok: false, error: json?.error || "Failed to explain" })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface/80 backdrop-blur-md p-4 rounded-xl border border-white/10">
      <div className="flex flex-col md:flex-row gap-4 md:items-center">
        <h3 className="font-medium text-sm text-foreground">Personalize your experience</h3>

        <div className="flex flex-col sm:flex-row gap-4 md:ml-auto">
          {/* Language Switcher */}
          <div className="flex items-center gap-2">
            <Label htmlFor="language" className="text-sm text-foreground/70 whitespace-nowrap">
              Language:
            </Label>
            <LanguageSwitcher
              variant="compact"
              currentLanguage={prefs.language}
              onLanguageChange={handleLanguageChange}
            />
          </div>

          {/* Region Selector */}
          <div className="flex items-center gap-2">
            <Label htmlFor="region" className="text-sm text-foreground/70 whitespace-nowrap">
              Region:
            </Label>
            <Select value={selectedRegion} onValueChange={handleRegionChange}>
              <SelectTrigger className="w-32 bg-background/50 border-white/20 hover:bg-white/10 text-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-background border border-white/20">
                <SelectItem value="north">North India</SelectItem>
                <SelectItem value="south">South India</SelectItem>
                <SelectItem value="east">East India</SelectItem>
                <SelectItem value="west">West India</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Vegetarian Toggle */}
          <div className="flex items-center gap-2">
            <Label htmlFor="vegetarian" className="text-sm text-foreground/70 whitespace-nowrap">
              Vegetarian:
            </Label>
            <div className="flex items-center gap-2">
              <Switch
                id="vegetarian"
                checked={isVegetarian}
                onCheckedChange={handleVegToggle}
                className="data-[state=checked]:bg-status-green"
              />
              <Leaf className={`w-4 h-4 ${isVegetarian ? "text-status-green" : "text-foreground/60"}`} />
            </div>
          </div>

          {/* Mode Indicator */}
          <div className="flex items-center gap-2">
            <button
              onClick={onExplain}
              disabled={!canExplain}
              className="px-4 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? "Explaining..." : "Explain Report"}
            </button>
            {result?.mode && (
              <span className="text-xs text-foreground/60 font-mono">{result.mode === "live" ? "Live" : "Mock"}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
