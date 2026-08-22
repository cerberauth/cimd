const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

/** Opaque base62 slug, 16 chars — no meaning, not derived from any input. */
export function generateSlug(length = 16): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  let out = ''
  for (let i = 0; i < length; i++) {
    out += BASE62[bytes[i]! % BASE62.length]
  }
  return out
}
