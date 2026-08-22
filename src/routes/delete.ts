import type { Context } from 'hono'
import type { Env } from '../types'
import { getClientRecord, deleteClientRecord } from '../lib/kv'
import { extractBearerToken, verifyOwnerToken } from '../lib/ownerToken'
import { jsonError } from '../lib/responses'

export async function deleteClient(c: Context<{ Bindings: Env }>): Promise<Response> {
  const slug = c.req.param('id')!
  const record = await getClientRecord(c.env, slug)
  if (!record) {
    return jsonError(404, 'client metadata document not found')
  }

  const token = extractBearerToken(c.req.header('Authorization') ?? null)
  if (!token || !(await verifyOwnerToken(token, record.ownerTokenHash))) {
    return jsonError(401, 'missing or invalid owner token')
  }

  await deleteClientRecord(c.env, slug)
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
}
