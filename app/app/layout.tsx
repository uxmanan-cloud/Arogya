import type React from "react"
import { getUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Navigation } from "@/components/navigation"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  if (!user) {
    redirect("/auth/signin")
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
