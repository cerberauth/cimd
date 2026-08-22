import type { Context } from 'hono'
import type { ClientMetadataDocument, Env, StoredRecord } from '../types'
import { validateClientMetadata } from '../lib/validate'
import { generateSlug } from '../lib/slug'
import { generateOwnerToken, hashOwnerToken } from '../lib/ownerToken'
import { putClientRecord } from '../lib/kv'
import { jsonCreated, jsonError } from '../lib/responses'

export async function createClient(c: Context<{ Bindings: Env }>): Promise<Response> {
  let input: Record<string, unknown>
  try {
    input = await c.req.json()
  } catch {
    return jsonError(400, 'request body must be valid JSON')
  }
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return jsonError(400, 'request body must be a JSON object')
  }

  const { client_id: _ignoredId, client_id_expires_at: _ignoredExp, ...rest } = input

  const result = validateClientMetadata(rest)
  if (!result.valid) {
    return jsonError(400, 'client metadata document is invalid', result.errors)
  }

  const env = c.env
  const slug = generateSlug()
  const clientId = `${env.CIMD_SERVICE_ORIGIN}/c/${slug}`
  const now = Math.floor(Date.now() / 1000)
  const ttlSeconds = Number(env.CIMD_DEFAULT_TTL_SECONDS) || 7 * 24 * 60 * 60
  const expiresAt = now + ttlSeconds

  const document: ClientMetadataDocument = {
    ...(rest as ClientMetadataDocument),
    client_id: clientId,
    client_id_expires_at: expiresAt,
  }

  const finalCheck = validateClientMetadata(document)
  if (!finalCheck.valid) {
    return jsonError(400, 'client metadata document is invalid', finalCheck.errors)
  }

  const ownerToken = generateOwnerToken()
  const ownerTokenHash = await hashOwnerToken(ownerToken)

  const record: StoredRecord = {
    document,
    createdAt: now,
    expiresAt,
    ownerTokenHash,
  }

  await putClientRecord(env, slug, record)

  return jsonCreated({
    client_id: clientId,
    owner_token: ownerToken,
    expires_at: expiresAt,
    document,
  })
}
