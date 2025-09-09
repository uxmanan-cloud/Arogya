"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Share2, Copy, Check, LinkIcon } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/hooks/use-toast"

interface ShareButtonProps {
  reportId: string
  title?: string
}

export function ShareButton({ reportId, title = "Health Report Analysis" }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/report/${reportId}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast({
        title: "Link copied!",
        description: "The report link has been copied to your clipboard.",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      })
    }
  }

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: "Check out my health report analysis",
          url: shareUrl,
        })
      } catch (err) {
        // User cancelled sharing or error occurred
        console.log("Share cancelled or failed")
      }
    } else {
      // Fallback to copy
      copyToClipboard()
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 border-white/20 hover:bg-white/10 bg-transparent">
          <Share2 className="w-4 h-4" />
          Share Report
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-card border-white/10">
        <DropdownMenuItem onClick={copyToClipboard} className="gap-2 hover:bg-white/10">
          {copied ? <Check className="w-4 h-4 text-status-green" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied!" : "Copy Link"}
        </DropdownMenuItem>

        {typeof window !== "undefined" && navigator.share && (
          <DropdownMenuItem onClick={shareNative} className="gap-2 hover:bg-white/10">
            <Share2 className="w-4 h-4" />
            Share via...
          </DropdownMenuItem>
        )}

        <DropdownMenuItem asChild className="gap-2 hover:bg-white/10">
          <a
            href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(
              `Check out my health report analysis: ${shareUrl}`,
            )}`}
          >
            <LinkIcon className="w-4 h-4" />
            Share via Email
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
