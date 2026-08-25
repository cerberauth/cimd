import { describe, it, expect } from 'vitest'
import app from '../src/index'
import { makeTestEnv } from './testKv'

describe('static CIMD templates', () => {
  it('does not route template requests through Hono', async () => {
    const env = makeTestEnv()
    const res = await app.request('/react-spa-client.json', {}, env)
    expect(res.status).toBe(404)
  })
})
