import type { ClientMetadataDocument, JsonWebKey } from '../types'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

const MAX_DOCUMENT_BYTES = 5 * 1024

const FORBIDDEN_AUTH_METHODS = new Set(['client_secret_post', 'client_secret_basic', 'client_secret_jwt'])

const ALLOWED_AUTH_METHODS = new Set(['none', 'private_key_jwt'])

/** RFC 7591 Dynamic Client Registration Metadata registry, plus our client_id_expires_at extension. */
const KNOWN_TOP_LEVEL_FIELDS = new Set([
  'client_id',
  'client_id_expires_at',
  'client_name',
  'redirect_uris',
  'token_endpoint_auth_method',
  'grant_types',
  'response_types',
  'scope',
  'jwks',
  'jwks_uri',
  'logo_uri',
  'client_uri',
  'policy_uri',
  'tos_uri',
  'contacts',
  'software_id',
  'software_version',
])

/** Private/symmetric JWK members that must never appear in a public jwks. */
const PRIVATE_JWK_MEMBERS = ['d', 'p', 'q', 'dp', 'dq', 'qi', 'k']

function isNamespacedExtensionField(key: string): boolean {
  // Lenient convention: treat a colon-separated or URI-like key as an
  // extension namespace (e.g. "urn:example:foo", "https://example.com/ext#x").
  return key.includes(':')
}

function isValidAbsoluteUri(value: unknown): boolean {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    return Boolean(url.protocol)
  } catch {
    return false
  }
}

const PRIVATE_HOSTNAME_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^0\.0\.0\.0$/,
  /^::1$/,
  /^169\.254\./,
]

/** Best-effort SSRF guard for hostnames the validator fetches on the caller's behalf. */
export function isPrivateHostname(hostname: string): boolean {
  return PRIVATE_HOSTNAME_PATTERNS.some((pattern) => pattern.test(hostname))
}

/**
 * Structural checks the CIMD draft places on the client_id URL itself,
 * independent of the document it resolves to (draft-ietf-oauth-client-id-metadata-document §4).
 */
export function validateClientIdUrl(rawUrl: string): { errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    errors.push('client_id must be a valid absolute URL')
    return { errors, warnings }
  }

  if (url.protocol !== 'https:') {
    errors.push('client_id must use the https scheme')
  }
  if (url.username || url.password) {
    errors.push('client_id must not contain userinfo (e.g. "user:pass@host")')
  }
  if (!url.pathname || url.pathname === '/') {
    errors.push('client_id must contain a path component')
  }
  if (url.pathname.split('/').some((segment) => segment === '.' || segment === '..')) {
    errors.push('client_id path must not contain "." or ".." segments')
  }
  if (url.hash) {
    errors.push('client_id must not contain a fragment')
  }
  if (url.search) {
    warnings.push('client_id should not contain a query component')
  }

  return { errors, warnings }
}

/**
 * Pure validation function for a Client ID Metadata Document. Runs against
 * caller-supplied input BEFORE client_id / client_id_expires_at are set by
 * the server, so those two fields are not checked here.
 */
