import { Hero } from "@/components/hero"
import { Navigation } from "@/components/navigation"
import { UploadZone } from "@/components/upload-zone"
import { PrefsBar } from "@/components/prefs-bar"
import { ActionBar } from "@/components/action-bar"
import { ResultCards } from "@/components/result-cards"
import { MealPlanCard } from "@/components/meal-plan-card"
import { WorkoutCard } from "@/components/workout-card"
import { TrustStrip } from "@/components/trust-strip"
import { AnalysisGate } from "@/components/analysis-gate"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main id="main-content" className="pb-20 md:pb-8">
        <Hero />

        <div className="container mx-auto px-4 space-y-8 max-w-7xl">
          <section aria-labelledby="upload-heading">
            <h2 id="upload-heading" className="sr-only">
              Upload Your Health Reports
            </h2>
            <UploadZone />
          </section>

          <section aria-labelledby="preferences-heading">
            <h2 id="preferences-heading" className="sr-only">
              Personalization Preferences
            </h2>
            <PrefsBar />
          </section>

          <AnalysisGate>
            <section aria-labelledby="results-heading" className="space-y-6">
              <h2
                id="results-heading"
                className="text-2xl font-bold text-center font-[family-name:var(--font-inter-tight)]"
              >
                Your Health Analysis
              </h2>
              <ResultCards />

              <div className="grid gap-6 md:grid-cols-2 lg:max-w-none">
                <MealPlanCard />
                <WorkoutCard />
              </div>
            </section>

            {/* PDF/Share Row */}
            <section aria-labelledby="actions-heading" className="flex gap-4 justify-center flex-wrap">
              <h2 id="actions-heading" className="sr-only">
                Report Actions
              </h2>
              <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium focus-ring touch-target hover:bg-primary/90 transition-colors">
                Download PDF
              </button>
              <button
                className="px-6 py-3 bg-muted/20 text-muted-foreground rounded-lg font-medium opacity-50 cursor-not-allowed touch-target"
                disabled
                aria-describedby="share-disabled-reason"
              >
                Save & Share
              </button>
              <span id="share-disabled-reason" className="sr-only">
                Share feature will be available after uploading a report
              </span>
            </section>
          </AnalysisGate>

          <TrustStrip />
        </div>
      </main>

      <ActionBar />
    </div>
  )
}
