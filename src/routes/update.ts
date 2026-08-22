import type { Context } from 'hono'
import type { ClientMetadataDocument, Env, StoredRecord } from '../types'
import { validateClientMetadata } from '../lib/validate'
import { getClientRecord, putClientRecord } from '../lib/kv'
import { extractBearerToken, verifyOwnerToken } from '../lib/ownerToken'
import { jsonOk, jsonError } from '../lib/responses'

export async function updateClient(c: Context<{ Bindings: Env }>): Promise<Response> {
  const slug = c.req.param('id')!
  const env = c.env
  const record = await getClientRecord(env, slug)
  if (!record) {
    return jsonError(404, 'client metadata document not found')
  }

  const token = extractBearerToken(c.req.header('Authorization') ?? null)
  if (!token || !(await verifyOwnerToken(token, record.ownerTokenHash))) {
    return jsonError(401, 'missing or invalid owner token')
  }

  let input: Record<string, unknown>
  try {
    input = await c.req.json()
  } catch {
    return jsonError(400, 'request body must be valid JSON')
  }
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return jsonError(400, 'request body must be a JSON object')
  }

  const {
    client_id: _ignoredId,
    client_id_expires_at: _ignoredExp,
    extend_ttl_seconds: _ignoredExtend,
    ...rest
  } = input

  const result = validateClientMetadata(rest)
  if (!result.valid) {
    return jsonError(400, 'client metadata document is invalid', result.errors)
  }

  const maxTtlSeconds = Number(env.CIMD_MAX_TTL_SECONDS) || 30 * 24 * 60 * 60
  const requestedExtension = input.extend_ttl_seconds
  let expiresAt = record.expiresAt
  if (typeof requestedExtension === 'number' && requestedExtension > 0) {
    const maxExpiresAt = record.createdAt + maxTtlSeconds
    expiresAt = Math.min(record.expiresAt + requestedExtension, maxExpiresAt)
  }

  const document: ClientMetadataDocument = {
    ...(rest as ClientMetadataDocument),
    client_id: record.document.client_id,
    client_id_expires_at: expiresAt,
  }

  const finalCheck = validateClientMetadata(document)
  if (!finalCheck.valid) {
    return jsonError(400, 'client metadata document is invalid', finalCheck.errors)
  }

  const updated: StoredRecord = {
    document,
    createdAt: record.createdAt,
    expiresAt,
    ownerTokenHash: record.ownerTokenHash,
  }

  await putClientRecord(env, slug, updated)

  return jsonOk({
    client_id: document.client_id,
    expires_at: expiresAt,
    document,
  })
}
