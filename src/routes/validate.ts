import type { Context } from 'hono'
import { validateClientMetadata, validateClientIdUrl, isPrivateHostname } from '../lib/validate'
import { jsonOk, jsonError } from '../lib/responses'

const MAX_FETCH_BYTES = 5 * 1024
const FETCH_TIMEOUT_MS = 5000

interface ValidateRequestBody {
  type: 'url' | 'json'
  value: string
}

export interface ValidateResponseBody {
  valid: boolean
  errors: string[]
  warnings: string[]
  document: Record<string, unknown> | null
}

function isValidateRequestBody(body: unknown): body is ValidateRequestBody {
  if (typeof body !== 'object' || body === null) return false
  const b = body as Record<string, unknown>
  return (b.type === 'url' || b.type === 'json') && typeof b.value === 'string'
}

/**
 * Public, unauthenticated endpoint backing the /validate playground page.
 * Unlike lib/validate's validateClientMetadata (which runs on caller input
 * BEFORE client_id is assigned), this validates a whole, already-hosted CIMD
 * document — including the client_id URL itself and its match to the document.
 */
export async function validateClientDocument(c: Context): Promise<Response> {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return jsonError(400, 'request body must be valid JSON')
  }
  if (!isValidateRequestBody(body)) {
    return jsonError(400, 'request body must be {"type":"url"|"json","value":string}')
  }

  const errors: string[] = []
  const warnings: string[] = []
  let document: Record<string, unknown> | undefined

  if (body.type === 'url') {
    document = await validateFromUrl(body.value.trim(), errors, warnings)
  } else {
    document = validateFromJson(body.value, errors, warnings)
  }

  if (document) {
    const { client_id: _clientId, client_id_expires_at: _expiresAt, ...rest } = document
    const result = validateClientMetadata(rest)
    errors.push(...result.errors)
    warnings.push(...result.warnings)
  }

  const response: ValidateResponseBody = {
    valid: errors.length === 0,
    errors,
    warnings,
    document: document ?? null,
  }
  return jsonOk(response)
}

async function validateFromUrl(
  rawUrl: string,
  errors: string[],
  warnings: string[],
): Promise<Record<string, unknown> | undefined> {
  const urlCheck = validateClientIdUrl(rawUrl)
  errors.push(...urlCheck.errors)
  warnings.push(...urlCheck.warnings)
  if (urlCheck.errors.length > 0) return undefined

  const target = new URL(rawUrl)
  if (isPrivateHostname(target.hostname)) {
    errors.push(`refusing to fetch private or loopback host "${target.hostname}"`)
    return undefined
  }

  let res: Response
  try {
    res = await fetch(target.toString(), {
      redirect: 'manual',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: 'application/json' },
    })
  } catch (e) {
    errors.push(`failed to fetch client_id URL: ${(e as Error).message}`)
    return undefined
  }

  if (res.status !== 200) {
    errors.push(`fetching client_id URL returned HTTP ${res.status}, expected 200 (redirects are not followed)`)
    return undefined
  }

  const text = await res.text()
  const byteLength = new TextEncoder().encode(text).byteLength
  if (byteLength > MAX_FETCH_BYTES) {
    errors.push(`fetched document is ${byteLength} bytes, exceeds max of ${MAX_FETCH_BYTES} bytes`)
    return undefined
  }

  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('json')) {
    warnings.push(`response Content-Type is "${contentType || '(none)'}", expected application/json`)
  }

  const document = parseJsonObject(text, errors)
  if (!document) return undefined

  if (typeof document.client_id !== 'string') {
    errors.push('document is missing required "client_id" field')
  } else if (document.client_id !== rawUrl) {
    errors.push(`document "client_id" ("${document.client_id}") does not exactly match the fetched URL ("${rawUrl}")`)
  }

  return document
}

function validateFromJson(raw: string, errors: string[], warnings: string[]): Record<string, unknown> | undefined {
  const document = parseJsonObject(raw, errors)
  if (!document) return undefined

  if (document.client_id === undefined) {
    warnings.push('document has no "client_id" — a served CIMD document must include one matching its own URL')
  } else if (typeof document.client_id !== 'string') {
    errors.push('client_id must be a string')
  } else {
    const urlCheck = validateClientIdUrl(document.client_id)
    errors.push(...urlCheck.errors)
    warnings.push(...urlCheck.warnings)
  }

  return document
}

function parseJsonObject(raw: string, errors: string[]): Record<string, unknown> | undefined {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (e) {
    errors.push(`not valid JSON: ${(e as Error).message}`)
    return undefined
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    errors.push('input must be a JSON object')
    return undefined
  }
  return parsed as Record<string, unknown>
}
