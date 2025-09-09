import type React from "react"
import type { Metadata } from "next"

interface ReportLayoutProps {
  children: React.ReactNode
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  // In a real app, you'd fetch the report data here
  const reportId = params.id

  return {
    title: `Health Report Analysis - ${reportId} | Arogya`,
    description: "AI-powered health report analysis with personalized insights and recommendations",
    openGraph: {
      title: "Health Report Analysis - Arogya",
      description: "AI-powered health report analysis with personalized insights and recommendations",
      type: "website",
    },
    robots: {
      index: false, // Don't index individual reports for privacy
      follow: false,
    },
  }
}

export default function ReportLayout({ children }: ReportLayoutProps) {
  return <>{children}</>
}
