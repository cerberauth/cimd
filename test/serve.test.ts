import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import app from '../src/index'
import { makeTestEnv } from './testKv'
import { generateTestKeyPair, signTestJwt, mockJwks, type TestKeyPair } from './testAuth'

describe('GET /c/:id', () => {
  let keyPair: TestKeyPair
  let authHeader: Record<string, string>
  let restoreFetch: () => void

  beforeAll(async () => {
    keyPair = await generateTestKeyPair()
    const token = await signTestJwt({ sub: 'test-caller' }, keyPair)
    authHeader = { Authorization: `Bearer ${token}` }
    restoreFetch = mockJwks('https://auth.test/.well-known/jwks.json', keyPair)
  })

  afterAll(() => {
    restoreFetch()
  })

  async function createClient(env: ReturnType<typeof makeTestEnv>, body: Record<string, unknown> = {}) {
    const res = await app.request(
      '/api/clients',
      { method: 'POST', headers: authHeader, body: JSON.stringify(body) },
      env,
    )
    return res.json() as Promise<{
      client_id: string
      owner_token: string
      document: Record<string, unknown>
    }>
  }

  it('serves the stored document with 200 and a public cache header', async () => {
    const env = makeTestEnv()
    const created = await createClient(env, { client_name: 'Dev App' })
    const slug = created.client_id.split('/c/')[1]

    const res = await app.request(`/c/${slug}`, {}, env)
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('application/json')
    expect(res.headers.get('Cache-Control')).toMatch(/^public, max-age=\d+$/)

    const body = await res.json()
    expect(body).toEqual(created.document)
  })

  it('returns 404 with no-store for an unknown id', async () => {
    const env = makeTestEnv()
    const res = await app.request('/c/does-not-exist', {}, env)
    expect(res.status).toBe(404)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })

  it('returns 404 with no-store for an expired document', async () => {
    const env = makeTestEnv({ CIMD_DEFAULT_TTL_SECONDS: '-1' })
    const created = await createClient(env, { client_name: 'Already Expired' })
    const slug = created.client_id.split('/c/')[1]

    const res = await app.request(`/c/${slug}`, {}, env)
    expect(res.status).toBe(404)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })
})
