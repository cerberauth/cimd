import type { Env } from '../src/types'

/** Minimal in-memory KVNamespace stand-in, enough for our get/put/delete usage. */
export function makeTestEnv(overrides: Partial<Env> = {}): Env {
  const store = new Map<string, string>()
  const kv = {
    async get(key: string, type?: string) {
      const raw = store.get(key)
      if (raw === undefined) return null
      return type === 'json' ? JSON.parse(raw) : raw
    },
    async put(key: string, value: string, _opts?: unknown) {
      store.set(key, value)
    },
    async delete(key: string) {
      store.delete(key)
    },
  } as unknown as KVNamespace

  return {
    CIMD_CLIENTS: kv,
    CIMD_SERVICE_ORIGIN: 'https://cimd.cerberauth.com',
    CIMD_DEFAULT_TTL_SECONDS: '604800',
    CIMD_MAX_TTL_SECONDS: '2592000',
    CIMD_API_JWKS_URI: 'https://auth.test/.well-known/jwks.json',
    ...overrides,
  }
}
