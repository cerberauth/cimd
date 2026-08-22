import type { Context } from 'hono'
import type { Env } from '../types'
import { getClientRecord } from '../lib/kv'
import { extractBearerToken, verifyOwnerToken } from '../lib/ownerToken'
import { jsonOk, jsonError } from '../lib/responses'

export async function getClient(c: Context<{ Bindings: Env }>): Promise<Response> {
  const slug = c.req.param('id')!
  const record = await getClientRecord(c.env, slug)
  if (!record) {
    return jsonError(404, 'client metadata document not found')
  }

  const token = extractBearerToken(c.req.header('Authorization') ?? null)
  if (!token || !(await verifyOwnerToken(token, record.ownerTokenHash))) {
    return jsonError(401, 'missing or invalid owner token')
  }

  return jsonOk({
    client_id: record.document.client_id,
    created_at: record.createdAt,
    expires_at: record.expiresAt,
    document: record.document,
  })
}
