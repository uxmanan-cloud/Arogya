import { notFound } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { ResultCards } from "@/components/result-cards"
import { MealPlanCard } from "@/components/meal-plan-card"
import { WorkoutCard } from "@/components/workout-card"
import { TrustStrip } from "@/components/trust-strip"
import { ReportHeader } from "@/components/report-header"
import { ShareButton } from "@/components/share-button"
import { Button } from "@/components/ui/button"
import { Download, ArrowLeft } from "lucide-react"
import Link from "next/link"

// Mock data - in real app this would come from API/database
const mockReportData = {
  "sample-123": {
    id: "sample-123",
    patientName: "John Doe",
    reportDate: "2024-01-15",
    reportType: "Comprehensive Health Panel",
    generatedAt: "2024-01-16T10:30:00Z",
    language: "en",
    isPublic: true,
  },
}

interface ReportPageProps {
  params: {
    id: string
  }
}

export default function ReportPage({ params }: ReportPageProps) {
  const reportData = mockReportData[params.id as keyof typeof mockReportData]

  if (!reportData) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pb-8">
        {/* Back Navigation */}
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        {/* Report Header */}
        <ReportHeader
          patientName={reportData.patientName}
          reportDate={reportData.reportDate}
          reportType={reportData.reportType}
          generatedAt={reportData.generatedAt}
          isPublic={reportData.isPublic}
        />

        <div className="container mx-auto px-4 space-y-8">
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="gap-2 bg-primary hover:bg-primary/90">
              <Download className="w-4 h-4" />
              Download PDF Report
            </Button>
            <ShareButton reportId={params.id} />
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold font-[family-name:var(--font-inter-tight)] mb-2">
                Health Analysis Results
              </h2>
              <p className="text-muted-foreground">
                AI-powered insights from your health report, analyzed on{" "}
                {new Date(reportData.generatedAt).toLocaleDateString()}
              </p>
            </div>

            <ResultCards />

            <div className="grid gap-6 md:grid-cols-2">
              <MealPlanCard />
              <WorkoutCard />
            </div>
          </div>

          <TrustStrip />

          {/* Report Disclaimer */}
          <div className="glass-card p-6 rounded-xl border border-white/10 text-center space-y-4">
            <h3 className="font-semibold text-accent">Important Notice</h3>
            <div className="text-sm text-muted-foreground space-y-2 max-w-3xl mx-auto">
              <p>
                This AI-generated analysis is for informational purposes only and should not replace professional
                medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified
                health provider with any questions you may have regarding a medical condition.
              </p>
              <p>
                The recommendations provided are based on general health guidelines and your reported test results.
                Individual health needs may vary, and personalized medical advice should always be obtained from
                qualified healthcare professionals.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
