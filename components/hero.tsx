import { Button } from "@/components/ui/button"
import { IllustrationShell } from "@/components/illustration-shell"
import { FeatureChips } from "@/components/feature-chips"
import { ArrowRight, Sparkles } from "lucide-react"

export function Hero() {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      {/* Background gradient mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(91,140,255,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(56,225,184,0.1),transparent_50%)]" />

      <div className="container mx-auto px-4 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/90 border border-primary text-primary-foreground text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                AI-Powered Health Analysis
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-[family-name:var(--font-inter-tight)] leading-tight">
                Reports → <span className="text-foreground font-bold">Clarity</span> → Action
              </h1>

              <p className="text-lg md:text-xl text-foreground/80 max-w-lg">
                Transform complex medical reports into clear, personalized health insights with AI-powered analysis in
                your preferred language.
              </p>
            </div>

            <FeatureChips />

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 glow-primary">
                Upload report
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 border-white/20 hover:bg-white/10 bg-background/50 text-foreground"
              >
                Try sample
              </Button>
            </div>
          </div>

          {/* Illustration */}
          <div className="relative">
            <IllustrationShell />
          </div>
        </div>
      </div>
    </section>
  )
}
