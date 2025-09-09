import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const interTight = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter-tight",
})

export const metadata: Metadata = {
  title: "Arogya - AI Health Reports",
  description: "Transform your health reports into clear, actionable insights with AI-powered analysis",
  generator: "v0.app",
  keywords: ["health reports", "AI analysis", "medical insights", "health recommendations", "HIPAA compliant"],
  authors: [{ name: "Arogya Health AI" }],
  creator: "Arogya Health AI",
  publisher: "Arogya Health AI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Arogya - AI Health Reports",
    description: "Transform your health reports into clear, actionable insights with AI-powered analysis",
    type: "website",
    locale: "en_US",
    siteName: "Arogya",
  },
  twitter: {
    card: "summary_large_image",
    title: "Arogya - AI Health Reports",
    description: "Transform your health reports into clear, actionable insights with AI-powered analysis",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0B1220" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1220" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${interTight.variable}`}>
      <body className="font-sans antialiased">
        <a href="#main-content" className="skip-link focus-ring">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  )
}
