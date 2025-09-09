export function assertAbsoluteHttps(url: string): void {
  if (!url.startsWith("https://")) {
    throw new Error(`URL must start with https://, got: ${url}`)
  }

  try {
    new URL(url)
  } catch (error) {
    throw new Error(`Invalid URL format: ${url}`)
  }
}

export function safeEncodeURI(url: string): string {
  assertAbsoluteHttps(url)
  return encodeURI(url)
}
