"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, Globe } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav
      className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-white/10"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 focus-ring rounded-md">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm" aria-hidden="true">
                A
              </span>
            </div>
            <span className="font-bold text-xl font-[family-name:var(--font-inter-tight)] text-foreground">Arogya</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="#about"
              className="text-foreground/70 hover:text-foreground transition-colors focus-ring rounded-md px-2 py-1"
            >
              About
            </Link>
            <Link
              href="#how-it-works"
              className="text-foreground/70 hover:text-foreground transition-colors focus-ring rounded-md px-2 py-1"
            >
              How it works
            </Link>

            {/* Language Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 focus-ring touch-target text-foreground hover:text-foreground"
                  aria-label="Select language"
                >
                  <Globe className="w-4 h-4" aria-hidden="true" />
                  English
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background border border-white/20">
                <DropdownMenuItem>English</DropdownMenuItem>
                <DropdownMenuItem>हिंदी (Hindi)</DropdownMenuItem>
                <DropdownMenuItem>தமிழ் (Tamil)</DropdownMenuItem>
                <DropdownMenuItem>తెలుగు (Telugu)</DropdownMenuItem>
                <DropdownMenuItem>বাংলা (Bengali)</DropdownMenuItem>
                <DropdownMenuItem>मराठी (Marathi)</DropdownMenuItem>
                <DropdownMenuItem>ગુજરાતી (Gujarati)</DropdownMenuItem>
                <DropdownMenuItem>ಕನ್ನಡ (Kannada)</DropdownMenuItem>
                <DropdownMenuItem>മലയാളം (Malayalam)</DropdownMenuItem>
                <DropdownMenuItem>ਪੰਜਾਬੀ (Punjabi)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              className="border-white/20 hover:bg-white/10 bg-background/50 text-foreground focus-ring touch-target"
            >
              Sign in
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden focus-ring touch-target text-foreground hover:text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div id="mobile-menu" className="md:hidden py-4 space-y-4 border-t border-white/10 bg-background/95">
            <Link
              href="#about"
              className="block text-foreground/70 hover:text-foreground transition-colors focus-ring rounded-md px-2 py-1"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="#how-it-works"
              className="block text-foreground/70 hover:text-foreground transition-colors focus-ring rounded-md px-2 py-1"
              onClick={() => setIsMenuOpen(false)}
            >
              How it works
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 w-full justify-start focus-ring touch-target text-foreground hover:text-foreground"
                >
                  <Globe className="w-4 h-4" aria-hidden="true" />
                  Language
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-background border border-white/20">
                <DropdownMenuItem>English</DropdownMenuItem>
                <DropdownMenuItem>हिंदी (Hindi)</DropdownMenuItem>
                <DropdownMenuItem>தமிழ் (Tamil)</DropdownMenuItem>
                <DropdownMenuItem>తెలుగు (Telugu)</DropdownMenuItem>
                <DropdownMenuItem>বাংলা (Bengali)</DropdownMenuItem>
                <DropdownMenuItem>मराठी (Marathi)</DropdownMenuItem>
                <DropdownMenuItem>ગુજરાતી (Gujarati)</DropdownMenuItem>
                <DropdownMenuItem>ಕನ್ನಡ (Kannada)</DropdownMenuItem>
                <DropdownMenuItem>മലയാളം (Malayalam)</DropdownMenuItem>
                <DropdownMenuItem>ਪੰਜਾਬੀ (Punjabi)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              className="border-white/20 hover:bg-white/10 w-full bg-background/50 text-foreground focus-ring touch-target"
            >
              Sign in
            </Button>
          </div>
        )}
      </div>
    </nav>
  )
}
