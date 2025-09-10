import { createClient } from "@supabase/supabase-js"
import { ENV } from "./safe-env"

let supabaseClient: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (!ENV.NEXT_PUBLIC_SUPABASE_URL || !ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null
  }

  if (!supabaseClient) {
    supabaseClient = createClient(ENV.NEXT_PUBLIC_SUPABASE_URL, ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  }

  return supabaseClient
}

export interface UploadResult {
  key: string
  url: string
  error?: string
}

export async function uploadFile(file: File, userId?: string): Promise<UploadResult> {
  try {
    const supabase = getSupabaseClient()

    if (!supabase) {
      return {
        key: "",
        url: "",
        error:
          "Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.",
      }
    }

    console.log("[v0] === SUPABASE UPLOAD DEBUG ===")
    console.log("[v0] Client type: ANON CLIENT (using NEXT_PUBLIC_SUPABASE_ANON_KEY)")
    console.log("[v0] Supabase URL:", ENV.NEXT_PUBLIC_SUPABASE_URL)
    console.log("[v0] File name:", file.name)
    console.log("[v0] File size:", file.size, "bytes")
    console.log("[v0] File type:", file.type)

    // Check current user session status
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    console.log("[v0] Current user session:", user ? `Authenticated as ${user.email}` : "NOT AUTHENTICATED")
    if (userError) {
      console.log("[v0] User session error:", userError)
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "pdf"
    const currentUserId = userId || user?.id

    let key: string
    if (currentUserId) {
      // User-specific path for authenticated users
      key = `reports/${currentUserId}/${Date.now()}-${crypto.randomUUID()}.${ext}`
    } else {
      // Fallback to generic path for unauthenticated users (public demo)
      key = `uploads/${Date.now()}-${crypto.randomUUID()}.${ext}`
    }

    console.log("[v0] Generated upload key:", key)
    console.log("[v0] User ID:", currentUserId || "anonymous")

    const bucketName = ENV.SUPABASE_BUCKET || "reports"
    console.log("[v0] Target bucket:", bucketName)
    console.log("[v0] Operation: UPLOAD (storage.from().upload())")

    // Upload to Supabase Storage
    console.log("[v0] Attempting upload to Supabase Storage...")
    const { data, error } = await supabase.storage.from(bucketName).upload(key, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("[v0] === UPLOAD FAILED ===")
      console.error("[v0] Error code:", error.name)
      console.error("[v0] Error message:", error.message)
      console.error("[v0] Full error object:", error)
      console.error("[v0] File:", "lib/supaUpload.ts")
      console.error("[v0] Line:", "43 (supabase.storage.from().upload())")

      // Check if it's an RLS policy issue
      if (
        error.message.includes("new row violates row-level security policy") ||
        error.message.includes("permission denied") ||
        error.message.includes("insufficient_privilege")
      ) {
        console.error("[v0] === RLS POLICY ISSUE DETECTED ===")
        console.error("[v0] Missing RLS policy for bucket:", bucketName)
        console.error("[v0] Required policy: Allow INSERT on storage.objects for authenticated users")
        console.error("[v0] Suggested policy SQL:")
        console.error(
          `[v0] CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = '${bucketName}' AND (storage.foldername(name))[1] = auth.uid()::text);`,
        )
      }

      return { key, url: "", error: error.message }
    }

    console.log("[v0] Upload successful! Data:", data)

    // Try to get public URL first (for public buckets)
    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(key)

    if (publicUrlData?.publicUrl) {
      const safeUrl = encodeURI(publicUrlData.publicUrl)
      console.log("[v0] Generated public URL:", safeUrl)
      return { key, url: safeUrl }
    }

    // Fallback: request signed URL from server (for private buckets)
    try {
      const signResponse = await fetch("/api/sign-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, expiresInSeconds: 600 }),
      })

      if (signResponse.ok) {
        const { signedUrl } = await signResponse.json()
        const safeUrl = encodeURI(signedUrl)
        console.log("[v0] Generated signed URL:", safeUrl)
        return { key, url: safeUrl }
      }
    } catch (signError) {
      console.error("[v0] Signed URL error:", signError)
    }

    return { key, url: "", error: "Failed to generate accessible URL" }
  } catch (error) {
    console.error("[v0] Upload failed with exception:", error)
    console.error("[v0] File:", "lib/supaUpload.ts")
    console.error("[v0] Exception type:", error instanceof Error ? error.constructor.name : typeof error)
    return {
      key: "",
      url: "",
      error: error instanceof Error ? error.message : "Upload failed",
    }
  }
}
