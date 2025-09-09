"use client"

import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const languages = [
  { code: "en", name: "English", native: "English" },
  { code: "hi", name: "Hindi", native: "हिंदी" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", native: "മലയാളം" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
]

interface LanguageSwitcherProps {
  currentLanguage?: string
  onLanguageChange?: (language: string) => void
  variant?: "default" | "compact"
}

export function LanguageSwitcher({
  currentLanguage = "en",
  onLanguageChange,
  variant = "default",
}: LanguageSwitcherProps) {
  const current = languages.find((lang) => lang.code === currentLanguage) || languages[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={variant === "compact" ? "sm" : "default"}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <Globe className="w-4 h-4" />
          {variant === "compact" ? current.code.toUpperCase() : current.native}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-card border-white/10">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => onLanguageChange?.(language.code)}
            className={language.code === currentLanguage ? "bg-primary/20 text-primary" : "hover:bg-white/10"}
          >
            <span className="font-medium">{language.native}</span>
            <span className="text-muted-foreground ml-2">({language.name})</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
