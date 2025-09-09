export const LANGS = ["en", "hi", "ta", "te", "bn", "mr", "gu", "kn", "ml", "pa"] as const

export type Language = (typeof LANGS)[number]

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  hi: "हिंदी",
  ta: "தமிழ்",
  te: "తెలుగు",
  bn: "বাংলা",
  mr: "मराठी",
  gu: "ગુજરાતી",
  kn: "ಕನ್ನಡ",
  ml: "മലയാളം",
  pa: "ਪੰਜਾਬੀ",
}

export function isValidLanguage(lang: string): lang is Language {
  return LANGS.includes(lang as Language)
}
