"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, X, Globe, LogOut, FileText, Upload } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getBrowserSupabase } from "@/lib/supabase/browser"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = getBrowserSupabase()

  useEffect(() => {
    // Get initial session
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

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
            {!user && (
              <>
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
              </>
            )}

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

            {/* Auth Section */}
            {loading ? (
              <div className="w-8 h-8 bg-muted animate-pulse rounded-full" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user.user_metadata?.avatar_url || "/placeholder.svg"}
                        alt={user.user_metadata?.full_name}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.user_metadata?.full_name ? getUserInitials(user.user_metadata.full_name) : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-background border border-white/20" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {user.user_metadata?.full_name && <p className="font-medium">{user.user_metadata.full_name}</p>}
                      <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/app" className="cursor-pointer">
                      <FileText className="mr-2 h-4 w-4" />
                      My Reports
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/app/upload" className="cursor-pointer">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Report
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button asChild variant="ghost" className="text-foreground hover:text-foreground">
                  <Link href="/auth/signin">Sign in</Link>
                </Button>
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <Link href="/auth/signup">Get Started</Link>
                </Button>
              </div>
            )}
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
            {!user && (
              <>
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
              </>
            )}

            {user ? (
              <div className="space-y-2">
                <div className="px-2 py-1">
                  <p className="font-medium">{user.user_metadata?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <Link
                  href="/app"
                  className="block text-foreground/70 hover:text-foreground transition-colors focus-ring rounded-md px-2 py-1"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Reports
                </Link>
                <Link
                  href="/app/upload"
                  className="block text-foreground/70 hover:text-foreground transition-colors focus-ring rounded-md px-2 py-1"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Upload Report
                </Link>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-foreground hover:text-foreground"
                  onClick={handleSignOut}
                >
                  Sign out
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button asChild variant="ghost" className="w-full justify-start text-foreground hover:text-foreground">
                  <Link href="/auth/signin" onClick={() => setIsMenuOpen(false)}>
                    Sign in
                  </Link>
                </Button>
                <Button asChild className="w-full bg-primary hover:bg-primary/90">
                  <Link href="/auth/signup" onClick={() => setIsMenuOpen(false)}>
                    Get Started
                  </Link>
                </Button>
              </div>
            )}

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
          </div>
        )}
      </div>
    </nav>
  )
}
