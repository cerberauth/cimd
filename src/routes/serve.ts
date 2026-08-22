import type { Context } from 'hono'
import type { Env } from '../types'
import { getClientRecord } from '../lib/kv'
import { jsonError } from '../lib/responses'

export async function serveClientDocument(c: Context<{ Bindings: Env }>): Promise<Response> {
  const slug = c.req.param('id')!
  const record = await getClientRecord(c.env, slug)

  const now = Math.floor(Date.now() / 1000)
  if (!record || record.expiresAt <= now) {
    return jsonError(404, 'client metadata document not found')
  }

  const secondsRemaining = record.expiresAt - now
  return new Response(JSON.stringify(record.document), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=${secondsRemaining}`,
    },
  })
}
