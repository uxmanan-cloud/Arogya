// Debug endpoint – masks secrets; safe to deploy
import { NextResponse } from "next/server"
import { ENV } from "@/lib/safe-env"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

export async function GET() {
  try {
    const mode = process.env.NEXT_PUBLIC_MOCK_MODE === "true" ? "mock" : "live"

    const env = {
      has_NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      has_NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      has_SUPABASE_SERVICE_ROLE: !!ENV.SUPABASE_SERVICE_ROLE_KEY,
      has_SUPABASE_BUCKET: !!ENV.SUPABASE_BUCKET,
    }

    const buildInfo = {
      nodeVersion: process.version,
      runtime: "nodejs" as const,
      commit: process.env.VERCEL_GIT_COMMIT_SHA,
    }

    let storageCheck: any = undefined

    if (env.has_NEXT_PUBLIC_SUPABASE_URL && env.has_SUPABASE_BUCKET) {
      const testKey = "debug-sample.pdf"
      const bucket = ENV.SUPABASE_BUCKET

      try {
        // Create Supabase client for storage operations
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          ENV.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        )

        // First try public URL strategy
        const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(testKey)

        if (publicUrlData?.publicUrl) {
          try {
            const headResponse = await fetch(publicUrlData.publicUrl, {
              method: "HEAD",
              signal: AbortSignal.timeout(5000),
            })

            storageCheck = {
              bucket,
              strategy: "public" as const,
              testKey,
              publicUrl: publicUrlData.publicUrl,
              signedUrlHeadOk: headResponse.ok,
              headStatus: headResponse.status,
            }
          } catch (headError) {
            // If public HEAD fails, try signed URL strategy
            if (env.has_SUPABASE_SERVICE_ROLE) {
              const { data: signedUrlData, error: signError } = await supabase.storage
                .from(bucket)
                .createSignedUrl(testKey, 60)

              if (signedUrlData?.signedUrl && !signError) {
                try {
                  const signedHeadResponse = await fetch(signedUrlData.signedUrl, {
                    method: "HEAD",
                    signal: AbortSignal.timeout(5000),
                  })

                  storageCheck = {
                    bucket,
                    strategy: "signed" as const,
                    testKey,
                    signedUrlHeadOk: signedHeadResponse.ok,
                    headStatus: signedHeadResponse.status,
                  }
                } catch (signedHeadError) {
                  storageCheck = {
                    bucket,
                    strategy: "signed" as const,
                    testKey,
                    signedUrlHeadOk: false,
                    headStatus: 0,
                  }
                }
              }
            }
          }
        }
      } catch (storageError) {
        storageCheck = {
          bucket,
          strategy: "unknown" as const,
          testKey,
          signedUrlHeadOk: false,
          headStatus: 0,
        }
      }
    }

    return NextResponse.json(
      {
        ok: true,
        mode,
        env,
        ...(storageCheck && { storageCheck }),
        buildInfo,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    )
  } catch (error) {
    console.error("[v0] Debug route error:", error)
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    )
  }
}