export function validateClientMetadata(doc: Record<string, unknown>): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Rule 2: no shared-secret credential material may appear at all.
  if ('client_secret' in doc) {
    errors.push('client_secret MUST NOT be present')
  }
  if ('client_secret_expires_at' in doc) {
    errors.push('client_secret_expires_at MUST NOT be present')
  }

  // Rule 3 + default: token_endpoint_auth_method restrictions.
  const authMethod = doc.token_endpoint_auth_method
  if (authMethod !== undefined) {
    if (typeof authMethod !== 'string') {
      errors.push('token_endpoint_auth_method must be a string')
    } else if (FORBIDDEN_AUTH_METHODS.has(authMethod)) {
      errors.push(`token_endpoint_auth_method "${authMethod}" is a shared-secret method and MUST NOT be used`)
    } else if (!ALLOWED_AUTH_METHODS.has(authMethod)) {
      errors.push(`token_endpoint_auth_method must be one of: ${[...ALLOWED_AUTH_METHODS].join(', ')}`)
    }
  }

  // Rule 4: private_key_jwt requires a public key source.
  if (authMethod === 'private_key_jwt' && !doc.jwks && !doc.jwks_uri) {
    errors.push('token_endpoint_auth_method=private_key_jwt requires jwks or jwks_uri')
  }

  // Rule 5: inline jwks must be well-formed and public-key-only.
  if (doc.jwks !== undefined) {
    errors.push(...validateJwks(doc.jwks))
  }

  // Rule 6: redirect_uris, if present, must all be valid absolute URIs.
  if (doc.redirect_uris !== undefined) {
    if (!Array.isArray(doc.redirect_uris)) {
      errors.push('redirect_uris must be an array of strings')
    } else if (doc.redirect_uris.length === 0) {
      errors.push('redirect_uris must not be empty when present')
    } else {
      doc.redirect_uris.forEach((uri, i) => {
        if (!isValidAbsoluteUri(uri)) {
          errors.push(`redirect_uris[${i}] is not a valid absolute URI`)
        }
      })
    }
  }

  if (doc.jwks_uri !== undefined && !isValidAbsoluteUri(doc.jwks_uri)) {
    errors.push('jwks_uri is not a valid absolute URI')
  }
  if (doc.logo_uri !== undefined && !isValidAbsoluteUri(doc.logo_uri)) {
    errors.push('logo_uri is not a valid absolute URI')
  }
  if (doc.client_uri !== undefined && !isValidAbsoluteUri(doc.client_uri)) {
    errors.push('client_uri is not a valid absolute URI')
  }
  if (doc.policy_uri !== undefined && !isValidAbsoluteUri(doc.policy_uri)) {
    errors.push('policy_uri is not a valid absolute URI')
  }
  if (doc.tos_uri !== undefined && !isValidAbsoluteUri(doc.tos_uri)) {
    errors.push('tos_uri is not a valid absolute URI')
  }

  // Rule 8: unknown top-level fields are rejected unless they look namespaced.
  for (const key of Object.keys(doc)) {
    if (KNOWN_TOP_LEVEL_FIELDS.has(key)) continue
    if (isNamespacedExtensionField(key)) {
      warnings.push(`unrecognized namespaced extension field "${key}" allowed`)
    } else {
      errors.push(`unknown top-level property "${key}" is not in the RFC 7591 registry`)
    }
  }

  // Rule 7: overall document size, enforced last against the full serialization.
  const size = new TextEncoder().encode(JSON.stringify(doc)).byteLength
  if (size > MAX_DOCUMENT_BYTES) {
    errors.push(`document is ${size} bytes, exceeds max of ${MAX_DOCUMENT_BYTES} bytes`)
  }

  return { valid: errors.length === 0, errors, warnings }
}

function validateJwks(jwks: unknown): string[] {
  const errors: string[] = []
  if (typeof jwks !== 'object' || jwks === null || Array.isArray(jwks)) {
    return ['jwks must be an object with a keys array']
  }
  const keys = (jwks as { keys?: unknown }).keys
  if (!Array.isArray(keys)) {
    return ['jwks.keys must be an array']
  }
  keys.forEach((key, i) => {
    if (typeof key !== 'object' || key === null) {
      errors.push(`jwks.keys[${i}] must be an object`)
      return
    }
    const jwk = key as JsonWebKey
    if (typeof jwk.kty !== 'string') {
      errors.push(`jwks.keys[${i}] missing required "kty"`)
    }
    for (const member of PRIVATE_JWK_MEMBERS) {
      if (member in jwk) {
        errors.push(`jwks.keys[${i}] contains private/symmetric key member "${member}" — only public keys allowed`)
      }
    }
  })
  return errors
}

/** Full document (including server-assigned client_id) size check used by the serve path. */
export function documentSizeBytes(doc: ClientMetadataDocument): number {
  return new TextEncoder().encode(JSON.stringify(doc)).byteLength
}
