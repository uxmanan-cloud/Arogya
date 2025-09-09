import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileX, Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6 px-4">
        <div className="w-20 h-20 bg-destructive/20 rounded-full flex items-center justify-center mx-auto">
          <FileX className="w-10 h-10 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold font-[family-name:var(--font-inter-tight)]">Report Not Found</h1>
          <p className="text-muted-foreground max-w-md">
            The health report you're looking for doesn't exist or may have been removed.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="gap-2">
            <Link href="/">
              <Home className="w-4 h-4" />
              Go to Home
            </Link>
          </Button>
          <Button variant="outline" asChild className="gap-2 border-white/20 hover:bg-white/10 bg-transparent">
            <Link href="/#upload">Upload New Report</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
