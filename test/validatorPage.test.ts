import { describe, it, expect, vi, afterEach } from 'vitest'
import app from '../src/index'
import { makeTestEnv } from './testKv'
import type { ValidateResponseBody } from '../src/routes/validate'

describe('GET /validate', () => {
  it('serves the validator page', async () => {
    const env = makeTestEnv()
    const res = await app.request('/validate', {}, env)
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('text/html')
    const body = await res.text()
    expect(body).toContain('CIMD Validator')
  })
})

describe('POST /validate', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('rejects a non-object body', async () => {
    const env = makeTestEnv()
    const res = await app.request('/validate', { method: 'POST', body: JSON.stringify({}) }, env)
    expect(res.status).toBe(400)
  })

  it('validates a raw JSON document and reports errors', async () => {
    const env = makeTestEnv()
    const res = await app.request(
      '/validate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'json', value: '{"client_secret":"shh"}' }),
      },
      env,
    )
    expect(res.status).toBe(200)
    const body = (await res.json()) as ValidateResponseBody
    expect(body.valid).toBe(false)
    expect(body.errors.join()).toContain('client_secret MUST NOT be present')
    expect(body.warnings.join()).toContain('no "client_id"')
  })

  it('accepts a valid raw JSON document whose client_id matches its own URL', async () => {
    const env = makeTestEnv()
    const doc = {
      client_id: 'https://example.com/oauth/client-metadata.json',
      client_name: 'Dev App',
      token_endpoint_auth_method: 'none',
    }
    const res = await app.request(
      '/validate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'json', value: JSON.stringify(doc) }),
      },
      env,
    )
    const body = (await res.json()) as ValidateResponseBody
    expect(body.valid).toBe(true)
    expect(body.errors).toEqual([])
  })

  it('flags invalid JSON input', async () => {
    const env = makeTestEnv()
    const res = await app.request(
      '/validate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'json', value: '{not json' }),
      },
      env,
    )
    const body = (await res.json()) as ValidateResponseBody
    expect(body.valid).toBe(false)
    expect(body.errors[0]).toContain('not valid JSON')
  })

  it('rejects a client_id URL using http instead of https, without fetching', async () => {
    const env = makeTestEnv()
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const res = await app.request(
      '/validate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'url', value: 'http://example.com/client.json' }),
      },
      env,
    )
    const body = (await res.json()) as ValidateResponseBody
    expect(body.valid).toBe(false)
    expect(body.errors.join()).toContain('https scheme')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('refuses to fetch a loopback client_id host', async () => {
    const env = makeTestEnv()
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const res = await app.request(
      '/validate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'url', value: 'https://127.0.0.1/client.json' }),
      },
      env,
    )
    const body = (await res.json()) as ValidateResponseBody
    expect(body.valid).toBe(false)
    expect(body.errors.join()).toContain('private or loopback host')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('fetches a valid URL, checks the client_id match, and runs metadata validation', async () => {
    const env = makeTestEnv()
    const url = 'https://example.com/oauth/client-metadata.json'
    const doc = { client_id: url, client_name: 'Dev App', token_endpoint_auth_method: 'none' }
    const fetchSpy = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(doc), { status: 200, headers: { 'Content-Type': 'application/json' } }),
      )
    vi.stubGlobal('fetch', fetchSpy)

    const res = await app.request(
      '/validate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'url', value: url }),
      },
      env,
    )
    const body = (await res.json()) as ValidateResponseBody
    expect(body.valid).toBe(true)
    expect(body.document).toEqual(doc)
    expect(fetchSpy).toHaveBeenCalledWith(url, expect.objectContaining({ redirect: 'manual' }))
  })

  it('reports a client_id mismatch between the document and the fetched URL', async () => {
    const env = makeTestEnv()
    const url = 'https://example.com/oauth/client-metadata.json'
    const doc = { client_id: 'https://example.com/other.json' }
    const fetchSpy = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(doc), { status: 200, headers: { 'Content-Type': 'application/json' } }),
      )
    vi.stubGlobal('fetch', fetchSpy)

    const res = await app.request(
      '/validate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'url', value: url }),
      },
      env,
    )
    const body = (await res.json()) as ValidateResponseBody
    expect(body.valid).toBe(false)
    expect(body.errors.join()).toContain('does not exactly match')
  })

  it('treats a non-200 fetch response as invalid', async () => {
    const env = makeTestEnv()
    const url = 'https://example.com/oauth/client-metadata.json'
    const fetchSpy = vi.fn().mockResolvedValue(new Response('nope', { status: 404 }))
    vi.stubGlobal('fetch', fetchSpy)

    const res = await app.request(
      '/validate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'url', value: url }),
      },
      env,
    )
    const body = (await res.json()) as ValidateResponseBody
    expect(body.valid).toBe(false)
    expect(body.errors.join()).toContain('HTTP 404')
  })
})
