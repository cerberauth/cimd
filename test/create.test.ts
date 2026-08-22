import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import app from '../src/index'
import { makeTestEnv } from './testKv'
import { generateTestKeyPair, signTestJwt, mockJwks, type TestKeyPair } from './testAuth'

describe('POST /api/clients', () => {
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

  it('provisions a client and returns owner_token + document once', async () => {
    const env = makeTestEnv()
    const res = await app.request(
      '/api/clients',
      {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({
          client_name: 'Dev App',
          redirect_uris: ['http://localhost:3000/cb'],
        }),
      },
      env,
    )
    expect(res.status).toBe(201)
    const body = (await res.json()) as {
      client_id: string
      owner_token: string
      document: { client_id: string; client_id_expires_at: number }
    }
    expect(body.client_id).toBe(`${env.CIMD_SERVICE_ORIGIN}/c/${body.client_id.split('/c/')[1]}`)
    expect(body.owner_token).toMatch(/^[0-9a-f]{64}$/)
    expect(body.document.client_id).toBe(body.client_id)
    expect(body.document.client_id_expires_at).toBeGreaterThan(Math.floor(Date.now() / 1000))
  })

  it('rejects a request with no bearer token', async () => {
    const env = makeTestEnv()
    const res = await app.request(
      '/api/clients',
      { method: 'POST', body: JSON.stringify({ client_name: 'Dev App' }) },
      env,
    )
    expect(res.status).toBe(401)
  })

  it('rejects a request with an invalid bearer token', async () => {
    const env = makeTestEnv()
    const res = await app.request(
      '/api/clients',
      {
        method: 'POST',
        headers: { Authorization: 'Bearer not-a-real-jwt' },
        body: JSON.stringify({ client_name: 'Dev App' }),
      },
      env,
    )
    expect(res.status).toBe(401)
  })

  it('ignores a caller-supplied client_id', async () => {
    const env = makeTestEnv()
    const res = await app.request(
      '/api/clients',
      {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ client_id: 'https://evil.example.com/x' }),
      },
      env,
    )
    const body = (await res.json()) as { client_id: string }
    expect(body.client_id).not.toBe('https://evil.example.com/x')
    expect(body.client_id.startsWith(env.CIMD_SERVICE_ORIGIN)).toBe(true)
  })

  it('rejects client_secret', async () => {
    const env = makeTestEnv()
    const res = await app.request(
      '/api/clients',
      { method: 'POST', headers: authHeader, body: JSON.stringify({ client_secret: 'shh' }) },
      env,
    )
    expect(res.status).toBe(400)
  })

  it('rejects client_secret_expires_at', async () => {
    const env = makeTestEnv()
    const res = await app.request(
      '/api/clients',
      {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ client_secret_expires_at: 1 }),
      },
      env,
    )
    expect(res.status).toBe(400)
  })

  it('rejects forbidden token_endpoint_auth_method', async () => {
    const env = makeTestEnv()
    const res = await app.request(
      '/api/clients',
      {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ token_endpoint_auth_method: 'client_secret_basic' }),
      },
      env,
    )
    expect(res.status).toBe(400)
  })

  it('rejects private_key_jwt without jwks/jwks_uri', async () => {
    const env = makeTestEnv()
    const res = await app.request(
      '/api/clients',
      {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ token_endpoint_auth_method: 'private_key_jwt' }),
      },
      env,
    )
    expect(res.status).toBe(400)
  })

  it('rejects a jwks containing private key material', async () => {
    const env = makeTestEnv()
    const res = await app.request(
      '/api/clients',
      {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ jwks: { keys: [{ kty: 'RSA', d: 'secret' }] } }),
      },
      env,
    )
    expect(res.status).toBe(400)
  })

  it('rejects malformed redirect_uris', async () => {
    const env = makeTestEnv()
    const res = await app.request(
      '/api/clients',
      {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ redirect_uris: ['not-a-uri'] }),
      },
      env,
    )
    expect(res.status).toBe(400)
  })

  it('rejects an oversized document', async () => {
    const env = makeTestEnv()
    const res = await app.request(
      '/api/clients',
      {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ client_name: 'x'.repeat(6000) }),
      },
      env,
    )
    expect(res.status).toBe(400)
  })

  it('rejects unknown non-namespaced top-level fields', async () => {
    const env = makeTestEnv()
    const res = await app.request(
      '/api/clients',
      { method: 'POST', headers: authHeader, body: JSON.stringify({ made_up_field: 'x' }) },
      env,
    )
    expect(res.status).toBe(400)
  })

  it('rejects invalid JSON bodies', async () => {
    const env = makeTestEnv()
    const res = await app.request('/api/clients', { method: 'POST', headers: authHeader, body: '{not json' }, env)
    expect(res.status).toBe(400)
  })
})
