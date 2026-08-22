import { describe, it, expect } from 'vitest'
import app from '../src/index'
import { makeTestEnv } from './testKv'

describe('/api/* JWT gate', () => {
  it.each([
    ['GET', '/api/clients/abc'],
    ['PUT', '/api/clients/abc'],
    ['DELETE', '/api/clients/abc'],
  ])('rejects %s %s without a bearer token', async (method, path) => {
    const env = makeTestEnv()
    const res = await app.request(path, { method }, env)
    expect(res.status).toBe(401)
  })
})
