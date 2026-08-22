import { describe, it, expect } from 'vitest'
import app from '../src/index'
import { makeTestEnv } from './testKv'

describe('GET /', () => {
  it('serves the HTML landing page', async () => {
    const env = makeTestEnv()
    const res = await app.request('/', {}, env)
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('text/html')
    const body = await res.text()
    expect(body).toContain('<!DOCTYPE html>')
    expect(body).toContain(env.CIMD_SERVICE_ORIGIN)
  })
})
