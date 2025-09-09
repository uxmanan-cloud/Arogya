import { ENV } from "./safe-env"

export async function renderPdf(payload: any): Promise<{ url: string; expiresAt: string }> {
  if (ENV.MOCK_MODE || !ENV.PDF_API_KEY || !ENV.PDF_TEMPLATE_ID) {
    const url = `${ENV.APP_BASE_URL || "http://localhost:3000"}/mock/report-${Date.now()}.pdf`
    const expiresAt = new Date(Date.now() + 3600_000).toISOString()
    return { url, expiresAt }
  }
  const url = `${ENV.APP_BASE_URL || "http://localhost:3000"}/pdf/${Date.now()}.pdf`
  const expiresAt = new Date(Date.now() + 3600_000).toISOString()
  return { url, expiresAt }
}
