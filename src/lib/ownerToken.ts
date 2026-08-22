function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Random 32-byte owner token, returned once to the caller and never stored raw. */
export function generateOwnerToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return toHex(bytes.buffer)
}

export async function hashOwnerToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return toHex(digest)
}

export async function verifyOwnerToken(token: string, hash: string): Promise<boolean> {
  const candidate = await hashOwnerToken(token)
  return timingSafeEqual(candidate, hash)
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

/** Extracts a bearer token from an Authorization header, or null if absent/malformed. */
export function extractBearerToken(authorization: string | null): string | null {
  if (!authorization) return null
  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim())
  return match ? match[1]!.trim() : null
}
