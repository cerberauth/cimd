import type { Env, StoredRecord } from '../types'

const KEY_PREFIX = 'client:'

function keyFor(slug: string): string {
  return `${KEY_PREFIX}${slug}`
}

export async function getClientRecord(env: Env, slug: string): Promise<StoredRecord | null> {
  const raw = await env.CIMD_CLIENTS.get(keyFor(slug), 'json')
  return (raw as StoredRecord | null) ?? null
}

export async function putClientRecord(env: Env, slug: string, record: StoredRecord): Promise<void> {
  const now = Math.floor(Date.now() / 1000)
  const expirationTtl = Math.max(60, record.expiresAt - now)
  await env.CIMD_CLIENTS.put(keyFor(slug), JSON.stringify(record), { expirationTtl })
}

export async function deleteClientRecord(env: Env, slug: string): Promise<void> {
  await env.CIMD_CLIENTS.delete(keyFor(slug))
}
